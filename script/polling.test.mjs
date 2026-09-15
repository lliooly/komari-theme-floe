import assert from "node:assert/strict";
import test from "node:test";
import { createLoader } from "./test-utils.mjs";

const { getExponentialBackoffDelay } = createLoader()("src/lib/polling.ts");

test("polling backoff doubles after failures and caps at the configured maximum", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4].map((failures) => getExponentialBackoffDelay(2_000, failures, 30_000)),
    [2_000, 4_000, 8_000, 16_000, 30_000],
  );
});

test("polling backoff normalizes negative failure counts", () => {
  assert.equal(getExponentialBackoffDelay(5_000, -2, 30_000), 5_000);
});

test("visibility poller applies failure backoff and resets after success", async () => {
  const harness = createBrowserHarness();
  const load = createLoader({ window: harness.window, document: harness.document });
  const { createVisibilityPoller } = load("src/lib/polling.ts");
  let calls = 0;

  const stop = createVisibilityPoller({
    intervalMs: 2_000,
    poll: async () => {
      calls += 1;
      return calls > 1;
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.deepEqual(harness.pendingDelays(), [4_000]);

  await harness.runNextTimer();
  assert.equal(calls, 2);
  assert.deepEqual(harness.pendingDelays(), [2_000]);

  stop();
});

function createBrowserHarness() {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const timers = new Map();
  let nextTimerId = 0;

  const addListener = (listeners, type, listener) => {
    const callbacks = listeners.get(type) ?? new Set();
    callbacks.add(listener);
    listeners.set(type, callbacks);
  };

  const removeListener = (listeners, type, listener) => {
    listeners.get(type)?.delete(listener);
  };

  const dispatch = (listeners, type) => {
    for (const listener of listeners.get(type) ?? []) listener();
  };

  const document = {
    hidden: false,
    visibilityState: "visible",
    addEventListener(type, listener) {
      addListener(documentListeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(documentListeners, type, listener);
    },
    dispatchEvent(type) {
      dispatch(documentListeners, type);
    },
  };

  const window = {
    addEventListener(type, listener) {
      addListener(windowListeners, type, listener);
    },
    removeEventListener(type, listener) {
      removeListener(windowListeners, type, listener);
    },
    dispatchEvent(type) {
      dispatch(windowListeners, type);
    },
    setTimeout(callback, delay) {
      const id = ++nextTimerId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };

  return {
    document,
    window,
    pendingDelays() {
      return [...timers.values()].map(({ delay }) => delay);
    },
    async runNextTimer() {
      const [id, timer] = timers.entries().next().value ?? [];
      if (id === undefined) return;
      timers.delete(id);
      timer.callback();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

test("visibility poller pauses stale requests and resumes immediately", async () => {
  const harness = createBrowserHarness();
  const load = createLoader({ window: harness.window, document: harness.document });
  const { createVisibilityPoller } = load("src/lib/polling.ts");
  const requests = [];
  let resolveFirstRequest;

  const stop = createVisibilityPoller({
    intervalMs: 2_000,
    poll: async (context) => {
      requests.push(context);
      if (requests.length === 1) {
        return new Promise((resolve) => {
          resolveFirstRequest = resolve;
        });
      }
      return true;
    },
  });

  await Promise.resolve();
  assert.equal(requests.length, 1);

  harness.document.hidden = true;
  harness.document.visibilityState = "hidden";
  harness.document.dispatchEvent("visibilitychange");
  assert.deepEqual(harness.pendingDelays(), []);
  assert.equal(requests[0].isCurrent(), false);

  resolveFirstRequest(true);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(harness.pendingDelays(), []);

  harness.document.hidden = false;
  harness.document.visibilityState = "visible";
  harness.document.dispatchEvent("visibilitychange");
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 2);
  assert.deepEqual(harness.pendingDelays(), [2_000]);

  harness.window.dispatchEvent("focus");
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(requests.length, 3);
  assert.deepEqual(harness.pendingDelays(), [2_000]);

  stop();
});

test("visibility poller treats out-of-order completion as stale", async () => {
  const harness = createBrowserHarness();
  const load = createLoader({ window: harness.window, document: harness.document });
  const { createVisibilityPoller } = load("src/lib/polling.ts");
  const contexts = [];
  let resolveFirstRequest;

  const stop = createVisibilityPoller({
    intervalMs: 2_000,
    poll: async (context) => {
      contexts.push(context);
      if (contexts.length === 1) {
        return new Promise((resolve) => {
          resolveFirstRequest = resolve;
        });
      }
      return true;
    },
  });

  await Promise.resolve();
  harness.document.hidden = true;
  harness.document.visibilityState = "hidden";
  harness.document.dispatchEvent("visibilitychange");
  harness.document.hidden = false;
  harness.document.visibilityState = "visible";
  harness.document.dispatchEvent("visibilitychange");
  await Promise.resolve();

  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].isCurrent(), false);

  resolveFirstRequest(true);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(harness.pendingDelays(), []);

  stop();
});
