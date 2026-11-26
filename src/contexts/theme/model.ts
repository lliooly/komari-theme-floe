import { normalizeLanguage } from "@/i18n/config";
import type { UptimeKumaSettings } from "@/lib/uptimeKuma";
import {
  APPEARANCES,
  BACKGROUND_BLUR_TYPES,
  CARD_DESIGNS,
  CARD_LAYOUTS,
  COLOR_THEMES,
  DEFAULT_GUEST_DISPLAY_SETTINGS,
  DEFAULT_STATUS_CARDS_VISIBILITY,
  DEFAULT_THEME_CONFIG,
  GRAPH_DESIGNS,
  NODE_VIEW_MODES,
  STATUS_DESIGNS,
} from "./constants";
import { clampBackgroundBlurIntensity } from "./presentation";
import type {
  Appearance,
  BackgroundBlurType,
  GuestDisplaySettings,
  ManagedThemeSettings,
  StatusCardsVisibility,
  ThemeConfig,
} from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseThemeSettings(input: unknown): Record<string, unknown> {
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(input) ? input : {};
}

export function pickEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : undefined;
}

export function pickAppearance(value: unknown): Appearance | undefined {
  return pickEnum(value, APPEARANCES);
}

function pickManagedLanguage(value: unknown): string | undefined {
  if (typeof value !== "string" || value === "auto") {
    return undefined;
  }

  return normalizeLanguage(value);
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function pickBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function pickBlurType(value: unknown): BackgroundBlurType | undefined {
  return pickEnum(value, BACKGROUND_BLUR_TYPES);
}

function pickNumber(value: unknown): number | undefined {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function readDottedValue(input: Record<string, unknown>, dottedKey: string): unknown {
  const nestedValue = dottedKey.split(".").reduce<unknown>((current, part) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[part];
  }, input);

  if (nestedValue !== undefined) {
    return nestedValue;
  }

  return input[dottedKey];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function getManagedSettingsSignature(input: Record<string, unknown>): string {
  return stableStringify(input);
}

export function normalizeThemeConfig(config: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  return {
    ...DEFAULT_THEME_CONFIG,
    ...config,
  };
}

export function normalizeThemeConfigOverrides(input: unknown): Partial<ThemeConfig> {
  if (!isRecord(input)) {
    return {};
  }

  const result: Partial<ThemeConfig> = {};
  const colorTheme = pickEnum(input.colorTheme, COLOR_THEMES);
  const cardLayout = pickEnum(input.cardLayout, CARD_LAYOUTS);
  const cardDesign = pickEnum(input.cardDesign, CARD_DESIGNS);
  const statusDesign = pickEnum(input.statusDesign, STATUS_DESIGNS);
  const graphDesign = pickEnum(input.graphDesign, GRAPH_DESIGNS);
  const showRamDiskTotal = pickBoolean((input as any).showRamDiskTotal);
  const backgroundImageUrl = pickString(input.backgroundImageUrl);
  const backgroundBlurEnabled = pickBoolean(input.backgroundBlurEnabled);
  const backgroundBlurType = pickBlurType(input.backgroundBlurType);
  const backgroundBlurIntensity = pickNumber(input.backgroundBlurIntensity);
  const backgroundMaskOpacity = pickNumber(input.backgroundMaskOpacity);
  const cardBlurEnabled = pickBoolean(input.cardBlurEnabled);
  const cardBlurType = pickBlurType(input.cardBlurType);
  const cardBlurIntensity = pickNumber(input.cardBlurIntensity);
  const cardExtraBlurIntensity = pickNumber(input.cardExtraBlurIntensity);

  if (colorTheme) result.colorTheme = colorTheme;
  if (cardLayout) result.cardLayout = cardLayout;
  if (cardDesign) result.cardDesign = cardDesign;
  if (statusDesign) result.statusDesign = statusDesign;
  if (graphDesign) result.graphDesign = graphDesign;
  if (showRamDiskTotal !== undefined) result.showRamDiskTotal = showRamDiskTotal;
  if (backgroundImageUrl !== undefined) result.backgroundImageUrl = backgroundImageUrl;
  if (backgroundBlurEnabled !== undefined) result.backgroundBlurEnabled = backgroundBlurEnabled;
  if (backgroundBlurType) result.backgroundBlurType = backgroundBlurType;
  if (backgroundBlurIntensity !== undefined) {
    result.backgroundBlurIntensity = clampBackgroundBlurIntensity(backgroundBlurIntensity);
  }
  if (backgroundMaskOpacity !== undefined) {
    result.backgroundMaskOpacity = clampBackgroundBlurIntensity(backgroundMaskOpacity);
  }
  if (cardBlurEnabled !== undefined) result.cardBlurEnabled = cardBlurEnabled;
  if (cardBlurType) result.cardBlurType = cardBlurType;
  if (cardBlurIntensity !== undefined) {
    result.cardBlurIntensity = clampBackgroundBlurIntensity(cardBlurIntensity);
  }
  if (cardExtraBlurIntensity !== undefined) {
    result.cardExtraBlurIntensity = clampBackgroundBlurIntensity(cardExtraBlurIntensity);
  }

  return result;
}

export function normalizeStatusCardsVisibilityOverrides(input: unknown): Partial<StatusCardsVisibility> {
  if (!isRecord(input)) {
    return {};
  }

  const result: Partial<StatusCardsVisibility> = {};
  (Object.keys(DEFAULT_STATUS_CARDS_VISIBILITY) as Array<keyof StatusCardsVisibility>).forEach((key) => {
    const value = pickBoolean(input[key]);
    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

function normalizeGuestDisplaySettings(input: unknown): Partial<GuestDisplaySettings> {
  if (!isRecord(input)) {
    return {};
  }

  const result: Partial<GuestDisplaySettings> = {};
  (Object.keys(DEFAULT_GUEST_DISPLAY_SETTINGS) as Array<keyof GuestDisplaySettings>).forEach((key) => {
    const value = pickBoolean(input[key]);
    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result;
}

function normalizeUptimeKumaSettings(source: Record<string, unknown>): Partial<UptimeKumaSettings> {
  const result: Partial<UptimeKumaSettings> = {};
  const enabled = pickBoolean(readDottedValue(source, "uptimeKuma.enabled"));
  const baseUrl = pickString(readDottedValue(source, "uptimeKuma.baseUrl"));
  const slug = pickString(readDottedValue(source, "uptimeKuma.slug"));

  if (enabled !== undefined) {
    result.enabled = enabled;
  }
  if (baseUrl !== undefined) {
    result.baseUrl = baseUrl.trim();
  }
  if (slug !== undefined) {
    result.slug = slug.trim();
  }

  return result;
}

export function normalizeManagedThemeSettings(input: unknown): ManagedThemeSettings {
  const source = parseThemeSettings(input);
  const result: ManagedThemeSettings = normalizeThemeConfigOverrides(source);
  const logoUrl = pickString(readDottedValue(source, "logoUrl"));
  const nodeViewMode = pickEnum(readDottedValue(source, "nodeViewMode"), NODE_VIEW_MODES);
  const appearance = pickAppearance(readDottedValue(source, "appearance"));
  const language = pickManagedLanguage(readDottedValue(source, "language"));
  const statusCardsVisibility: Partial<StatusCardsVisibility> = {};
  const guestDisplay: Partial<GuestDisplaySettings> =
    normalizeGuestDisplaySettings(readDottedValue(source, "guestDisplay"));
  const uptimeKuma = normalizeUptimeKumaSettings(source);

  (Object.keys(DEFAULT_STATUS_CARDS_VISIBILITY) as Array<keyof StatusCardsVisibility>).forEach((key) => {
    const value = pickBoolean(readDottedValue(source, `statusCardsVisibility.${key}`));
    if (value !== undefined) {
      statusCardsVisibility[key] = value;
    }
  });

  (Object.keys(DEFAULT_GUEST_DISPLAY_SETTINGS) as Array<keyof GuestDisplaySettings>).forEach((key) => {
    const value = pickBoolean(readDottedValue(source, `guestDisplay.${key}`));
    if (value !== undefined) {
      guestDisplay[key] = value;
    }
  });

  if (Object.keys(statusCardsVisibility).length > 0) {
    result.statusCardsVisibility = statusCardsVisibility;
  }

  if (Object.keys(guestDisplay).length > 0) {
    result.guestDisplay = guestDisplay;
  }

  if (Object.keys(uptimeKuma).length > 0) {
    result.uptimeKuma = uptimeKuma;
  }

  if (logoUrl !== undefined) {
    result.logoUrl = logoUrl.trim();
  }

  if (nodeViewMode) {
    result.nodeViewMode = nodeViewMode;
  }

  if (appearance) {
    result.appearance = appearance;
  }

  if (language) {
    result.language = language;
  }

  return result;
}

export function mergeManagedSettings(
  current: Partial<ManagedThemeSettings> | Record<string, unknown>,
  patch: ManagedThemeSettings
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(current as Record<string, unknown>) };

  (
    [
      "colorTheme",
      "cardLayout",
      "cardDesign",
      "statusDesign",
      "graphDesign",
      "showRamDiskTotal",
      "backgroundImageUrl",
      "backgroundBlurEnabled",
      "backgroundBlurType",
      "backgroundBlurIntensity",
      "backgroundMaskOpacity",
      "cardBlurEnabled",
      "cardBlurType",
      "cardBlurIntensity",
      "cardExtraBlurIntensity",
      "logoUrl",
      "appearance",
      "language",
    ] as const
  ).forEach((key) => {
    if (patch[key] !== undefined) {
      next[key] = patch[key];
    }
  });

  if (patch.nodeViewMode !== undefined) {
    next.nodeViewMode = patch.nodeViewMode;
  }

  if (patch.statusCardsVisibility) {
    Object.keys(patch.statusCardsVisibility).forEach((key) => {
      delete next[`statusCardsVisibility.${key}`];
    });

    next.statusCardsVisibility = {
      ...(isRecord(next.statusCardsVisibility) ? next.statusCardsVisibility : {}),
      ...patch.statusCardsVisibility,
    };
  }

  if (patch.guestDisplay) {
    Object.keys(patch.guestDisplay).forEach((key) => {
      delete next[`guestDisplay.${key}`];
    });

    next.guestDisplay = {
      ...(isRecord(next.guestDisplay) ? next.guestDisplay : {}),
      ...patch.guestDisplay,
    };
  }

  if (patch.uptimeKuma) {
    Object.keys(patch.uptimeKuma).forEach((key) => {
      delete next[`uptimeKuma.${key}`];
    });

    next.uptimeKuma = {
      ...(isRecord(next.uptimeKuma) ? next.uptimeKuma : {}),
      ...patch.uptimeKuma,
    };
  }

  return next;
}
