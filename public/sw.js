// Komari's default frontend registers this URL with scope '/'. Its precached
// index.html may contain Floe, which must never be served as the admin shell.
// Replace previously installed workers without deleting site data or reloading
// open tabs. With no fetch handler, every request goes to the server normally.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
