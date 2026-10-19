import assert from "node:assert/strict";
import test from "node:test";
import { createLoader } from "./test-utils.mjs";

const { isMonitorRoute, isKomariBackendRoute } = createLoader()("src/lib/spaNavigation.ts");

test("monitor route boundary includes dashboard and instance pages only", () => {
  assert.equal(isMonitorRoute("/"), true);
  assert.equal(isMonitorRoute(""), true);
  assert.equal(isMonitorRoute("/instance/node-1"), true);
  assert.equal(isMonitorRoute("/instance/node-1/"), true);
  assert.equal(isMonitorRoute("/settings"), false);
  assert.equal(isMonitorRoute("/settings/"), false);
  assert.equal(isMonitorRoute("/admin"), false);
  assert.equal(isMonitorRoute("/instance"), false);
});

test("backend boundary matches system paths without matching similarly named pages", () => {
  for (const path of ["/admin", "/admin/", "/admin/dashboard", "/terminal", "/terminal/node-1"]) {
    assert.equal(isKomariBackendRoute(path), true);
  }
  for (const path of ["/", "/instance/node-1", "/administrator", "/terminal-info"]) {
    assert.equal(isKomariBackendRoute(path), false);
  }
});
