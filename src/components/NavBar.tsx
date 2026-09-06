"use client";

import LanguageSwitch from "./Language";
import LoginDialog from "./Login";
import ThemeSwitcher from "./ThemeSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import SpaLink from "./SpaLink";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { dispatchOpenRemainingValueCalculatorEvent } from "@/lib/remainingValueEvents";
import { useEffect, useState } from "react";
import { useSpaPathname } from "@/hooks/useSpaPathname";

const NAVBAR_COMPACT_SCROLL_THRESHOLD = 16;

function getSupportedLogoUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(
      trimmedValue,
      typeof window === "undefined" ? "http://localhost" : window.location.origin
    );

    return url.protocol === "http:" || url.protocol === "https:"
      ? trimmedValue
      : "";
  } catch {
    return "";
  }
}

const NavBar = () => {
  const { publicInfo } = usePublicInfo();
  const { guestDisplay, managedThemeSettings } = useTheme();
  const { t } = useTranslation();
  const pathname = useSpaPathname();
  const logoUrl = getSupportedLogoUrl(managedThemeSettings.logoUrl);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    const handleScroll = () => {
      const nextIsCompact = window.scrollY > NAVBAR_COMPACT_SCROLL_THRESHOLD;

      setIsCompact((currentIsCompact) =>
        currentIsCompact === nextIsCompact ? currentIsCompact : nextIsCompact
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const showCustomLogo = Boolean(logoUrl) && !logoLoadFailed;
  const isThemeSettingsPage = pathname.replace(/\/+$/, "").endsWith("/settings");

  return (
    <nav className="w-full rounded-2xl border-0 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300 motion-reduce:transition-none">
      <div
        className={`flex items-center justify-between transition-all duration-300 motion-reduce:transition-none ${
          isCompact ? "h-12 px-3 md:h-14 md:px-4" : "h-16 px-4 md:h-20"
        }`}
      >
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <SpaLink
            href="/"
            className={`flex items-center hover:opacity-80 transition-all duration-300 motion-reduce:transition-none ${
              isCompact ? "gap-2" : "gap-3"
            }`}
          >
            <div
              className={`flex items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/20 transition-all duration-300 motion-reduce:transition-none ${
                isCompact ? "h-7 w-7" : "h-8 w-8"
              }`}
            >
              {showCustomLogo ? (
                <img
                  src={logoUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full rounded-lg object-contain"
                  draggable={false}
                  onError={() => setLogoLoadFailed(true)}
                />
              ) : (
                <span className="text-primary-foreground font-bold text-xl" aria-hidden="true">
                  K
                </span>
              )}
            </div>
            <span
              className={`font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-all duration-300 motion-reduce:transition-none ${
                isCompact ? "text-base md:text-xl" : "text-xl md:text-2xl"
              }`}
            >
              {publicInfo?.sitename}
            </span>
          </SpaLink>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center transition-all duration-300 motion-reduce:transition-none ${
            isCompact ? "gap-1" : "gap-2"
          }`}
        >
          <DarkModeToggle />
          {!isThemeSettingsPage && <ThemeSwitcher />}
          {guestDisplay.showPrice && guestDisplay.showExpiredAt && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={dispatchOpenRemainingValueCalculatorEvent}
            >
              <Calculator className="h-4 w-4" />
              <span className="sr-only">
                {t("remainingValue.title", { defaultValue: "Remaining Value Calculator" })}
              </span>
            </Button>
          )}
          <LanguageSwitch />

          {publicInfo?.private_site ? (
            <LoginDialog
              autoOpen={publicInfo?.private_site}
              info={t('common.private_site')}
              onLoginSuccess={() => { window.location.reload(); }}
            />
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
