"use client";

import { useEffect, useState } from "react";
import {
  Globe2,
  Image as ImageIcon,
  Link2,
  Palette,
  Save,
  Server,
  Sun,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type Appearance,
  useTheme,
} from "@/contexts/ThemeContext";
import {
  DEFAULT_UPTIME_KUMA_SETTINGS,
} from "@/lib/uptimeKuma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-10 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

const appearanceOptions: Array<{
  value: Appearance;
  label: string;
}> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const languageOptions = [
  { value: "en", label: "English" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
];

export default function ThemeSettingsDefaults() {
  const {
    managedThemeSettings,
    appearance,
    language,
    setAppearance,
    setLanguage,
    setLogoUrl,
    setUptimeKuma,
  } = useTheme();
  const { t } = useTranslation();
  const managedLogoUrl = managedThemeSettings.logoUrl || "";
  const managedUptimeKuma = {
    ...DEFAULT_UPTIME_KUMA_SETTINGS,
    ...(managedThemeSettings.uptimeKuma || {}),
  };
  const selectedLanguage = language === "zh-CN" || language === "zh-TW" ? language : "en";
  const [logoUrl, setLogoUrlInput] = useState(managedLogoUrl);
  const [uptimeEnabled, setUptimeEnabled] = useState(managedUptimeKuma.enabled);
  const [uptimeBaseUrl, setUptimeBaseUrl] = useState(managedUptimeKuma.baseUrl);
  const [uptimeSlug, setUptimeSlug] = useState(managedUptimeKuma.slug);

  useEffect(() => {
    setLogoUrlInput(managedLogoUrl);
  }, [managedLogoUrl]);

  useEffect(() => {
    setUptimeEnabled(managedUptimeKuma.enabled);
    setUptimeBaseUrl(managedUptimeKuma.baseUrl);
    setUptimeSlug(managedUptimeKuma.slug);
  }, [managedUptimeKuma.baseUrl, managedUptimeKuma.enabled, managedUptimeKuma.slug]);

  return (
    <>
      <section
        data-card-blur-surface="true"
        className="rounded-2xl border border-border/70 bg-card/35 p-4 shadow-sm md:p-6"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Palette className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("themeSettingsPage.general.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("themeSettingsPage.general.description")}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="theme-settings-logo" className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {t("themeSettingsPage.general.logoUrl")}
            </label>
            <Input
              id="theme-settings-logo"
              type="url"
              value={logoUrl}
              placeholder={t("themeSettingsPage.general.logoPlaceholder")}
              onChange={(event) => setLogoUrlInput(event.target.value)}
              className="border-border/70 bg-background/70"
            />
            <p className="text-xs text-muted-foreground">
              {t("themeSettingsPage.general.logoHelp")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setLogoUrl(logoUrl)}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {t("themeSettingsPage.general.apply")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setLogoUrlInput("");
                  setLogoUrl("");
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                {t("themeSettingsPage.general.clear")}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="theme-settings-appearance" className="flex items-center gap-2 text-sm font-medium">
                <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {t("themeSettingsPage.general.appearance")}
              </label>
              <select
                id="theme-settings-appearance"
                className={selectClassName}
                value={appearance}
                onChange={(event) => setAppearance(event.target.value as Appearance)}
              >
                {appearanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`themeSettingsPage.general.appearances.${option.value}`, { defaultValue: option.label })}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {t("themeSettingsPage.general.appearanceHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="theme-settings-language" className="flex items-center gap-2 text-sm font-medium">
                <Globe2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {t("themeSettingsPage.general.language")}
              </label>
              <select
                id="theme-settings-language"
                className={selectClassName}
                value={selectedLanguage}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`themeSettingsPage.general.languages.${option.value}`, { defaultValue: option.label })}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {t("themeSettingsPage.general.languageHelp")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        data-card-blur-surface="true"
        className="rounded-2xl border border-border/70 bg-card/35 p-4 shadow-sm md:p-6"
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Server className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("themeSettingsPage.uptimeKuma.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("themeSettingsPage.uptimeKuma.description")}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/35 p-3">
            <div className="flex min-w-0 items-start gap-3">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <label htmlFor="theme-settings-uptime-enabled" className="text-sm font-medium">
                  {t("themeSettingsPage.uptimeKuma.enabled")}
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("themeSettingsPage.uptimeKuma.enabledHelp")}
                </p>
              </div>
            </div>
            <Switch
              id="theme-settings-uptime-enabled"
              checked={uptimeEnabled}
              onCheckedChange={setUptimeEnabled}
            />
          </div>

          <div className={cn("grid gap-5 md:grid-cols-2", !uptimeEnabled && "opacity-70")}>
            <div className="space-y-2">
              <label htmlFor="theme-settings-uptime-base-url" className="text-sm font-medium">
                {t("themeSettingsPage.uptimeKuma.baseUrl")}
              </label>
              <Input
                id="theme-settings-uptime-base-url"
                type="url"
                value={uptimeBaseUrl}
                placeholder={t("themeSettingsPage.uptimeKuma.baseUrlPlaceholder")}
                onChange={(event) => setUptimeBaseUrl(event.target.value)}
                className="border-border/70 bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                {t("themeSettingsPage.uptimeKuma.baseUrlHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="theme-settings-uptime-slug" className="text-sm font-medium">
                {t("themeSettingsPage.uptimeKuma.slug")}
              </label>
              <Input
                id="theme-settings-uptime-slug"
                value={uptimeSlug}
                placeholder={t("themeSettingsPage.uptimeKuma.slugPlaceholder")}
                onChange={(event) => setUptimeSlug(event.target.value)}
                className="border-border/70 bg-background/70"
              />
              <p className="text-xs text-muted-foreground">
                {t("themeSettingsPage.uptimeKuma.slugHelp")}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() =>
              setUptimeKuma({
                enabled: uptimeEnabled,
                baseUrl: uptimeBaseUrl.trim(),
                slug: uptimeSlug.trim(),
              })
            }
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {t("themeSettingsPage.uptimeKuma.apply")}
          </Button>
        </div>
      </section>
    </>
  );
}
