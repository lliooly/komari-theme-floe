"use client";

import InstancePage from "@/components/instance/InstancePage";
import DashboardContent from "@/components/DashboardContent";
import ThemeSettingsPage from "@/components/ThemeSettingsPage";
import { useSpaPathname } from "@/hooks/useSpaPathname";

/**
 * Main page component with client-side routing.
 * Fixes React Error #310 by ensuring hooks are called consistently.
 * The routing decision happens before any conditional hooks are called.
 */
export default function Page() {
  const pathname = useSpaPathname();
  
  // Client-side routing for SPA behavior with static export
  const parts = pathname.split("/").filter(Boolean);

  // Komari's redirect configuration points the admin entry to this SPA route.
  if (pathname.replace(/\/+$/, "").endsWith("/settings")) {
    return <ThemeSettingsPage />;
  }
  
  // Handle /instance/<uuid> routes
  if (parts[0] === "instance" && parts[1]) {
    return <InstancePage uuid={parts[1]} />;
  }
  
  // Default dashboard view
  return <DashboardContent />;
}
