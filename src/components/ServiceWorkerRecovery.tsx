"use client";

import { useEffect } from "react";
import { isKomariBackendRoute } from "@/lib/spaNavigation";
import { retireKomariServiceWorker } from "@/lib/serviceWorkerRecovery";

// Share the operation across Strict Mode effects and simultaneous mounts.
let retirement: Promise<boolean> | undefined;

export default function ServiceWorkerRecovery() {
  useEffect(() => {
    let disposed = false;
    retirement ??= retireKomariServiceWorker();
    void retirement.then((retired) => {
      if (!disposed && retired && isKomariBackendRoute(window.location.pathname)) {
        // A cached Floe document was served for a system page. Fetch its real shell.
        window.location.reload();
      }
    }).catch((error) => {
      console.warn("Unable to retire the conflicting Komari service worker:", error);
    });
    return () => { disposed = true; };
  }, []);

  return null;
}
