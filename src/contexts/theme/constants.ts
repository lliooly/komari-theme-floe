import type {
  Appearance,
  BackgroundBlurType,
  CardDesign,
  CardLayout,
  ColorTheme,
  GraphDesign,
  GuestDisplaySettings,
  NodeViewMode,
  StatusCardsVisibility,
  StatusDesign,
  ThemeConfig,
} from "./types";

export const LEGACY_THEME_STORAGE_KEY = "komari-theme-config";

export const THEME_OVERRIDES_STORAGE_KEY = "komari-theme-config-overrides";

export const STATUS_CARDS_STORAGE_KEY = "statusCardsVisibility";

export const STATUS_CARDS_CHANGE_EVENT = "statusCardsVisibilityChange";

export const NODE_VIEW_STORAGE_KEY = "nodeViewMode";

export const NODE_VIEW_CHANGE_EVENT = "nodeViewModeChange";

export const APPEARANCE_STORAGE_KEY = "komari-appearance";

export const NEXT_THEMES_STORAGE_KEY = "theme";

export const LANGUAGE_STORAGE_KEY = "komari-language";

export const I18NEXT_STORAGE_KEY = "i18nextLng";

export const LOCAL_OVERRIDE_BASE_SIGNATURE_KEY = "komari-theme-local-override-base";

export const COLOR_THEMES: ColorTheme[] = ["default", "ocean", "sunset", "forest", "midnight", "rose"];

export const CARD_LAYOUTS: CardLayout[] = ["classic", "modern", "minimal", "detailed", "compact"];

export const CARD_DESIGNS: CardDesign[] = ["default", "quality-bars"];

export const STATUS_DESIGNS: StatusDesign[] = ["default", "speed"];

export const GRAPH_DESIGNS: GraphDesign[] = ["circle", "progress", "bar", "minimal"];

export const NODE_VIEW_MODES: NodeViewMode[] = ["grid", "table"];

export const APPEARANCES: Appearance[] = ["light", "dark", "system"];

export const BACKGROUND_BLUR_TYPES: BackgroundBlurType[] = ["soft", "glass"];

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colorTheme: "default",
  cardLayout: "classic",
  cardDesign: "default",
  statusDesign: "default",
  graphDesign: "circle",
  showRamDiskTotal: false,
  backgroundImageUrl: "",
  backgroundBlurEnabled: false,
  backgroundBlurType: "soft",
  backgroundBlurIntensity: 35,
  backgroundMaskOpacity: 0,
  cardBlurEnabled: false,
  cardBlurType: "glass",
  cardBlurIntensity: 35,
  cardExtraBlurIntensity: 35,
};

export const DEFAULT_STATUS_CARDS_VISIBILITY: StatusCardsVisibility = {
  currentTime: true,
  currentOnline: true,
  regionOverview: true,
  trafficOverview: true,
  networkSpeed: true,
  mapView: true,
};

export const DEFAULT_GUEST_DISPLAY_SETTINGS: GuestDisplaySettings = {
  showPrice: false,
  showExpiredAt: false,
};

export const DEFAULT_NODE_VIEW_MODE: NodeViewMode = "grid";

export const DEFAULT_APPEARANCE: Appearance = "system";
