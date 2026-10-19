/** The default frontend's root worker can cache Floe's HTML as its admin shell. */
export async function retireKomariServiceWorker(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const workerUrl = new URL("/sw.js", window.location.origin).href;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const isControlled = navigator.serviceWorker.controller?.scriptURL === workerUrl;

  if (!registration) return isControlled;
  if (registration.scope !== `${window.location.origin}/`) return false;

  const workers = [registration.active, registration.waiting, registration.installing];
  if (!workers.some((worker) => worker?.scriptURL === workerUrl)) return false;

  const unregistered = await registration.unregister();
  // Another tab may have removed the registration while this document remains controlled.
  return unregistered || isControlled;
}
