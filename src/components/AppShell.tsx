"use client";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import RemainingValueCalculator from "@/components/RemainingValueCalculator";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useSpaPathname } from "@/hooks/useSpaPathname";
import { isMonitorRoute } from "@/lib/spaNavigation";
import MonitorDataProviders from "@/components/MonitorDataProviders";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useSpaPathname();
  const isMonitorPage = isMonitorRoute(pathname);

  return (
    <>
      <header className="sticky top-0 z-50 w-full shrink-0 pt-4">
        <div className="container mx-auto flex flex-col gap-3 px-4">
          <NavBar />
          <AnnouncementBanner />
        </div>
      </header>
      <main className="flex-1 py-4 md:py-12">
        {isMonitorPage ? (
          <MonitorDataProviders>
            {children}
            <RemainingValueCalculator />
          </MonitorDataProviders>
        ) : (
          children
        )}
      </main>
      <Footer />
    </>
  );
}
