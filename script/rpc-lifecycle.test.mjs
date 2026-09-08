import assert from "node:assert/strict";
import test from "node:test";
import { createLoader, delay } from "./test-utils.mjs";

function fixture() {
  const sockets = [];
  class Socket extends EventTarget {
    static OPEN = 1;
    readyState = 0;
    constructor() { super(); sockets.push(this); }
    emit(type) { const event = new Event(type); this[`on${type}`]?.(event); this.dispatchEvent(event); }
    open() { this.readyState = 1; this.emit("open"); }
    close() { this.readyState = 3; queueMicrotask(() => this.emit("close")); }
    send() {}
  }
  const { RPC2Client } = createLoader({ WebSocket: Socket, window: { location: { protocol: "http:", host: "localhost" } } })("src/lib/rpc2.ts");
  return { sockets, client: new RPC2Client("/api/rpc2", { autoConnect: false, enableHeartbeat: false, reconnectInterval: 2 }) };
}

test("reusing a disconnected client restores reconnect and ignores old socket events", async () => {
  const { client, sockets } = fixture();
  try {
    const first = client.connect(); sockets[0].open(); await first;
    client.disconnect();
    const second = client.connect(); sockets[1].open(); await second;
    await delay();
    assert.equal(client.state, "connected");
    sockets[1].close();
    await delay(15);
    assert.equal(sockets.length, 3);
    sockets[2].open();
    await delay();
    assert.equal(client.state, "connected");
  } finally { client.disconnect(); }
});

test("concurrent connect calls share one handshake; close rejects pending RPC immediately", async () => {
  const { client, sockets } = fixture();
  try {
    const first = client.connect();
    const second = client.connect();
    assert.equal(first, second);
    assert.equal(sockets.length, 1);
    sockets[0].open(); await first;
    const pending = client.callViaWebSocket("test");
    const rejected = assert.rejects(pending, /连接已断开/);
    sockets[0].close();
    await rejected;
  } finally { client.disconnect(); }
});

test("disconnect during handshake settles the promise without reconnecting", async () => {
  const { client, sockets } = fixture();
  const pending = client.connect();
  const rejected = assert.rejects(pending, /连接已关闭/);
  client.disconnect();
  await rejected;
  await delay(15);
  assert.equal(sockets.length, 1);
  assert.equal(client.state, "disconnected");
});
