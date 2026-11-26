import { normalizeLanguage } from "@/i18n/config";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_THEME_CONFIG,
  I18NEXT_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  NODE_VIEW_MODES,
  NODE_VIEW_STORAGE_KEY,
  STATUS_CARDS_STORAGE_KEY,
  THEME_OVERRIDES_STORAGE_KEY,
} from "./constants";
import {
  isRecord,
  normalizeStatusCardsVisibilityOverrides,
  normalizeThemeConfigOverrides,
  pickAppearance,
  pickEnum,
} from "./model";
import type { Appearance, NodeViewMode, StatusCardsVisibility, ThemeConfig } from "./types";

function readJsonStorage(key: string): unknown {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return null;
  }
}

export function writeJsonStorage(key: string, value: unknown) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    if (isRecord(value) && Object.keys(value).length === 0) {
      window.localStorage.removeItem(key);
      return;
    }

    if (value === undefined || value === null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
}

export function removeStorage(key: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function readStringStorage(key: string): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function writeStringStorage(key: string, value: string) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function clearI18nLanguageCache() {
  removeStorage(I18NEXT_STORAGE_KEY);

  if (typeof document !== "undefined") {
    document.cookie = "i18next=; Max-Age=0; path=/";
  }
}

export function writeThemeOverrides(value: Partial<ThemeConfig>) {
  writeJsonStorage(THEME_OVERRIDES_STORAGE_KEY, value);

  removeStorage(LEGACY_THEME_STORAGE_KEY);
}

function extractLegacyThemeOverrides(input: unknown): Partial<ThemeConfig> {
  const config = normalizeThemeConfigOverrides(input);
  const result: Partial<ThemeConfig> = {};

  (Object.keys(config) as Array<keyof ThemeConfig>).forEach((key) => {
    if (config[key] !== DEFAULT_THEME_CONFIG[key]) {
      result[key] = config[key] as never;
    }
  });

  return result;
}

export function readInitialThemeOverrides(): Partial<ThemeConfig> {
  const current = normalizeThemeConfigOverrides(readJsonStorage(THEME_OVERRIDES_STORAGE_KEY));
  if (Object.keys(current).length > 0) {
    return current;
  }

  return extractLegacyThemeOverrides(readJsonStorage(LEGACY_THEME_STORAGE_KEY));
}

export function readInitialStatusCardsOverrides(): Partial<StatusCardsVisibility> {
  return normalizeStatusCardsVisibilityOverrides(readJsonStorage(STATUS_CARDS_STORAGE_KEY));
}

export function readInitialNodeViewOverride(): NodeViewMode | undefined {
  return pickEnum(readJsonStorage(NODE_VIEW_STORAGE_KEY), NODE_VIEW_MODES);
}

export function readInitialAppearanceOverride(): Appearance | undefined {
  return pickAppearance(readStringStorage(APPEARANCE_STORAGE_KEY));
}

export function readInitialLanguageOverride(): string | undefined {
  return normalizeLanguage(readStringStorage(LANGUAGE_STORAGE_KEY));
}

export function hasLocalOverrides() {
  return (
    Object.keys(normalizeThemeConfigOverrides(readJsonStorage(THEME_OVERRIDES_STORAGE_KEY))).length > 0 ||
    Object.keys(extractLegacyThemeOverrides(readJsonStorage(LEGACY_THEME_STORAGE_KEY))).length > 0 ||
    Object.keys(normalizeStatusCardsVisibilityOverrides(readJsonStorage(STATUS_CARDS_STORAGE_KEY))).length > 0 ||
    readInitialNodeViewOverride() !== undefined ||
    readInitialAppearanceOverride() !== undefined ||
    readInitialLanguageOverride() !== undefined
  );
}
