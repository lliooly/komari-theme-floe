"use client";

import { useEffect, useState } from "react";
import { SPA_NAVIGATION_EVENT } from "@/lib/spaNavigation";

function readEmbeddedThemeSettingsState() {
  if (typeof window === "undefined") {
    return false;
  }

  const pathname = window.location.pathname.replace(/\/+$/, "");
  const embedded = new URLSearchParams(window.location.search).get("embedded");

  return pathname.endsWith("/settings") && embedded === "1";
}

export function useEmbeddedThemeSettings() {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const syncState = () => {
      setIsEmbedded(readEmbeddedThemeSettingsState());
    };

    syncState();
    window.addEventListener("popstate", syncState);
    window.addEventListener(SPA_NAVIGATION_EVENT, syncState);

    return () => {
      window.removeEventListener("popstate", syncState);
      window.removeEventListener(SPA_NAVIGATION_EVENT, syncState);
    };
  }, []);

  return isEmbedded;
}
