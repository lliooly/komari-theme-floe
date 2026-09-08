import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createPreviewServer } from "./preview.mjs";

test("preview serves SPA routes, proxies API requests and rejects unsafe files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "floe-preview-"));
  const backend = createServer((req, res) => res.end(`${req.method} ${req.url}`));
  let preview;
  try {
    await writeFile(join(dir, "index.html"), "<h1>Floe</h1>");
    await writeFile(join(dir, "app.js"), "console.log('Floe')");
    await writeFile(join(dir, ".secret"), "hidden");
    await symlink(import.meta.filename, join(dir, "outside.txt"));
    backend.listen(0, "127.0.0.1"); await once(backend, "listening");
    preview = createPreviewServer({ directory: dir, target: `http://127.0.0.1:${backend.address().port}` });
    preview.listen(0, "127.0.0.1"); await once(preview, "listening");
    const base = `http://127.0.0.1:${preview.address().port}`;
    for (const path of ["/", "/settings?embedded=1", "/instance/test-node"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), "<h1>Floe</h1>");
    }
    const head = await fetch(base + "/app.js", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.match(head.headers.get("content-type"), /javascript/);
    assert.equal(await head.text(), "");
    assert.equal((await fetch(base + "/missing.js")).status, 404);
    assert.equal((await fetch(base + "/.secret")).status, 403);
    assert.equal((await fetch(base + "/outside.txt")).status, 403);
    assert.equal((await fetch(base + "/%ZZ")).status, 400);
    assert.equal((await fetch(base + "/", { method: "POST" })).status, 405);
    assert.equal(await (await fetch(base + "/api/me?x=1")).text(), "GET /api/me?x=1");
    assert.equal(await (await fetch(base + "/api/login", { method: "POST", body: "{}" })).text(), "POST /api/login");
  } finally {
    preview?.closeAllConnections();
    backend.closeAllConnections();
    await Promise.all([preview, backend].filter(Boolean).map((s) => new Promise((r) => s.close(r))));
    await rm(dir, { recursive: true, force: true });
  }
});
