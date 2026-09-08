import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, delay } from "./test-utils.mjs";

test("independent tabs serialize read/merge/write through Web Locks", async () => {
  let server = { color: "old", layout: "old", announcement: { enabled: true } };
  let lock = Promise.resolve();
  const locks = { request: (_name, _options, callback) => {
    const result = lock.then(callback);
    lock = result.catch(() => {});
    return result;
  } };
  const api = {
    getSettings: async () => { const data = structuredClone(server); await delay(); return { theme_settings: data }; },
    updateSettings: async (value) => { await delay(); server = value.theme_settings; },
  };
  const tab = () => createLoader({ navigator: { locks } }, { "./api": api })("src/lib/themeSettings.ts");
  const a = tab(), b = tab();
  await Promise.all([
    a.updateThemeSettings((s) => ({ ...s, color: "new" })),
    b.updateThemeSettings((s) => ({ ...s, layout: "new" })),
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(server)), { color: "new", layout: "new", announcement: { enabled: true } });
});

test("a failed settings write does not poison later saves", async () => {
  let writes = 0;
  const { updateThemeSettings } = createLoader({}, { "./api": {
    getSettings: async () => ({ theme_settings: {} }),
    updateSettings: async () => { if (++writes === 1) throw new Error("offline"); },
  } })("src/lib/themeSettings.ts");
  const results = await Promise.allSettled([
    updateThemeSettings((s) => s), updateThemeSettings((s) => s),
  ]);
  assert.deepEqual(results.map((r) => r.status), ["rejected", "fulfilled"]);
  assert.equal(writes, 2);
});
