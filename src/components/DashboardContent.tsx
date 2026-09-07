"use client";

import React, { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Globe, Activity, ArrowUpRight, Zap } from "@/components/Icones/Reicon";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import NodeDisplay from "@/components/NodeDisplay";
import { formatBytes } from "@/utils/unitHelper";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useNodeList } from "@/contexts/NodeListContext";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import { useTheme } from "@/contexts/ThemeContext";
import Loading from "@/components/loading";
import { CurrentTimeCard } from "@/components/CurrentTimeCard";
import { Callouts } from "@/components/DashboardCallouts";
import { NodeMapView } from "@/components/NodeMapView";
import UptimeKumaStatus from "@/components/UptimeKumaStatus";
import { useStatusCardsVisibility } from "@/hooks/useStatusCardsVisibility";
import { useMounted } from "@/hooks/useMounted";
import { AnimatedNumber, DataChange } from "@/components/ui/animated-number";
import { getRevealProps } from "@/lib/reveal";

// Intelligent speed formatting function
const formatSpeed = (bytes: number): string => {
  if (bytes === 0) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  // Adaptive decimal places
  let decimals = 2;
  if (i >= 3) decimals = 1; // GB and above: 1 decimal
  if (i <= 1) decimals = 0; // B and KB: no decimals
  if (size >= 100) decimals = 0; // 100+ of any unit: no decimals

  return `${size.toFixed(decimals)} ${units[i]}`;
};

function DashboardGauge({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="ds-mini-gauge">
      <div className="ds-mini-gauge-arc">
        <div className="ds-mini-gauge-fill" style={{ ["--pct" as string]: `${pct}%` }} />
        <div className="ds-mini-gauge-center">
          <AnimatedNumber value={value} className="ds-mini-gauge-value" />
          {label ? <div className="ds-mini-gauge-label">{label}</div> : null}
        </div>
      </div>
    </div>
  );
}

const getDashboardSpeedGaugeMetric = (bytes: number) => {
  const text = formatSpeed(bytes);
  const match = text.match(/^([\d.]+)\s*(.+)$/);

  if (!match) {
    return {
      value: 0,
      unit: "B",
    };
  }

  return {
    value: Number(match[1]) || 0,
    unit: match[2].replace("/s", ""),
  };
};

const SpeedStatusValue = ({
  up,
  down,
  upBytes,
  downBytes,
}: {
  up: string;
  down: string;
  upBytes: number;
  downBytes: number;
}) => {
  const gaugeMetric = getDashboardSpeedGaugeMetric(Math.max(upBytes, downBytes));

  return (
    <div className="ds-metric-speed-panel" title={`↑ ${up} / ↓ ${down}`}>
      <DashboardGauge
        value={gaugeMetric.value}
        max={Math.max(10, gaugeMetric.value * 1.3)}
        label={gaugeMetric.unit}
      />
      <div className="ds-metric-speed-dual is-compact" title={`↑ ${up} / ↓ ${down}`} />
    </div>
  );
};

const renderSpeedStatusValue = ({
  up,
  down,
}: {
  up: number;
  down: number;
}) => (
  <SpeedStatusValue
    up={formatSpeed(up)}
    down={formatSpeed(down)}
    upBytes={up}
    downBytes={down}
  />
);

