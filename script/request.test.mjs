import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, delay, untilAbort } from "./test-utils.mjs";

test("HTTP timeout covers response bodies and releases the Ping queue", async () => {
  let calls = 0;
  const load = createLoader({ fetch: async (_url, { signal }) => {
    calls++;
    return { ok: true, json: () => calls <= 2 ? untilAbort(signal) : Promise.resolve({ result: { records: [], tasks: [] } }) };
  } });
  const { RPC2Client } = load("src/lib/rpc2.ts");
  const { fetchPingRecords } = load("src/lib/pingRecords.ts");
  const client = new RPC2Client("/api/rpc2", { autoConnect: false, requestTimeout: 15 });
  const results = await Promise.allSettled(["a", "b", "c"].map((id) => fetchPingRecords(client.call.bind(client), id, 24)));
  assert.deepEqual(results.map((r) => r.status), ["rejected", "rejected", "fulfilled"]);
  assert.equal(calls, 3);
});

test("request cancellation propagates and successful requests clear timers", async () => {
  const { withRequestTimeout } = createLoader()("src/lib/request.ts");
  const controller = new AbortController();
  const result = withRequestTimeout(untilAbort, { signal: controller.signal, timeout: 100 });
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
  let signal;
  await withRequestTimeout(async (s) => { signal = s; }, { timeout: 10 });
  await delay(20);
  assert.equal(signal.aborted, false);
});

test("Ping queue recovers from a synchronous task failure", async () => {
  const { fetchPingRecords } = createLoader()("src/lib/pingRecords.ts");
  const results = await Promise.allSettled(["a", "b", "c"].map((id) => fetchPingRecords(() => {
    if (id !== "c") throw new Error("failed");
    return Promise.resolve({ records: [], tasks: [] });
  }, id, 24)));
  assert.deepEqual(results.map((r) => r.status), ["rejected", "rejected", "fulfilled"]);
});

test("batch RPC requests also have a default timeout", async () => {
  const { RPC2Client } = createLoader({ fetch: (_url, { signal }) => untilAbort(signal) })("src/lib/rpc2.ts");
  const client = new RPC2Client("/api/rpc2", { autoConnect: false, requestTimeout: 10 });
  await assert.rejects(client.batchCall([{ method: "test" }]), { name: "TimeoutError" });
});
