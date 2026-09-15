import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { createLoader } from "./test-utils.mjs";

const load = createLoader({ process });
const { default: createNextConfig } = load(
  fileURLToPath(new URL("../next.config.ts", import.meta.url)),
);

function restoreEnvironment(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("development config enables rewrites without static export", async () => {
  const previousTarget = process.env.NEXT_PUBLIC_API_TARGET;
  process.env.NEXT_PUBLIC_API_TARGET = "http://backend.example.test";

  try {
    const config = createNextConfig(PHASE_DEVELOPMENT_SERVER);
    assert.equal(config.output, undefined);
    assert.equal(typeof config.rewrites, "function");
    const rewrites = await config.rewrites();
    assert.equal(rewrites.length, 2);
    assert.equal(rewrites[0].source, "/api/:path*");
    assert.equal(rewrites[0].destination, "http://backend.example.test/api/:path*");
    assert.equal(rewrites[1].source, "/themes/:path*");
    assert.equal(rewrites[1].destination, "http://backend.example.test/themes/:path*");
  } finally {
    restoreEnvironment("NEXT_PUBLIC_API_TARGET", previousTarget);
  }
});

test("production config enables static export without rewrites", () => {
  const config = createNextConfig(PHASE_PRODUCTION_BUILD);

  assert.equal(config.output, "export");
  assert.equal(config.rewrites, undefined);
});

test("production browser source maps are opt-in", () => {
  const previousSourceMaps = process.env.ENABLE_PRODUCTION_SOURCE_MAPS;

  try {
    delete process.env.ENABLE_PRODUCTION_SOURCE_MAPS;
    assert.equal(
      createNextConfig(PHASE_PRODUCTION_BUILD).productionBrowserSourceMaps,
      false,
    );

    process.env.ENABLE_PRODUCTION_SOURCE_MAPS = "true";
    assert.equal(
      createNextConfig(PHASE_PRODUCTION_BUILD).productionBrowserSourceMaps,
      true,
    );
  } finally {
    restoreEnvironment("ENABLE_PRODUCTION_SOURCE_MAPS", previousSourceMaps);
  }
});
