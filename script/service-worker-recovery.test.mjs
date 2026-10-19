import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createLoader } from "./test-utils.mjs";

const origin = "https://monitor.example.test";
const worker = { scriptURL: `${origin}/sw.js` };

function fixture({ registration, controller = null } = {}) {
  return createLoader({
    window: { location: { origin } },
    navigator: { serviceWorker: {
      controller,
      getRegistration: async (scope) => {
        assert.equal(scope, "/");
        return registration;
      },
    } },
  })("src/lib/serviceWorkerRecovery.ts").retireKomariServiceWorker;
}

test("retires the known root worker, including a waiting installation", async () => {
  let removed = 0;
  for (const state of ["active", "waiting", "installing"]) {
    const retire = fixture({ registration: {
      scope: `${origin}/`, [state]: worker,
      unregister: async () => { removed++; return true; },
    } });
    assert.equal(await retire(), true);
  }
  assert.equal(removed, 3);
});

test("leaves unrelated and narrower worker registrations alone", async () => {
  for (const registration of [
    { scope: `${origin}/`, active: { scriptURL: `${origin}/custom-worker.js` } },
    { scope: `${origin}/other/`, active: worker },
    { scope: `${origin}/`, active: { scriptURL: "https://other.example/sw.js" } },
  ]) {
    registration.unregister = () => { throw new Error("Unrelated worker removed"); };
    assert.equal(await fixture({ registration })(), false);
  }
});

test("recognizes a document still controlled by an already unregistered worker", async () => {
  assert.equal(await fixture({ controller: worker })(), true);
  assert.equal(await fixture()(), false);
  assert.equal(await fixture({ controller: { scriptURL: `${origin}/other.js` } })(), false);
  assert.equal(await fixture({ controller: worker, registration: {
    scope: `${origin}/`, active: worker, unregister: async () => false,
  } })(), true);
});

test("handles unsupported browsers and preserves unregister failures", async () => {
  const retire = createLoader({ navigator: {} })("src/lib/serviceWorkerRecovery.ts").retireKomariServiceWorker;
  assert.equal(await retire(), false);
  assert.equal(await fixture({ registration: {
    scope: `${origin}/`, active: worker, unregister: async () => false,
  } })(), false);
  await assert.rejects(fixture({ registration: {
    scope: `${origin}/`, active: worker,
    unregister: async () => { throw new Error("Blocked"); },
  } })(), /Blocked/);
});

test("replacement worker takes over without caching, deleting data or navigating tabs", async () => {
  const handlers = new Map();
  const calls = [];
  vm.runInNewContext(readFileSync("public/sw.js", "utf8"), { self: {
    addEventListener: (name, handler) => handlers.set(name, handler),
    skipWaiting: async () => calls.push("skipWaiting"),
    clients: { claim: async () => calls.push("claim") },
    registration: { unregister: async () => calls.push("unregister") },
  } });
  assert.deepEqual([...handlers.keys()], ["install", "activate"]);
  for (const name of ["install", "activate"]) {
    let completion;
    handlers.get(name)({ waitUntil: (promise) => { completion = promise; } });
    await completion;
  }
  assert.deepEqual(calls, ["skipWaiting", "claim", "unregister"]);
});

test("system paths never render the monitor shell or dashboard without providers", () => {
  const navigation = createLoader()("src/lib/spaNavigation.ts");
  for (const pathname of ["/admin", "/admin/dashboard", "/admin/settings/site", "/terminal"]) {
    const mocks = {
      "@/hooks/useSpaPathname": { useSpaPathname: () => pathname },
      "@/lib/spaNavigation": navigation,
      "@/components/loading": { __esModule: true, default: "loading" },
    };
    for (const path of ["NavBar", "Footer", "RemainingValueCalculator", "AnnouncementBanner", "MonitorDataProviders", "DashboardContent", "instance/InstancePage"]) {
      mocks[`@/components/${path}`] = { __esModule: true, default: path };
    }
    const load = createLoader({}, mocks);
    const AppShell = load("src/components/AppShell.tsx").default;
    const Page = load("src/app/page.tsx").default;
    assert.equal(AppShell({ children: "dashboard" }).type, "loading");
    assert.equal(Page(), null);
  }
});

test("recovery reloads only a retired backend document and tolerates Strict Mode", async () => {
  for (const pathname of ["/", "/instance/node-1", "/admin/dashboard"]) {
    const effects = [];
    let retireCalls = 0, reloads = 0, resolve;
    const pending = new Promise((done) => { resolve = done; });
    const Component = createLoader({
      window: { location: { pathname, reload: () => { reloads++; } } },
    }, {
      react: { useEffect: (effect) => effects.push(effect) },
      "@/lib/spaNavigation": createLoader()("src/lib/spaNavigation.ts"),
      "@/lib/serviceWorkerRecovery": {
        retireKomariServiceWorker: () => { retireCalls++; return pending; },
      },
    })("src/components/ServiceWorkerRecovery.tsx").default;
    Component();
    const cleanup = effects[0]();
    cleanup();
    const finalCleanup = effects[0]();
    resolve(true);
    await pending;
    assert.equal(retireCalls, 1);
    assert.equal(reloads, pathname.startsWith("/admin") ? 1 : 0);
    finalCleanup();
  }
});