export default function DashboardContent() {
  const mounted = useMounted();
  const [t] = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { live_data } = useLiveData();
  const { publicInfo } = usePublicInfo();
  const { themeConfig, isThemeLoaded, managedThemeSettings } = useTheme();
  
  // Sync document title with backend-set custom title
  useEffect(() => {
    if (publicInfo?.sitename) {
      document.title = publicInfo.sitename;
    }
  }, [publicInfo?.sitename]);
  
  //#region 节点数据
  const { nodeList, isLoading, error, refresh } = useNodeList();
  const [revealReady, setRevealReady] = React.useState(false);

  useEffect(() => {
    if (isLoading) {
      setRevealReady(false);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setRevealReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isLoading]);

  const renderTrafficPair = (up: string, down: string) => {
    const animatedUp = <DataChange valueKey={up}>{up}</DataChange>;
    const animatedDown = <DataChange valueKey={down}>{down}</DataChange>;

    if (themeConfig.cardLayout === "modern") {
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>↑ {animatedUp}</span>
          <span className="text-muted-foreground">/</span>
          <span>↓ {animatedDown}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <div>↑ {animatedUp}</div>
        <div>↓ {animatedDown}</div>
      </div>
    );
  };

  const [statusCardsVisibility] = useStatusCardsVisibility();
  const onlineNodes = live_data?.data?.online ?? [];
  const onlineCount = onlineNodes.length;
  const totalCount = nodeList?.length ?? 0;
  const onlineRegionCount = nodeList
    ? Object.entries(
        nodeList.reduce((acc, item) => {
          if (onlineNodes.includes(item.uuid)) {
            acc[item.region] = (acc[item.region] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      ).length
    : 0;

  // Status cards configuration
  const statusCards = [
    {
      key: "currentTime",
      title: t("current_time"),
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      renderValue: () => <CurrentTimeCard />,
      visible: statusCardsVisibility.currentTime,
    },
    {
      key: "currentOnline",
      title: t("current_online"),
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      renderValue: () => (
        <span className="inline-flex items-baseline gap-0 tabular-nums">
          <AnimatedNumber value={onlineCount} />
          <span className="text-muted-foreground"> / </span>
          <AnimatedNumber value={totalCount} />
        </span>
      ),
      visible: statusCardsVisibility.currentOnline,
    },
    {
      key: "regionOverview",
      title: t("region_overview"),
      icon: <Globe className="h-4 w-4 text-muted-foreground" />,
      renderValue: () => <AnimatedNumber value={onlineRegionCount} />,
      visible: statusCardsVisibility.regionOverview,
    },
    {
      key: "trafficOverview",
      title: t("traffic_overview"),
      icon: <ArrowUpRight className="h-4 w-4 text-muted-foreground" />,
      renderValue: () => {
        const data = live_data?.data?.data;
        const online = live_data?.data?.online;
        if (!data || !online) return renderTrafficPair("0 B", "0 B");
        const onlineSet = new Set(online);
        const values = Object.entries(data)
          .filter(([uuid]) => onlineSet.has(uuid))
          .map(([, node]) => node);
        const up = values.reduce(
          (acc, node) => acc + (node.network.totalUp || 0),
          0
        );
        const down = values.reduce(
          (acc, node) => acc + (node.network.totalDown || 0),
          0
        );
        return renderTrafficPair(formatBytes(up), formatBytes(down));
      },
      visible: statusCardsVisibility.trafficOverview,
    },
    {
      key: "networkSpeed",
      title: t("network_speed"),
      icon: <Zap className="h-4 w-4 text-muted-foreground" />,
      structuredValue: themeConfig.statusDesign === "speed",
      renderValue: () => {
        const data = live_data?.data?.data;
        const online = live_data?.data?.online;
        if (!data || !online) {
          return themeConfig.statusDesign === "speed"
            ? renderSpeedStatusValue({ up: 0, down: 0 })
            : renderTrafficPair("0 B/s", "0 B/s");
        }
        const onlineSet = new Set(online);
        const values = Object.entries(data)
          .filter(([uuid]) => onlineSet.has(uuid))
          .map(([, node]) => node);
        const up = values.reduce(
          (acc, node) => acc + (node.network.up || 0),
          0
        );
        const down = values.reduce(
          (acc, node) => acc + (node.network.down || 0),
          0
        );
        const upText = formatSpeed(up);
        const downText = formatSpeed(down);
        return themeConfig.statusDesign === "speed"
          ? renderSpeedStatusValue({ up, down })
          : renderTrafficPair(upText, downText);
      },
      visible: statusCardsVisibility.networkSpeed,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <div>{t("common.error", { defaultValue: "Error" })}: {error}</div>;
  }
  //#endregion

  return (
    <div className="container mx-auto px-4 space-y-4">
      <Callouts />

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-2xl font-bold tracking-tight">{t("common.dashboard", { defaultValue: "Dashboard" })}</h2>
        </div>

        <div className={`grid ${
          themeConfig.cardLayout === 'classic' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4' :
          themeConfig.cardLayout === 'modern' ? 'grid-cols-1 gap-3 md:grid-cols-2 md:auto-rows-[96px] xl:grid-cols-3' :
          themeConfig.cardLayout === 'minimal' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3' :
          themeConfig.cardLayout === 'detailed' ? 'grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4' :
          themeConfig.cardLayout === 'compact' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'
        }`}>
          <AnimatePresence initial={false} mode="popLayout">
            {statusCards
              .filter((card) => card.visible)
              .map((card, index) => (
                <motion.div
                  key={card.key}
                  className="h-full"
                  layout="position"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <TopCard
                    title={card.title}
                    value={card.renderValue()}
                    icon={card.icon}
                    layout={themeConfig.cardLayout}
                    structuredValue={card.structuredValue}
                    revealDelay={index * 80}
                    revealReady={revealReady}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {mounted && isThemeLoaded && statusCardsVisibility.mapView && (
          <NodeMapView
            nodes={nodeList ?? []}
            liveData={live_data?.data ?? { online: [], data: {} }}
            mapOnly
            revealDelay={300}
            revealReady={revealReady}
          />
        )}
      </div>

      <Suspense fallback={<div className="p-4">{t("nodes.loading", { defaultValue: "Loading nodes..." })}</div>}>
        <NodeDisplay
          nodes={nodeList ?? []}
          liveData={live_data?.data ?? { online: [], data: {} }}
          revealDelay={300}
          revealReady={revealReady}
        />
      </Suspense>

      <UptimeKumaStatus
        settings={managedThemeSettings.uptimeKuma}
        revealDelay={300}
        revealReady={revealReady}
      />
    </div>
  );
}

type TopCardProps = {
  title: string;
  value: string | number | React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  layout?: 'classic' | 'modern' | 'minimal' | 'detailed' | 'compact';
  structuredValue?: boolean;
  revealDelay?: number;
  revealReady?: boolean;
};

const TopCard: React.FC<TopCardProps> = ({
  title,
  value,
  description,
  icon,
  layout = 'classic',
  structuredValue = false,
  revealDelay = 0,
  revealReady = true,
}) => {
  const mobileStructuredValueClass = "h-6 w-[5.75rem] shrink-0 overflow-hidden";
  const revealProps = getRevealProps(revealDelay, revealReady);

  // Classic layout: Traditional card with icon on right
  if (layout === 'classic') {
    return (
      <Card {...revealProps} className="h-full overflow-hidden shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
        {/* Mobile: single line layout */}
        <CardContent className="p-3 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {icon}
              <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {title}
              </div>
            </div>
            <div className={structuredValue ? mobileStructuredValueClass : "text-xs font-bold shrink-0 leading-tight"}>
              {value}
            </div>
          </div>
        </CardContent>
        {/* Desktop: original layout */}
        <div className="hidden sm:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
            <div className={structuredValue ? "min-w-0" : "text-xl font-bold line-clamp-2"}>{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </CardContent>
        </div>
      </Card>
    );
  }

  // Modern layout: Horizontal with icon on left
  if (layout === 'modern') {
    return (
      <Card {...revealProps} className="h-full overflow-hidden shadow-sm bg-gradient-to-br from-card to-card/50 hover:shadow-md transition-all duration-200">
        {/* Mobile: compact single line */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="text-primary">{icon}</div>
              <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {title}
              </div>
            </div>
            <div className={structuredValue ? mobileStructuredValueClass : "text-xs font-bold shrink-0 leading-tight"}>
              {value}
            </div>
          </div>
        </CardContent>
        {/* Desktop: original layout */}
        <CardContent className="p-0 h-full hidden md:block">
          <div className="flex h-full">
            <div className="w-12 bg-primary/10 flex flex-col items-center justify-center gap-2">
              <div className="text-primary">
                {icon}
              </div>
            </div>
            <div className="flex-1 p-2.5 flex flex-col justify-center min-w-0">
              <div className="text-[9px] font-semibold text-primary uppercase tracking-wider mb-0.5">
                {title}
              </div>
              <div className={structuredValue ? "min-w-0" : "text-lg font-bold leading-tight line-clamp-2 [&>div]:space-y-0.5"}>{value}</div>
              {description && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Minimal layout: Borderless, clean design
  if (layout === 'minimal') {
    return (
      <div {...revealProps} data-card-blur-surface="true" className="relative h-full rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/50 hover:to-muted/30 transition-all duration-200 backdrop-blur-sm">
        {/* Mobile: compact single line */}
        <div className="p-3 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="opacity-50 scale-90">{icon}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {title}
              </div>
            </div>
            <div className={structuredValue ? mobileStructuredValueClass : "text-xs font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent shrink-0 leading-tight"}>
              {value}
            </div>
          </div>
        </div>
        {/* Desktop: original layout */}
        <div className="p-4 hidden sm:block">
          <div className="absolute top-2.5 right-2.5 opacity-30 scale-75">
            {icon}
          </div>
          <div className={structuredValue ? "mb-2 min-w-0 pr-8" : "text-2xl font-black mb-1.5 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent line-clamp-2 pr-8"}>
            {value}
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {title}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground/70 mt-1 italic">
              {description}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detailed layout: Icon on top, centered
  if (layout === 'detailed') {
    return (
      <Card {...revealProps} className="h-full overflow-hidden shadow-md bg-card hover:shadow-xl transition-all duration-200">
        {/* Mobile: compact single line */}
        <CardContent className="p-3 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="text-primary">{icon}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {title}
              </div>
            </div>
            <div className={structuredValue ? mobileStructuredValueClass : "text-xs font-extrabold shrink-0 leading-tight"}>
              {value}
            </div>
          </div>
        </CardContent>
        {/* Desktop: original layout */}
        <CardContent className="p-0 hidden sm:block">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-3 pb-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-background shadow-lg mb-2">
              <div className="text-primary scale-110">
                {icon}
              </div>
            </div>
            <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <div className="p-4 text-center bg-gradient-to-b from-background to-muted/20">
            <div className={structuredValue ? "mb-1 min-w-0" : "text-2xl font-extrabold mb-1 tracking-tight line-clamp-2"}>{value}</div>
            {description && (
              <div className="text-xs text-muted-foreground font-medium">
                {description}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact layout: Same visual as classic, fully independent
  if (layout === 'compact') {
    return (
      <Card {...revealProps} className="h-full overflow-hidden shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
        {/* Mobile: single line layout */}
        <CardContent className="p-3 sm:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {icon}
              <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {title}
              </div>
            </div>
            <div className={structuredValue ? mobileStructuredValueClass : "text-xs font-bold shrink-0 leading-tight"}>
              {value}
            </div>
          </div>
        </CardContent>
        {/* Desktop: classic-style layout */}
        <div className="hidden sm:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {icon}
          </CardHeader>
          <CardContent>
            <div className={structuredValue ? "min-w-0" : "text-xl font-bold line-clamp-2"}>{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </CardContent>
        </div>
      </Card>
    );
  }

  return null;
};
