import type { BackgroundBlurType, CardBlurType } from "./types";

export const CARD_BLUR_STYLE_PROPERTIES = {
  filter: "--komari-card-backdrop-filter",
  backgroundAlpha: "--komari-card-background-alpha",
  borderAlpha: "--komari-card-border-alpha",
  glassStartAlpha: "--komari-card-glass-start-alpha",
  glassMiddleAlpha: "--komari-card-glass-middle-alpha",
  glassEndAlpha: "--komari-card-glass-end-alpha",
  glassHighlightMix: "--komari-card-glass-highlight-mix",
  glassDarkHighlightMix: "--komari-card-glass-dark-highlight-mix",
  glassBorderWhiteMix: "--komari-card-glass-border-white-mix",
  glassDarkBorderWhiteMix: "--komari-card-glass-dark-border-white-mix",
  glassOutlineAlpha: "--komari-card-glass-outline-alpha",
  glassDarkOutlineAlpha: "--komari-card-glass-dark-outline-alpha",
  glassShadowAlpha: "--komari-card-glass-shadow-alpha",
  glassSecondaryShadowAlpha: "--komari-card-glass-secondary-shadow-alpha",
  glassDarkShadowAlpha: "--komari-card-glass-dark-shadow-alpha",
  glassDarkSecondaryShadowAlpha: "--komari-card-glass-dark-secondary-shadow-alpha",
  glassInnerHighlightAlpha: "--komari-card-glass-inner-highlight-alpha",
  glassDarkInnerHighlightAlpha: "--komari-card-glass-dark-inner-highlight-alpha",
  glassInnerLowlightAlpha: "--komari-card-glass-inner-lowlight-alpha",
  glassDarkInnerLowlightAlpha: "--komari-card-glass-dark-inner-lowlight-alpha",
} as const;

export function clampBackgroundBlurIntensity(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function cssPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function cssAlpha(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function cssString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, "\\A ")
    .replace(/\r/g, "\\D ")
    .replace(/\f/g, "\\C ");
}

export function getBackgroundBlurPresentation(
  type: BackgroundBlurType,
  intensity: number,
  enabled: boolean
) {
  if (!enabled || intensity <= 0) {
    return {
      filter: "none",
      bleed: "0px",
    };
  }

  const normalized = clampBackgroundBlurIntensity(intensity);
  const blur = (multiplier: number) => Number((normalized * multiplier).toFixed(1));
  const amount = normalized / 100;

  const filterByType: Record<BackgroundBlurType, string> = {
    soft: `blur(${blur(0.1)}px) saturate(${(1 + amount * 0.04).toFixed(2)})`,
    glass: `blur(${blur(0.42)}px) saturate(${(1 + amount * 1.1).toFixed(2)}) brightness(${(1 + amount * 0.12).toFixed(2)}) contrast(${(1 - amount * 0.1).toFixed(2)})`,
  };

  return {
    filter: filterByType[type],
    bleed: `${Math.ceil(normalized * 0.28)}px`,
  };
}

export function getCardBlurPresentation(
  type: CardBlurType,
  transparentIntensity: number,
  extraBlurIntensity: number,
  enabled: boolean
) {
  if (!enabled) {
    return {
      filter: "none",
      backgroundAlpha: "100%",
      borderAlpha: "100%",
      glassStartAlpha: "100%",
      glassMiddleAlpha: "100%",
      glassEndAlpha: "100%",
      glassHighlightMix: "0%",
      glassDarkHighlightMix: "0%",
      glassBorderWhiteMix: "0%",
      glassDarkBorderWhiteMix: "0%",
      glassOutlineAlpha: "0",
      glassDarkOutlineAlpha: "0",
      glassShadowAlpha: "0",
      glassSecondaryShadowAlpha: "0",
      glassDarkShadowAlpha: "0",
      glassDarkSecondaryShadowAlpha: "0",
      glassInnerHighlightAlpha: "0",
      glassDarkInnerHighlightAlpha: "0",
      glassInnerLowlightAlpha: "0",
      glassDarkInnerLowlightAlpha: "0",
    };
  }

  const transparentNormalized = clampBackgroundBlurIntensity(transparentIntensity);
  const extraBlurNormalized = clampBackgroundBlurIntensity(extraBlurIntensity);
  const blur = (multiplier: number) => Number((extraBlurNormalized * multiplier).toFixed(1));
  const transparentAmount = transparentNormalized / 100;
  const extraBlurAmount = extraBlurNormalized / 100;

  const filterByType: Record<CardBlurType, string> = {
    soft: `blur(${blur(0.08)}px) saturate(${(1 + extraBlurAmount * 0.06).toFixed(2)})`,
    glass: `blur(${blur(0.42)}px) saturate(${(1 + extraBlurAmount * 1.15).toFixed(2)}) brightness(${(1 + extraBlurAmount * 0.12).toFixed(2)}) contrast(${(1 - extraBlurAmount * 0.1).toFixed(2)})`,
  };

  const backgroundAlphaByType: Record<CardBlurType, number> = {
    soft: 100 - transparentAmount * 100,
    glass: 72 - transparentAmount * 36,
  };

  const borderAlphaByType: Record<CardBlurType, number> = {
    soft: 90 - transparentAmount * 60,
    glass: 80 + transparentAmount * 20,
  };

  return {
    filter: extraBlurNormalized > 0 ? filterByType[type] : "none",
    backgroundAlpha: `${Math.round(backgroundAlphaByType[type])}%`,
    borderAlpha: `${Math.round(borderAlphaByType[type])}%`,
    glassStartAlpha: cssPercent(72 - transparentAmount * 36),
    glassMiddleAlpha: cssPercent(46 - transparentAmount * 26),
    glassEndAlpha: cssPercent(34 - transparentAmount * 22),
    glassHighlightMix: cssPercent(8 + extraBlurAmount * 22),
    glassDarkHighlightMix: cssPercent(5 + extraBlurAmount * 14),
    glassBorderWhiteMix: cssPercent(28 + extraBlurAmount * 42),
    glassDarkBorderWhiteMix: cssPercent(14 + extraBlurAmount * 24),
    glassOutlineAlpha: cssAlpha(0.14 + extraBlurAmount * 0.28),
    glassDarkOutlineAlpha: cssAlpha(0.08 + extraBlurAmount * 0.18),
    glassShadowAlpha: cssAlpha(0.08 + extraBlurAmount * 0.2),
    glassSecondaryShadowAlpha: cssAlpha(0.05 + extraBlurAmount * 0.12),
    glassDarkShadowAlpha: cssAlpha(0.24 + extraBlurAmount * 0.28),
    glassDarkSecondaryShadowAlpha: cssAlpha(0.16 + extraBlurAmount * 0.18),
    glassInnerHighlightAlpha: cssAlpha(0.18 + extraBlurAmount * 0.42),
    glassDarkInnerHighlightAlpha: cssAlpha(0.1 + extraBlurAmount * 0.2),
    glassInnerLowlightAlpha: cssAlpha(0.06 + extraBlurAmount * 0.12),
    glassDarkInnerLowlightAlpha: cssAlpha(0.04 + extraBlurAmount * 0.08),
  };
}
