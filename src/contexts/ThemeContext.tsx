"use client";

import i18n, { detectClientLanguage, normalizeLanguage } from "@/i18n/config";
import { updateThemeSettings } from "@/lib/themeSettings";
import type { UptimeKumaSettings } from "@/lib/uptimeKuma";
import { useTheme as useNextTheme } from "next-themes";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  DEFAULT_GUEST_DISPLAY_SETTINGS,
  DEFAULT_NODE_VIEW_MODE,
  DEFAULT_STATUS_CARDS_VISIBILITY,
  DEFAULT_THEME_CONFIG,
  LANGUAGE_STORAGE_KEY,
  LOCAL_OVERRIDE_BASE_SIGNATURE_KEY,
  NEXT_THEMES_STORAGE_KEY,
  NODE_VIEW_CHANGE_EVENT,
  NODE_VIEW_STORAGE_KEY,
  STATUS_CARDS_CHANGE_EVENT,
  STATUS_CARDS_STORAGE_KEY,
} from "./theme/constants";
import {
  getManagedSettingsSignature,
  mergeManagedSettings,
  normalizeManagedThemeSettings,
  normalizeThemeConfig,
  parseThemeSettings,
} from "./theme/model";
import {
  CARD_BLUR_STYLE_PROPERTIES,
  clampBackgroundBlurIntensity,
  cssAlpha,
  cssString,
  getBackgroundBlurPresentation,
  getCardBlurPresentation,
} from "./theme/presentation";
import {
  clearI18nLanguageCache,
  hasLocalOverrides,
  readInitialAppearanceOverride,
  readInitialLanguageOverride,
  readInitialNodeViewOverride,
  readInitialStatusCardsOverrides,
  readInitialThemeOverrides,
  readStringStorage,
  removeStorage,
  writeJsonStorage,
  writeStringStorage,
  writeThemeOverrides,
} from "./theme/storage";
import type {
  Appearance,
  BackgroundBlurType,
  CardBlurType,
  CardDesign,
  CardLayout,
  ColorTheme,
  GraphDesign,
  GuestDisplaySettings,
  ManagedThemeSettings,
  NodeViewMode,
  StatusCardsVisibility,
  StatusDesign,
  ThemeConfig,
  ThemeContextType,
} from "./theme/types";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type AdminState = "loading" | "yes" | "no";

function dispatchCustomEvent<T>(eventName: string, detail: T) {
  if (typeof window === "undefined") {
    return;
  }

  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  });
}

