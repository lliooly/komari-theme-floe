"use client";

import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import RemainingValueCalculator from "@/components/RemainingValueCalculator";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useEmbeddedThemeSettings } from "@/hooks/useEmbeddedThemeSettings";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isEmbeddedThemeSettings = useEmbeddedThemeSettings();

  useEffect(() => {
    if (isEmbeddedThemeSettings) {
      document.body.dataset.embeddedThemeSettings = "true";
    } else {
      delete document.body.dataset.embeddedThemeSettings;
    }

    return () => {
      delete document.body.dataset.embeddedThemeSettings;
    };
  }, [isEmbeddedThemeSettings]);

  return (
    <>
      {!isEmbeddedThemeSettings && (
        <header className="sticky top-0 z-50 w-full shrink-0 pt-4">
          <div className="container mx-auto flex flex-col gap-3 px-4">
            <NavBar />
            <AnnouncementBanner />
          </div>
        </header>
      )}
      <main className={isEmbeddedThemeSettings ? "flex-1 py-0" : "flex-1 py-4 md:py-12"}>
        {children}
      </main>
      {!isEmbeddedThemeSettings && <Footer />}
      <RemainingValueCalculator />
    </>
  );
}
