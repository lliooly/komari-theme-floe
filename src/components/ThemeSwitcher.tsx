"use client";

import { useEffect, useState } from 'react';
import {
  useTheme,
  BackgroundBlurType,
  CardBlurType,
  ColorTheme,
  DEFAULT_GUEST_DISPLAY_SETTINGS,
  CardDesign,
  CardLayout,
  GuestDisplaySettings,
  GraphDesign,
  StatusDesign,
} from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Activity, Check, Gauge, Palette, Layout, PieChart, Image, Settings, Grid3X3, Table2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  type StatusCardsVisibility,
  useStatusCardsVisibility,
} from '@/hooks/useStatusCardsVisibility';
import { useNodeViewMode } from '@/hooks/useNodeViewMode';
import { cn } from '@/lib/utils';
import AnnouncementEditor from './AnnouncementEditor';
import ThemeSettingsDefaults from './ThemeSettingsDefaults';

type ThemeSwitcherProps = {
  variant?: 'popover' | 'page';
};

const ThemeSwitcher = ({ variant = 'popover' }: ThemeSwitcherProps) => {
  const {
    themeConfig,
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
    setCardExtraBlurIntensity,
    isThemeSettingsAdmin,
    managedThemeSettings,
    setGuestDisplay,
  } = useTheme();
  const { t } = useTranslation();
  const [bgUrlInput, setBgUrlInput] = useState(themeConfig.backgroundImageUrl || '');
  const [statusCardsVisibility, updateStatusCardVisibility] = useStatusCardsVisibility();
  const [nodeViewMode, setNodeViewMode] = useNodeViewMode();

  useEffect(() => {
    setBgUrlInput(themeConfig.backgroundImageUrl || '');
  }, [themeConfig.backgroundImageUrl]);

  const colorThemes: { value: ColorTheme; label: string; colors: string }[] = [
    { value: 'default', label: t('themeCustomizer.colorThemes.default', { defaultValue: 'Default' }), colors: 'from-blue-500 to-purple-500' },
    { value: 'ocean', label: t('themeCustomizer.colorThemes.ocean', { defaultValue: 'Ocean' }), colors: 'from-cyan-500 to-blue-600' },
    { value: 'sunset', label: t('themeCustomizer.colorThemes.sunset', { defaultValue: 'Sunset' }), colors: 'from-orange-500 to-pink-500' },
    { value: 'forest', label: t('themeCustomizer.colorThemes.forest', { defaultValue: 'Forest' }), colors: 'from-green-500 to-emerald-600' },
    { value: 'midnight', label: t('themeCustomizer.colorThemes.midnight', { defaultValue: 'Midnight' }), colors: 'from-indigo-600 to-purple-700' },
    { value: 'rose', label: t('themeCustomizer.colorThemes.rose', { defaultValue: 'Rose' }), colors: 'from-pink-500 to-rose-600' },
  ];

  const cardLayouts: { value: CardLayout; label: string; description: string }[] = [
    {
      value: 'classic',
      label: t('themeCustomizer.cardLayouts.classic.label', { defaultValue: 'Classic' }),
      description: t('themeCustomizer.cardLayouts.classic.description', { defaultValue: 'Traditional card design' }),
    },
    {
      value: 'modern',
      label: t('themeCustomizer.cardLayouts.modern.label', { defaultValue: 'Modern' }),
      description: t('themeCustomizer.cardLayouts.modern.description', { defaultValue: 'Icon left, horizontal' }),
    },
    {
      value: 'minimal',
      label: t('themeCustomizer.cardLayouts.minimal.label', { defaultValue: 'Minimal' }),
      description: t('themeCustomizer.cardLayouts.minimal.description', { defaultValue: 'Borderless, clean' }),
    },
    {
      value: 'detailed',
      label: t('themeCustomizer.cardLayouts.detailed.label', { defaultValue: 'Detailed' }),
      description: t('themeCustomizer.cardLayouts.detailed.description', { defaultValue: 'Icon top, centered' }),
    },
    {
      value: 'compact',
      label: t('themeCustomizer.cardLayouts.compact.label', { defaultValue: 'Compact' }),
      description: t('themeCustomizer.cardLayouts.compact.description', { defaultValue: 'Dense, table-like' }),
    },
  ];

  const cardDesigns: { value: CardDesign; label: string; description: string }[] = [
    {
      value: 'default',
      label: t('themeCustomizer.cardDesigns.default.label', { defaultValue: 'Default' }),
      description: t('themeCustomizer.cardDesigns.default.description', { defaultValue: 'Text ping statistics' }),
    },
    {
      value: 'quality-bars',
      label: t('themeCustomizer.cardDesigns.qualityBars.label', { defaultValue: 'History Bars' }),
      description: t('themeCustomizer.cardDesigns.qualityBars.description', { defaultValue: 'Latency and packet loss block history' }),
    },
  ];

  const statusDesigns: { value: StatusDesign; label: string; description: string }[] = [
    {
      value: 'default',
      label: t('themeCustomizer.statusDesigns.default.label', { defaultValue: 'Default' }),
      description: t('themeCustomizer.statusDesigns.default.description', { defaultValue: 'Standard status card values' }),
    },
    {
      value: 'speed',
      label: t('themeCustomizer.statusDesigns.speed.label', { defaultValue: 'Speed Gauge' }),
      description: t('themeCustomizer.statusDesigns.speed.description', { defaultValue: 'Gauge indicator for upload and download speed' }),
    },
  ];

  const graphDesigns: { value: GraphDesign; label: string; description: string }[] = [
    {
      value: 'circle',
      label: t('themeCustomizer.graphDesigns.circle.label', { defaultValue: 'Circle' }),
      description: t('themeCustomizer.graphDesigns.circle.description', { defaultValue: 'Circular progress' }),
    },
    {
      value: 'progress',
      label: t('themeCustomizer.graphDesigns.progress.label', { defaultValue: 'Progress Bar' }),
      description: t('themeCustomizer.graphDesigns.progress.description', { defaultValue: 'Linear progress' }),
    },
    {
      value: 'bar',
      label: t('themeCustomizer.graphDesigns.bar.label', { defaultValue: 'Bar Chart' }),
      description: t('themeCustomizer.graphDesigns.bar.description', { defaultValue: 'Vertical bars' }),
    },
    {
      value: 'minimal',
      label: t('themeCustomizer.graphDesigns.minimal.label', { defaultValue: 'Minimal' }),
      description: t('themeCustomizer.graphDesigns.minimal.description', { defaultValue: 'Simple text' }),
    },
  ];

  const backgroundBlurTypes: { value: BackgroundBlurType; label: string; description: string }[] = [
    {
      value: 'soft',
      label: t('themeCustomizer.backgroundBlurTypes.soft.label', { defaultValue: 'Soft' }),
      description: t('themeCustomizer.backgroundBlurTypes.soft.description', { defaultValue: 'Subtle focus' }),
    },
    {
      value: 'glass',
      label: t('themeCustomizer.backgroundBlurTypes.glass.label', { defaultValue: 'Glass' }),
      description: t('themeCustomizer.backgroundBlurTypes.glass.description', { defaultValue: 'Strong glass' }),
    },
  ];

  const cardBlurTypes: { value: CardBlurType; label: string; description: string }[] = [
    {
      value: 'soft',
      label: t('themeCustomizer.backgroundBlurTypes.soft.label', { defaultValue: 'Soft' }),
      description: t('themeCustomizer.backgroundBlurTypes.soft.description', { defaultValue: 'Subtle focus' }),
    },
    {
      value: 'glass',
      label: t('themeCustomizer.backgroundBlurTypes.glass.label', { defaultValue: 'Glass' }),
      description: t('themeCustomizer.backgroundBlurTypes.glass.description', { defaultValue: 'Strong glass' }),
    },
  ];

  const statusSettings: Array<{ key: keyof StatusCardsVisibility; label: string }> = [
    { key: 'currentTime', label: t('current_time') },
    { key: 'currentOnline', label: t('current_online') },
    { key: 'regionOverview', label: t('region_overview') },
    { key: 'trafficOverview', label: t('traffic_overview') },
    { key: 'networkSpeed', label: t('network_speed') },
    { key: 'mapView', label: t('common.map', { defaultValue: 'Map' }) },
  ];
  const configuredGuestDisplay: GuestDisplaySettings = {
    ...DEFAULT_GUEST_DISPLAY_SETTINGS,
    ...(managedThemeSettings.guestDisplay || {}),
  };

  const guestDisplaySettings: Array<{ key: keyof GuestDisplaySettings; label: string; description: string }> = [
    {
      key: 'showPrice',
      label: t('themeCustomizer.guestDisplay.showPrice', { defaultValue: 'Show prices to guests' }),
      description: t('themeCustomizer.guestDisplay.showPriceDescription', {
        defaultValue: 'Display node price for visitors.',
      }),
    },
    {
      key: 'showExpiredAt',
      label: t('themeCustomizer.guestDisplay.showExpiredAt', { defaultValue: 'Show expiration to guests' }),
      description: t('themeCustomizer.guestDisplay.showExpiredAtDescription', {
        defaultValue: 'Display node expiration status for visitors.',
      }),
    },
  ];

  const settingsPanel = (
    <div className={variant === 'page' ? 'flex flex-col gap-6' : 'flex flex-col gap-4'}>
      {variant === 'page' && <ThemeSettingsDefaults />}
      <AnnouncementEditor variant={variant === 'page' ? 'inline' : 'dialog'} />
          <div className={cn(
            variant === 'page' && 'rounded-2xl border border-border/70 bg-card/35 p-4 shadow-sm md:p-6',
          )}>
            <h4 className={cn(
              'font-semibold text-sm mb-3 flex items-center gap-2',
              variant === 'page'
                ? 'border-b border-border/60 pb-3'
                : 'sticky -top-4 z-10 -mx-4 bg-popover px-4 pb-2 pt-4',
            )}>
              <Palette className="h-4 w-4" />
              {t('themeCustomizer.colorTheme', { defaultValue: 'Color Theme' })}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {colorThemes.map((theme) => (
                <button
                  key={theme.value}
                  type="button"
                  aria-pressed={themeConfig.colorTheme === theme.value}
                  onClick={() => setColorTheme(theme.value)}
                  className={`relative rounded-lg p-2 text-left transition-all ${
                    themeConfig.colorTheme === theme.value
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className={`h-6 w-full rounded-md bg-gradient-to-r ${theme.colors} mb-1.5`} />
                  <span className="text-[10px] font-medium">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t('themeCustomizer.cardLayout', { defaultValue: 'Card Layout' })}
            </h4>
            <div className="flex flex-col gap-1.5">
              {cardLayouts.map((layout) => (
                <button
                  key={layout.value}
                  type="button"
                  aria-pressed={themeConfig.cardLayout === layout.value}
                  onClick={() => setCardLayout(layout.value)}
                  className={`flex items-start gap-2 rounded-lg p-2 text-left transition-all ${
                    themeConfig.cardLayout === layout.value
                      ? 'bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-xs">{layout.label}</div>
                    <div className="text-[10px] text-muted-foreground">{layout.description}</div>
                  </div>
                  {themeConfig.cardLayout === layout.value && (
                    <div
                      aria-hidden="true"
                      className="semantic-icon-transition mt-0.5 h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('themeCustomizer.cardDesign', { defaultValue: 'Card Design' })}
            </h4>
            <div className="flex flex-col gap-1.5">
              {cardDesigns.map((design) => (
                <button
                  key={design.value}
                  type="button"
                  aria-pressed={themeConfig.cardDesign === design.value}
                  onClick={() => setCardDesign(design.value)}
                  className={`flex items-start gap-2 rounded-lg p-2 text-left transition-all ${
                    themeConfig.cardDesign === design.value
                      ? 'bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-xs">{design.label}</div>
                    <div className="text-[10px] text-muted-foreground">{design.description}</div>
                  </div>
                  {themeConfig.cardDesign === design.value && (
                    <div
                      aria-hidden="true"
                      className="semantic-icon-transition mt-0.5 h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t('themeCustomizer.cardBackground', { defaultValue: 'Card Background' })}
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('themeCustomizer.cardBlur', { defaultValue: 'Card Blur' })}
                </span>
                <Switch
                  checked={themeConfig.cardBlurEnabled}
                  onCheckedChange={setCardBlurEnabled}
                />
              </div>
              {themeConfig.cardBlurEnabled && (
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                      {t('themeCustomizer.cardBlurType', { defaultValue: 'Blur Type' })}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cardBlurTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          aria-pressed={themeConfig.cardBlurType === type.value}
                          onClick={() => setCardBlurType(type.value)}
                          className={`rounded-md p-2 text-left transition-all ${
                            themeConfig.cardBlurType === type.value
                              ? 'bg-primary/10'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="text-[11px] font-medium leading-tight">{type.label}</div>
                          <div className="text-[10px] leading-tight text-muted-foreground">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {t('themeCustomizer.cardBlurIntensity', { defaultValue: 'Transparent Intensity' })}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {themeConfig.cardBlurIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={themeConfig.cardBlurIntensity}
                      onChange={(event) => setCardTransparentIntensity(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-primary"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {t('themeCustomizer.cardExtraBlurIntensity', { defaultValue: 'Extra Blur Intensity' })}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {themeConfig.cardExtraBlurIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={themeConfig.cardExtraBlurIntensity}
                      onChange={(event) => setCardExtraBlurIntensity(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("status_settings")}
            </h4>
            <div className="flex flex-col gap-3">
              {statusSettings.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </span>
                  <Switch
                    checked={statusCardsVisibility[item.key]}
                    onCheckedChange={(checked) =>
                      updateStatusCardVisibility(item.key, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {isThemeSettingsAdmin && (
            <div className="pt-3">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t("themeCustomizer.guestDisplay.title", { defaultValue: "Guest Display" })}
              </h4>
              <div className="flex flex-col gap-3">
                {guestDisplaySettings.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </div>
                      <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={configuredGuestDisplay[item.key]}
                      onCheckedChange={(checked) => setGuestDisplay(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              {t('themeCustomizer.statusDesign', { defaultValue: 'Status Design' })}
            </h4>
            <div className="flex flex-col gap-1.5">
              {statusDesigns.map((design) => (
                <button
                  key={design.value}
                  type="button"
                  aria-pressed={themeConfig.statusDesign === design.value}
                  onClick={() => setStatusDesign(design.value)}
                  className={`flex items-start gap-2 rounded-lg p-2 text-left transition-all ${
                    themeConfig.statusDesign === design.value
                      ? 'bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-xs">{design.label}</div>
                    <div className="text-[10px] text-muted-foreground">{design.description}</div>
                  </div>
                  {themeConfig.statusDesign === design.value && (
                    <div
                      aria-hidden="true"
                      className="semantic-icon-transition mt-0.5 h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t("nodeDisplay.defaultView", { defaultValue: "Default View" })}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={nodeViewMode === "grid" ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-9 justify-center gap-2 text-xs",
                  nodeViewMode === "grid" && "bg-primary/10"
                )}
                aria-pressed={nodeViewMode === "grid"}
                onClick={() => setNodeViewMode("grid")}
              >
                <Grid3X3
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 motion-reduce:transition-none",
                    nodeViewMode === "grid" && "scale-110"
                  )}
                />
                {t("nodeDisplay.grid", { defaultValue: "Grid" })}
              </Button>
              <Button
                type="button"
                variant={nodeViewMode === "table" ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  "h-9 justify-center gap-2 text-xs",
                  nodeViewMode === "table" && "bg-primary/10"
                )}
                aria-pressed={nodeViewMode === "table"}
                onClick={() => setNodeViewMode("table")}
              >
                <Table2
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 transition-transform duration-200 motion-reduce:transition-none",
                    nodeViewMode === "table" && "scale-110"
                  )}
                />
                {t("nodeDisplay.table", { defaultValue: "Table" })}
              </Button>
            </div>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {t('themeCustomizer.graphDesign', { defaultValue: 'Graph Design' })}
            </h4>
            <div className="flex flex-col gap-1.5">
              {graphDesigns.map((design) => (
                <button
                  key={design.value}
                  type="button"
                  aria-pressed={themeConfig.graphDesign === design.value}
                  onClick={() => setGraphDesign(design.value)}
                  className={`flex items-start gap-2 rounded-lg p-2 text-left transition-all ${
                    themeConfig.graphDesign === design.value
                      ? 'bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-xs">{design.label}</div>
                    <div className="text-[10px] text-muted-foreground">{design.description}</div>
                  </div>
                  {themeConfig.graphDesign === design.value && (
                    <div
                      aria-hidden="true"
                      className="semantic-icon-transition mt-0.5 h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t('themeCustomizer.showRamDiskTotal', { defaultValue: 'Show Total RAM/Disk' })}
              </span>
              <Switch
                checked={themeConfig.showRamDiskTotal}
                onCheckedChange={(checked) => setShowRamDiskTotal(checked)}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('themeCustomizer.showRamDiskTotalDescription', { defaultValue: 'Display used / total for RAM and Disk.' })}
            </p>
          </div>

          <div className="pt-3">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Image className="h-4 w-4" />
              {t('themeCustomizer.backgroundImage', { defaultValue: 'Background Image' })}
            </h4>
            <div className="flex flex-col gap-2">
              <Input
                type="url"
                placeholder={t('themeCustomizer.backgroundImagePlaceholder', { defaultValue: 'Enter image URL' })}
                value={bgUrlInput}
                onChange={(e) => setBgUrlInput(e.target.value)}
                className="text-xs"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="flex-1 text-xs h-8"
                  onClick={() => setBackgroundImageUrl(bgUrlInput)}
                >
                  <Check aria-hidden="true" className="h-3.5 w-3.5 semantic-icon-transition" />
                  {t('themeCustomizer.apply', { defaultValue: 'Apply' })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-8"
                  onClick={() => {
                    setBgUrlInput('');
                    setBackgroundImageUrl('');
                  }}
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5 semantic-icon-transition" />
                  {t('themeCustomizer.clear', { defaultValue: 'Clear' })}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('themeCustomizer.backgroundBlur', { defaultValue: 'Background Blur' })}
                </span>
                <Switch
                  checked={themeConfig.backgroundBlurEnabled}
                  onCheckedChange={setBackgroundBlurEnabled}
                />
              </div>
              {themeConfig.backgroundBlurEnabled && (
                <div className="flex flex-col gap-2">
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                      {t('themeCustomizer.backgroundBlurType', { defaultValue: 'Blur Type' })}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {backgroundBlurTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          aria-pressed={themeConfig.backgroundBlurType === type.value}
                          onClick={() => setBackgroundBlurType(type.value)}
                          className={`rounded-md p-2 text-left transition-all ${
                            themeConfig.backgroundBlurType === type.value
                              ? 'bg-primary/10'
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="text-[11px] font-medium leading-tight">{type.label}</div>
                          <div className="text-[10px] leading-tight text-muted-foreground">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {t('themeCustomizer.backgroundBlurIntensity', { defaultValue: 'Intensity' })}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {themeConfig.backgroundBlurIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={themeConfig.backgroundBlurIntensity}
                      onChange={(event) => setBackgroundBlurIntensity(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              )}
              {themeConfig.backgroundImageUrl && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t('themeCustomizer.backgroundMaskOpacity', { defaultValue: 'Mask Opacity' })}
                      </span>
                      <span className="text-sm font-medium tabular-nums">
                        {themeConfig.backgroundMaskOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={themeConfig.backgroundMaskOpacity}
                      onChange={(event) => setBackgroundMaskOpacity(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('themeCustomizer.backgroundMaskOpacityHint', { defaultValue: 'Overlays white (light) or black (dark) on the background image to improve text readability.' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
    </div>
  );

  if (variant === 'page') {
    return settingsPanel;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-4 w-4" />
          <span className="sr-only">
            {t('themeCustomizer.themeSettings', { defaultValue: 'Theme settings' })}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-[85vh] overflow-y-auto p-4" align="end" sideOffset={8}>
        {settingsPanel}
      </PopoverContent>
    </Popover>
  );
};

export default ThemeSwitcher;
