import type { UptimeKumaSettings } from "@/lib/uptimeKuma";

export type ColorTheme = "default" | "ocean" | "sunset" | "forest" | "midnight" | "rose";

export type CardLayout = "classic" | "modern" | "minimal" | "detailed" | "compact";

export type CardDesign = "default" | "quality-bars";

export type StatusDesign = "default" | "speed";

export type GraphDesign = "circle" | "progress" | "bar" | "minimal";

export type NodeViewMode = "grid" | "table";

export type BackgroundBlurType = "soft" | "glass";

export type CardBlurType = BackgroundBlurType;

export type Appearance = "light" | "dark" | "system";

export interface ThemeConfig {
  colorTheme: ColorTheme;
  cardLayout: CardLayout;
  cardDesign: CardDesign;
  statusDesign: StatusDesign;
  graphDesign: GraphDesign;
  showRamDiskTotal: boolean;
  backgroundImageUrl?: string;
  backgroundBlurEnabled: boolean;
  backgroundBlurType: BackgroundBlurType;
  backgroundBlurIntensity: number;
  backgroundMaskOpacity: number;
  cardBlurEnabled: boolean;
  cardBlurType: CardBlurType;
  // Persisted key kept for compatibility; this now drives card transparency.
  cardBlurIntensity: number;
  cardExtraBlurIntensity: number;
}

export type StatusCardsVisibility = {
  currentTime: boolean;
  currentOnline: boolean;
  regionOverview: boolean;
  trafficOverview: boolean;
  networkSpeed: boolean;
  mapView: boolean;
};

export type GuestDisplaySettings = {
  showPrice: boolean;
  showExpiredAt: boolean;
};

export interface ManagedThemeSettings extends Partial<ThemeConfig> {
  logoUrl?: string;
  statusCardsVisibility?: Partial<StatusCardsVisibility>;
  guestDisplay?: Partial<GuestDisplaySettings>;
  uptimeKuma?: Partial<UptimeKumaSettings>;
  nodeViewMode?: NodeViewMode;
  appearance?: Appearance;
  language?: string;
}

export interface ThemeContextType {
  themeConfig: ThemeConfig;
  managedThemeSettings: ManagedThemeSettings;
  isThemeSettingsAdmin: boolean;
  isThemeSettingsAdminReady: boolean;
  isThemeLoaded: boolean;
  isLoggedIn: boolean;
  statusCardsVisibility: StatusCardsVisibility;
  guestDisplay: GuestDisplaySettings;
  nodeViewMode: NodeViewMode;
  appearance: Appearance;
  language: string;
  setColorTheme: (theme: ColorTheme) => void;
  setCardLayout: (layout: CardLayout) => void;
  setCardDesign: (design: CardDesign) => void;
  setStatusDesign: (design: StatusDesign) => void;
  setGraphDesign: (design: GraphDesign) => void;
  setShowRamDiskTotal: (show: boolean) => void;
  setBackgroundImageUrl: (url: string) => void;
  setBackgroundBlurEnabled: (enabled: boolean) => void;
  setBackgroundBlurType: (type: BackgroundBlurType) => void;
  setBackgroundBlurIntensity: (intensity: number) => void;
  setBackgroundMaskOpacity: (opacity: number) => void;
  setCardBlurEnabled: (enabled: boolean) => void;
  setCardBlurType: (type: CardBlurType) => void;
  setCardTransparentIntensity: (intensity: number) => void;
  setCardBlurIntensity: (intensity: number) => void;
  setCardExtraBlurIntensity: (intensity: number) => void;
  setStatusCardVisibility: (key: keyof StatusCardsVisibility, checked: boolean) => void;
  setGuestDisplay: (key: keyof GuestDisplaySettings, checked: boolean) => void;
  setNodeViewMode: (value: NodeViewMode) => void;
  setAppearance: (value: Appearance) => void;
  setLanguage: (value: string) => void;
  setLogoUrl: (value: string) => void;
  setUptimeKuma: (patch: Partial<UptimeKumaSettings>) => void;
}
