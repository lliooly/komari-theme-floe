"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { AnnouncementProvider } from "@/contexts/AnnouncementContext"
import { RPC2Provider } from "@/contexts/RPC2Context"
import { PublicInfoProvider } from "@/contexts/PublicInfoContext"
import { Toaster } from "@/components/ui/sonner"
import { OfflineIndicator } from "@/components/OfflineIndicator"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt"
import i18n, { detectClientLanguage } from "@/i18n/config"

function I18nClientLanguageSync() {
  React.useEffect(() => {
    const detectedLanguage = detectClientLanguage();
    if (i18n.language !== detectedLanguage) {
      void i18n.changeLanguage(detectedLanguage);
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nClientLanguageSync />
      <ThemeProvider>
        <AnnouncementProvider>
          <RPC2Provider>
            <PublicInfoProvider>
              {children}
              <Toaster />
              <OfflineIndicator />
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
            </PublicInfoProvider>
          </RPC2Provider>
        </AnnouncementProvider>
      </ThemeProvider>
    </NextThemesProvider>
  )
}