function removeKeys<T extends Record<string, unknown>, K extends keyof T>(
  source: Partial<T>,
  keys: K[]
): Partial<T> {
  const next = { ...source };
  keys.forEach((key) => {
    delete next[key];
  });
  return next;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setTheme: setNextTheme } = useNextTheme();
  const [localThemeOverrides, setLocalThemeOverrides] = useState<Partial<ThemeConfig>>(readInitialThemeOverrides);
  const [localStatusCardsOverrides, setLocalStatusCardsOverrides] =
    useState<Partial<StatusCardsVisibility>>(readInitialStatusCardsOverrides);
  const [localNodeViewOverride, setLocalNodeViewOverride] =
    useState<NodeViewMode | undefined>(readInitialNodeViewOverride);
  const [localAppearanceOverride, setLocalAppearanceOverride] =
    useState<Appearance | undefined>(readInitialAppearanceOverride);
  const [localLanguageOverride, setLocalLanguageOverride] =
    useState<string | undefined>(readInitialLanguageOverride);
  const [managedThemeSettings, setManagedThemeSettings] = useState<ManagedThemeSettings>({});
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [managedSettingsSignature, setManagedSettingsSignature] = useState(
    getManagedSettingsSignature({})
  );
  const [adminState, setAdminState] = useState<AdminState>("loading");
  const rawManagedSettingsRef = useRef<Record<string, unknown>>({});
  const pendingAdminPatchRef = useRef<ManagedThemeSettings>({});
  const queuedSaveRef = useRef<Record<string, unknown> | null>(null);
  const savingRef = useRef(false);

  const themeConfig = useMemo(
    () =>
      normalizeThemeConfig({
        ...managedThemeSettings,
        ...localThemeOverrides,
      }),
    [localThemeOverrides, managedThemeSettings]
  );

  const statusCardsVisibility = useMemo<StatusCardsVisibility>(
    () => ({
      ...DEFAULT_STATUS_CARDS_VISIBILITY,
      ...(managedThemeSettings.statusCardsVisibility || {}),
      ...localStatusCardsOverrides,
    }),
    [localStatusCardsOverrides, managedThemeSettings.statusCardsVisibility]
  );

  const isLoggedIn = adminState === "yes";

  const guestDisplay = useMemo<GuestDisplaySettings>(
    () => {
      if (isLoggedIn) {
        return {
          showPrice: true,
          showExpiredAt: true,
        };
      }

      return {
        ...DEFAULT_GUEST_DISPLAY_SETTINGS,
        ...(managedThemeSettings.guestDisplay || {}),
      };
    },
    [isLoggedIn, managedThemeSettings.guestDisplay]
  );

  const nodeViewMode =
    localNodeViewOverride ||
    managedThemeSettings.nodeViewMode ||
    DEFAULT_NODE_VIEW_MODE;

  const appearance =
    localAppearanceOverride ||
    managedThemeSettings.appearance ||
    DEFAULT_APPEARANCE;

  const language = useMemo(
    () =>
      localLanguageOverride ||
      managedThemeSettings.language ||
      normalizeLanguage(detectClientLanguage()) ||
      "en",
    [localLanguageOverride, managedThemeSettings.language]
  );

  const clearLocalOverrides = useCallback(() => {
    setLocalThemeOverrides({});
    setLocalStatusCardsOverrides({});
    setLocalNodeViewOverride(undefined);
    setLocalAppearanceOverride(undefined);
    setLocalLanguageOverride(undefined);

    writeThemeOverrides({});
    writeJsonStorage(STATUS_CARDS_STORAGE_KEY, {});
    writeJsonStorage(NODE_VIEW_STORAGE_KEY, undefined);
    removeStorage(APPEARANCE_STORAGE_KEY);
    removeStorage(NEXT_THEMES_STORAGE_KEY);
    removeStorage(LANGUAGE_STORAGE_KEY);
    clearI18nLanguageCache();
    removeStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY);
  }, []);

  const applyManagedSettings = useCallback((rawSettings: Record<string, unknown>) => {
    const nextSignature = getManagedSettingsSignature(rawSettings);
    const localBaseSignature = readStringStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY);
    const shouldClearLocalOverrides =
      Object.keys(rawSettings).length > 0 &&
      hasLocalOverrides() &&
      localBaseSignature !== nextSignature;

    rawManagedSettingsRef.current = rawSettings;
    setManagedThemeSettings(normalizeManagedThemeSettings(rawSettings));
    setManagedSettingsSignature(nextSignature);

    if (shouldClearLocalOverrides) {
      clearLocalOverrides();
    }
  }, [clearLocalOverrides]);

  const persistManagedSettings = useCallback((patch: ManagedThemeSettings) => {
    const nextRaw = mergeManagedSettings(rawManagedSettingsRef.current, patch);
    rawManagedSettingsRef.current = nextRaw;
    setManagedThemeSettings(normalizeManagedThemeSettings(nextRaw));
    setManagedSettingsSignature(getManagedSettingsSignature(nextRaw));
    clearLocalOverrides();
    queuedSaveRef.current = mergeManagedSettings(queuedSaveRef.current ?? {}, patch);

    if (savingRef.current) {
      return;
    }

    const run = async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        while (queuedSaveRef.current) {
          const patchToSave = queuedSaveRef.current as ManagedThemeSettings;
          queuedSaveRef.current = null;
          try {
            await updateThemeSettings((current) => mergeManagedSettings(current, patchToSave));
            toast.dismiss("floe-settings-save-error");
          } catch (error) {
            // Preserve failed edits; newer queued edits win when the user retries.
            queuedSaveRef.current = mergeManagedSettings(patchToSave, queuedSaveRef.current ?? {});
            toast.error(i18n.t("settings.settings_save_failed"), {
              id: "floe-settings-save-error",
              duration: Infinity,
              description: error instanceof Error ? error.message : String(error),
              action: { label: i18n.t("common.retry", "Retry"), onClick: () => { void run(); } },
            });
            break;
          }
        }
      } finally {
        savingRef.current = false;
      }
    };

    void run();
  }, [clearLocalOverrides]);

  const applyAdminOrLocalPatch = useCallback(
    (patch: ManagedThemeSettings) => {
      if (adminState === "yes") {
        persistManagedSettings(patch);
        return true;
      }

      if (adminState === "loading") {
        pendingAdminPatchRef.current = mergeManagedSettings(pendingAdminPatchRef.current, patch);
      }

      return false;
    },
    [adminState, persistManagedSettings]
  );

  const setLocalThemePatch = useCallback(
    (patch: Partial<ThemeConfig>) => {
      const isAdminPatch = applyAdminOrLocalPatch(patch);
      const keys = Object.keys(patch) as Array<keyof ThemeConfig>;

      setLocalThemeOverrides((prev) => {
        const next = isAdminPatch ? removeKeys(prev, keys) : { ...prev, ...patch };
        writeThemeOverrides(next);
        if (!isAdminPatch) {
          writeStringStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY, managedSettingsSignature);
        }
        return next;
      });
    },
    [applyAdminOrLocalPatch, managedSettingsSignature]
  );

  const setLocalStatusCardsPatch = useCallback(
    (patch: Partial<StatusCardsVisibility>) => {
      const isAdminPatch = applyAdminOrLocalPatch({ statusCardsVisibility: patch });
      const keys = Object.keys(patch) as Array<keyof StatusCardsVisibility>;

      setLocalStatusCardsOverrides((prev) => {
        const next = isAdminPatch ? removeKeys(prev, keys) : { ...prev, ...patch };
        writeJsonStorage(STATUS_CARDS_STORAGE_KEY, next);
        if (!isAdminPatch) {
          writeStringStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY, managedSettingsSignature);
        }
        dispatchCustomEvent(STATUS_CARDS_CHANGE_EVENT, {
          ...DEFAULT_STATUS_CARDS_VISIBILITY,
          ...(managedThemeSettings.statusCardsVisibility || {}),
          ...next,
        });
        return next;
      });
    },
    [applyAdminOrLocalPatch, managedSettingsSignature, managedThemeSettings.statusCardsVisibility]
  );

  const setNodeViewModeValue = useCallback(
    (value: NodeViewMode) => {
      const isAdminPatch = applyAdminOrLocalPatch({ nodeViewMode: value });
      const nextLocalValue = isAdminPatch ? undefined : value;

      setLocalNodeViewOverride(nextLocalValue);
      writeJsonStorage(NODE_VIEW_STORAGE_KEY, nextLocalValue);
      if (!isAdminPatch) {
        writeStringStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY, managedSettingsSignature);
      }
      dispatchCustomEvent(NODE_VIEW_CHANGE_EVENT, value);
    },
    [applyAdminOrLocalPatch, managedSettingsSignature]
  );

  const setAppearanceValue = useCallback(
    (value: Appearance) => {
      const isAdminPatch = applyAdminOrLocalPatch({ appearance: value });
      const nextLocalValue = isAdminPatch ? undefined : value;

      setLocalAppearanceOverride(nextLocalValue);
      if (nextLocalValue) {
        writeStringStorage(APPEARANCE_STORAGE_KEY, nextLocalValue);
      } else {
        removeStorage(APPEARANCE_STORAGE_KEY);
      }
      if (!isAdminPatch) {
        writeStringStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY, managedSettingsSignature);
      }
    },
    [applyAdminOrLocalPatch, managedSettingsSignature]
  );

  const setLanguageValue = useCallback(
    (value: string) => {
      const nextLanguage = normalizeLanguage(value);
      if (!nextLanguage) {
        return;
      }

      const isAdminPatch = applyAdminOrLocalPatch({ language: nextLanguage });
      const nextLocalValue = isAdminPatch ? undefined : nextLanguage;

      setLocalLanguageOverride(nextLocalValue);
      if (nextLocalValue) {
        writeStringStorage(LANGUAGE_STORAGE_KEY, nextLocalValue);
      } else {
        removeStorage(LANGUAGE_STORAGE_KEY);
      }
      if (!isAdminPatch) {
        writeStringStorage(LOCAL_OVERRIDE_BASE_SIGNATURE_KEY, managedSettingsSignature);
      }
    },
    [applyAdminOrLocalPatch, managedSettingsSignature]
  );

  useEffect(() => {
    let mounted = true;

    fetch("/api/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((resp) => {
        if (!mounted) return;
        const rawSettings = parseThemeSettings(resp?.data?.theme_settings);
        applyManagedSettings(rawSettings);
        setIsThemeLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        applyManagedSettings({});
        setIsThemeLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [applyManagedSettings]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted) {
          setAdminState(data?.logged_in ? "yes" : "no");
        }
      })
      .catch(() => {
        if (mounted) {
          setAdminState("no");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (adminState === "loading") {
      return;
    }

    const pendingPatch = pendingAdminPatchRef.current;
    pendingAdminPatchRef.current = {};

    if (adminState !== "yes" || Object.keys(pendingPatch).length === 0) {
      return;
    }

    persistManagedSettings(pendingPatch);

    setLocalThemeOverrides((prev) => {
      const keys = Object.keys(pendingPatch).filter((key): key is keyof ThemeConfig =>
        key in DEFAULT_THEME_CONFIG
      );
      const next = removeKeys(prev, keys);
      writeThemeOverrides(next);
      return next;
    });

    if (pendingPatch.statusCardsVisibility) {
      setLocalStatusCardsOverrides((prev) => {
        const keys = Object.keys(pendingPatch.statusCardsVisibility || {}) as Array<keyof StatusCardsVisibility>;
        const next = removeKeys(prev, keys);
        writeJsonStorage(STATUS_CARDS_STORAGE_KEY, next);
        return next;
      });
    }

    if (pendingPatch.nodeViewMode !== undefined) {
      setLocalNodeViewOverride(undefined);
      writeJsonStorage(NODE_VIEW_STORAGE_KEY, undefined);
    }

    if (pendingPatch.appearance !== undefined) {
      setLocalAppearanceOverride(undefined);
      removeStorage(APPEARANCE_STORAGE_KEY);
    }

    if (pendingPatch.language !== undefined) {
      setLocalLanguageOverride(undefined);
      removeStorage(LANGUAGE_STORAGE_KEY);
    }
  }, [adminState, persistManagedSettings]);

  useEffect(() => {
    setNextTheme(appearance);
  }, [appearance, setNextTheme]);

  useEffect(() => {
    const nextLanguage = normalizeLanguage(language) || "en";
    if (i18n.language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLanguage.replace("_", "-");
    }
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.documentElement.setAttribute("data-color-theme", themeConfig.colorTheme);
  }, [themeConfig.colorTheme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundAttachment = "";

    if (!themeConfig.backgroundImageUrl) {
      delete document.body.dataset.customBackground;
      document.body.style.removeProperty("--komari-custom-background-image");
      document.body.style.removeProperty("--komari-custom-background-filter");
      document.body.style.removeProperty("--komari-custom-background-inset");
      document.body.style.removeProperty("--komari-custom-background-bleed");
      document.body.style.removeProperty("--komari-custom-background-scale");
      document.body.style.removeProperty("--komari-custom-background-mask-opacity");
      return;
    }

    const { filter, bleed } = getBackgroundBlurPresentation(
      themeConfig.backgroundBlurType,
      themeConfig.backgroundBlurIntensity,
      themeConfig.backgroundBlurEnabled
    );

    document.body.dataset.customBackground = "true";
    document.body.style.setProperty(
      "--komari-custom-background-image",
      `url("${cssString(themeConfig.backgroundImageUrl)}")`
    );
    document.body.style.setProperty("--komari-custom-background-filter", filter);
    document.body.style.setProperty("--komari-custom-background-bleed", bleed);
    document.body.style.setProperty(
      "--komari-custom-background-mask-opacity",
      cssAlpha(themeConfig.backgroundMaskOpacity / 100)
    );
    document.body.style.removeProperty("--komari-custom-background-inset");
    document.body.style.removeProperty("--komari-custom-background-scale");
  }, [
    themeConfig.backgroundBlurEnabled,
    themeConfig.backgroundBlurIntensity,
    themeConfig.backgroundBlurType,
    themeConfig.backgroundImageUrl,
    themeConfig.backgroundMaskOpacity,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!themeConfig.cardBlurEnabled) {
      delete document.body.dataset.cardBlur;
      delete document.body.dataset.cardBlurType;
      Object.values(CARD_BLUR_STYLE_PROPERTIES).forEach((property) => {
        document.body.style.removeProperty(property);
      });
      return;
    }

    const presentation = getCardBlurPresentation(
      themeConfig.cardBlurType,
      themeConfig.cardBlurIntensity,
      themeConfig.cardExtraBlurIntensity,
      themeConfig.cardBlurEnabled
    );

    document.body.dataset.cardBlur = "true";
    document.body.dataset.cardBlurType = themeConfig.cardBlurType;
    Object.entries(CARD_BLUR_STYLE_PROPERTIES).forEach(([key, property]) => {
      document.body.style.setProperty(
        property,
        presentation[key as keyof typeof presentation]
      );
    });
  }, [
    themeConfig.cardBlurEnabled,
    themeConfig.cardBlurIntensity,
    themeConfig.cardExtraBlurIntensity,
    themeConfig.cardBlurType,
  ]);

  const setColorTheme = useCallback(
    (theme: ColorTheme) => setLocalThemePatch({ colorTheme: theme }),
    [setLocalThemePatch]
  );
  const setCardLayout = useCallback(
    (layout: CardLayout) => setLocalThemePatch({ cardLayout: layout }),
    [setLocalThemePatch]
  );
  const setCardDesign = useCallback(
    (design: CardDesign) => setLocalThemePatch({ cardDesign: design }),
    [setLocalThemePatch]
  );
  const setStatusDesign = useCallback(
    (design: StatusDesign) => setLocalThemePatch({ statusDesign: design }),
    [setLocalThemePatch]
  );
  const setGraphDesign = useCallback(
    (design: GraphDesign) => setLocalThemePatch({ graphDesign: design }),
    [setLocalThemePatch]
  );
  const setShowRamDiskTotal = useCallback(
    (show: boolean) => setLocalThemePatch({ showRamDiskTotal: show }),
    [setLocalThemePatch]
  );
  const setBackgroundImageUrl = useCallback(
    (url: string) => setLocalThemePatch({ backgroundImageUrl: url }),
    [setLocalThemePatch]
  );
  const setBackgroundBlurEnabled = useCallback(
    (enabled: boolean) => setLocalThemePatch({ backgroundBlurEnabled: enabled }),
    [setLocalThemePatch]
  );
  const setBackgroundBlurType = useCallback(
    (type: BackgroundBlurType) => setLocalThemePatch({ backgroundBlurType: type }),
    [setLocalThemePatch]
  );
  const setBackgroundBlurIntensity = useCallback(
    (intensity: number) =>
      setLocalThemePatch({ backgroundBlurIntensity: clampBackgroundBlurIntensity(intensity) }),
    [setLocalThemePatch]
  );
  const setBackgroundMaskOpacity = useCallback(
    (opacity: number) =>
      setLocalThemePatch({ backgroundMaskOpacity: clampBackgroundBlurIntensity(opacity) }),
    [setLocalThemePatch]
  );
  const setCardBlurEnabled = useCallback(
    (enabled: boolean) => setLocalThemePatch({ cardBlurEnabled: enabled }),
    [setLocalThemePatch]
  );
  const setCardBlurType = useCallback(
    (type: CardBlurType) => setLocalThemePatch({ cardBlurType: type }),
    [setLocalThemePatch]
  );
  const setCardTransparentIntensity = useCallback(
    (intensity: number) =>
      setLocalThemePatch({ cardBlurIntensity: clampBackgroundBlurIntensity(intensity) }),
    [setLocalThemePatch]
  );
  const setCardBlurIntensity = setCardTransparentIntensity;
  const setCardExtraBlurIntensity = useCallback(
    (intensity: number) =>
      setLocalThemePatch({ cardExtraBlurIntensity: clampBackgroundBlurIntensity(intensity) }),
    [setLocalThemePatch]
  );
  const setStatusCardVisibility = useCallback(
    (key: keyof StatusCardsVisibility, checked: boolean) =>
      setLocalStatusCardsPatch({ [key]: checked }),
    [setLocalStatusCardsPatch]
  );
  const setGuestDisplay = useCallback(
    (key: keyof GuestDisplaySettings, checked: boolean) => {
      applyAdminOrLocalPatch({ guestDisplay: { [key]: checked } });
    },
    [applyAdminOrLocalPatch]
  );
  const setLogoUrlValue = useCallback(
    (value: string) => {
      applyAdminOrLocalPatch({ logoUrl: value.trim() });
    },
    [applyAdminOrLocalPatch]
  );
  const setUptimeKumaValue = useCallback(
    (patch: Partial<UptimeKumaSettings>) => {
      applyAdminOrLocalPatch({ uptimeKuma: patch });
    },
    [applyAdminOrLocalPatch]
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      themeConfig,
      managedThemeSettings,
      isThemeSettingsAdmin: adminState === "yes",
      isThemeSettingsAdminReady: adminState !== "loading",
      isThemeLoaded,
      isLoggedIn,
      statusCardsVisibility,
      guestDisplay,
      nodeViewMode,
      appearance,
      language,
      setColorTheme,
      setCardLayout,
      setCardDesign,
      setStatusDesign,
      setGraphDesign,
      setShowRamDiskTotal,
      setBackgroundImageUrl,
      setBackgroundBlurEnabled,
      setBackgroundBlurType,
      setBackgroundBlurIntensity,
      setBackgroundMaskOpacity,
      setCardBlurEnabled,
      setCardBlurType,
      setCardTransparentIntensity,
      setCardBlurIntensity,
      setCardExtraBlurIntensity,
      setStatusCardVisibility,
      setGuestDisplay,
      setNodeViewMode: setNodeViewModeValue,
      setAppearance: setAppearanceValue,
      setLanguage: setLanguageValue,
      setLogoUrl: setLogoUrlValue,
      setUptimeKuma: setUptimeKumaValue,
    }),
    [
      appearance,
      adminState,
      guestDisplay,
      isThemeLoaded,
      isLoggedIn,
      language,
      managedThemeSettings,
      nodeViewMode,
      setBackgroundBlurEnabled,
      setBackgroundBlurIntensity,
      setBackgroundBlurType,
      setBackgroundImageUrl,
      setBackgroundMaskOpacity,
      setAppearanceValue,
      setCardBlurEnabled,
      setCardBlurIntensity,
      setCardBlurType,
      setCardDesign,
      setCardExtraBlurIntensity,
      setCardLayout,
      setCardTransparentIntensity,
      setColorTheme,
      setGuestDisplay,
      setGraphDesign,
      setShowRamDiskTotal,
      setLanguageValue,
      setNodeViewModeValue,
      setStatusCardVisibility,
      setStatusDesign,
      setLogoUrlValue,
      setUptimeKumaValue,
      statusCardsVisibility,
      themeConfig,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export { DEFAULT_APPEARANCE, DEFAULT_GUEST_DISPLAY_SETTINGS, DEFAULT_NODE_VIEW_MODE, DEFAULT_STATUS_CARDS_VISIBILITY } from "./theme/constants";
export type {
  Appearance,
  BackgroundBlurType,
  CardBlurType,
  CardDesign,
  CardLayout,
  ColorTheme,
  GraphDesign,
  GuestDisplaySettings,
  ManagedThemeSettings,
  NodeViewMode,
  StatusCardsVisibility,
  StatusDesign,
  ThemeConfig,
} from "./theme/types";
