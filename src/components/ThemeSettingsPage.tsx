"use client";

import { ArrowLeft, LockKeyhole, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import SpaLink from "@/components/SpaLink";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useEmbeddedThemeSettings } from "@/hooks/useEmbeddedThemeSettings";

export default function ThemeSettingsPage() {
  const {
    isThemeLoaded,
    isThemeSettingsAdmin,
    isThemeSettingsAdminReady,
  } = useTheme();
  const { t } = useTranslation();
  const isEmbedded = useEmbeddedThemeSettings();

  const pageContainerClassName = isEmbedded
    ? "w-full px-3 py-3 sm:px-4 sm:py-4"
    : "container mx-auto px-4";

  if (!isThemeLoaded || !isThemeSettingsAdminReady) {
    return (
      <div className={pageContainerClassName}>
        <div className="rounded-2xl border border-border/70 bg-card/35 p-8 text-center text-sm text-muted-foreground">
          {t("themeSettingsPage.loading")}
        </div>
      </div>
    );
  }

  if (!isThemeSettingsAdmin) {
    return (
      <div className={pageContainerClassName}>
        <div className="mx-auto max-w-lg rounded-2xl border border-border/70 bg-card/35 p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold">{t("themeSettingsPage.unauthorized")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("themeSettingsPage.unauthorizedHelp")}
          </p>
          <SpaLink
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("themeSettingsPage.back")}
          </SpaLink>
        </div>
      </div>
    );
  }

  return (
    <div className={pageContainerClassName}>
      <div className="mx-auto max-w-5xl">
        {!isEmbedded && (
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Palette className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                  Floe
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
                  {t("themeSettingsPage.title")}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  {t("themeSettingsPage.description")}
                </p>
              </div>
            </div>
            <SpaLink
              href="/"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border/70 bg-background/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent sm:self-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("themeSettingsPage.back")}
            </SpaLink>
          </div>
        )}

        <ThemeSwitcher variant="page" />
      </div>
    </div>
  );
}
