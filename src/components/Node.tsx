import React from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, ArrowUp, ArrowDown, Gauge, Upload, Download } from "@/components/Icones/Reicon";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { Record } from "../types/LiveData";
import { getOSImage, getOSName } from "@/utils/osImageHelper";
import { formatBytes } from "@/utils/unitHelper";
import { useTheme } from "@/contexts/ThemeContext";
import { usePingStats } from "@/hooks/usePingStats";
import { getRevealProps } from "@/lib/reveal";

import Flag from "./Flag";
import PriceTags from "./PriceTags";
import AdaptiveChart from "./AdaptiveChart";
import MiniPingChartFloat from "./MiniPingChartFloat";
import SpaLink from "./SpaLink";
import Tips from "./ui/tips";
import { DataChange } from "./ui/animated-number";

import { formatUptime, getTrafficUsed, getTrafficPercentage, formatTrafficPercentage } from "@/utils/nodeMetrics";
import PingQualityBars, { PingHistoryStrip, PING_HISTORY_PLACEHOLDER_POINTS } from "./PingQualityBars";

interface NodeProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
  pingStatsEnabled?: boolean;
  revealDelay?: number;
  revealReady?: boolean;
}

const Node = ({
  basic,
  live,
  online,
  pingStatsEnabled = false,
  revealDelay = 0,
  revealReady = true,
}: NodeProps) => {
  const [t] = useTranslation();
  const { guestDisplay, themeConfig } = useTheme();
  const pingStats = usePingStats(basic.uuid, 24, pingStatsEnabled);
  const showPrice = guestDisplay.showPrice;
  const showExpiredAt = guestDisplay.showExpiredAt;

  const defaultLive = {
    cpu: { usage: 0 },
    ram: { used: 0 },
    swap: { used: 0 },
    load: { load1: 0, load5: 0, load15: 0 },
    disk: { used: 0 },
    network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
    connections: { tcp: 0, udp: 0 },
    uptime: 0,
    process: 0,
    message: "",
    updated_at: "",
  } as Record;

  const liveData = live || defaultLive;

  // Calculate percentages
  const memoryUsagePercent = basic.mem_total
    ? (liveData.ram.used / basic.mem_total) * 100
    : 0;
  const diskUsagePercent = basic.disk_total
    ? (liveData.disk.used / basic.disk_total) * 100
    : 0;

  // Format network data
  const uploadSpeed = formatBytes(liveData.network.up);
  const downloadSpeed = formatBytes(liveData.network.down);
  const totalUpload = formatBytes(liveData.network.totalUp);
  const totalDownload = formatBytes(liveData.network.totalDown);
  const trafficLimitType = basic.traffic_limit_type ?? "sum";
  const trafficUsed = getTrafficUsed(
    liveData.network.totalUp,
    liveData.network.totalDown,
    trafficLimitType
  );
  const trafficPercentage = getTrafficPercentage(
    liveData.network.totalUp,
    liveData.network.totalDown,
    basic.traffic_limit,
    trafficLimitType
  );

  // Layout-specific styles
  const cardStyles = {
    classic: "flex h-full w-full flex-col transition-all duration-200 hover:shadow-lg overflow-hidden group",
    modern: "flex h-full w-full flex-col transition-all duration-200 hover:shadow-lg overflow-hidden group bg-gradient-to-br from-card to-card/50 shadow-sm",
    minimal: "flex h-full w-full flex-col transition-all duration-200 hover:shadow-md overflow-hidden group bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl",
    detailed: "flex h-full w-full flex-col transition-all duration-200 hover:shadow-xl overflow-hidden group shadow-md",
    compact: "flex h-full w-full flex-col transition-all duration-200 hover:shadow-lg overflow-hidden group",
  };

  const headerStyles = {
    classic: "pb-2 pt-4 px-4 space-y-0",
    modern: "pb-3 pt-3 px-4 space-y-0 bg-primary/5",
    minimal: "pb-2 pt-4 px-4 space-y-0",
    detailed: "pb-3 pt-5 px-5 space-y-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20",
    compact: "pb-2 pt-4 px-4 space-y-0",
  };

  const contentStyles = {
    classic: "px-4 pb-2 pt-4",
    modern: "px-4 pb-2 pt-4 bg-gradient-to-b from-background/50 to-transparent",
    minimal: "px-4 pb-2 pt-3",
    detailed: "px-5 pb-2 pt-4 bg-gradient-to-b from-background to-muted/10",
    compact: "px-4 pb-2 pt-3",
  };

  const footerStyles = {
    classic: "shrink-0 pb-3 pt-0 px-4 flex justify-between items-center",
    modern: "shrink-0 pb-3 pt-0 px-4 flex justify-between items-center bg-muted/20",
    minimal: "shrink-0 pb-3 pt-0 px-4 flex justify-between items-center",
    detailed: "shrink-0 pb-4 pt-0 px-5 flex justify-between items-center bg-muted/30",
    compact: "shrink-0 pb-3 pt-0 px-4 flex justify-between items-center",
  };

  return (
    <Card
      {...getRevealProps(revealDelay, revealReady)}
      id={basic.uuid}
      className={cardStyles[themeConfig.cardLayout] || cardStyles.classic}
    >
      {/* Header: Identity & Status */}
      <CardHeader className={headerStyles[themeConfig.cardLayout] || headerStyles.classic}>
        <div className="flex justify-between items-start">
          <div className="flex flex-1 min-w-0 items-center gap-3 overflow-hidden">
            {/* Flag position changes based on layout */}
            {themeConfig.cardLayout !== 'detailed' && (
              <div className="flex-shrink-0">
                <Flag flag={basic.region} />
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex flex-row min-w-0 items-center">
                <SpaLink href={`/instance/${basic.uuid}`} className="group-hover:text-primary transition-colors overflow-hidden flex-1">
                  <h3 className={`font-bold truncate pr-2 tracking-tight ${
                    themeConfig.cardLayout === 'detailed' ? 'text-lg' : 'text-base'
                  }`}>{basic.name}</h3>
                </SpaLink>
                <div className="flex items-center gap-1 shrink-0">
                  {live?.message && <Tips color="#CE282E">{live.message}</Tips>}
                  <MiniPingChartFloat
                    uuid={basic.uuid}
                    hours={24}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Badge
                    key={online ? "node-online" : "node-offline"}
                    variant={online ? "default" : "destructive"}
                    className={online ? "node-status-badge-transition bg-green-600 hover:bg-green-700" : "node-status-badge-transition"}
                  >
                    {online ? t("nodeCard.online") : t("nodeCard.offline")}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center text-[11px] text-muted-foreground/80 gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 bg-muted/50 px-1.5 py-0.5 rounded-lg min-w-0">
                  <img src={getOSImage(basic.os)} alt={basic.os} className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{getOSName(basic.os)}</span>
                </span>
                {themeConfig.cardLayout === 'detailed' && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded-lg text-primary">
                    <Flag flag={basic.region} />
                  </span>
                )}
                <span className="opacity-40">•</span>
                <span>{formatUptime(liveData.uptime, t)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {themeConfig.cardLayout !== 'minimal' && <Separator className="opacity-50" />}

      {/* Main Content: Metrics */}
      <CardContent className={contentStyles[themeConfig.cardLayout] || contentStyles.classic}>
        {themeConfig.cardLayout === 'compact' ? (
          /* ── Compact Layout ── */
          (() => {
            // 流量进度百分比（无限流量时为 0，格子始终显示）
            const compactTrafficPct = basic.traffic_limit > 0 ? trafficPercentage : 0;
            // 流量下方小字
            const compactTrafficSub = basic.traffic_limit > 0
              ? `${formatBytes(trafficUsed)} / ${formatBytes(basic.traffic_limit)}`
              : `${formatBytes(liveData.network.totalUp + liveData.network.totalDown)} / ∞`;

            // 价格行文字（上行）：免费直接显示【免费】，付费显示价格/周期
            const compactPriceLine = (() => {
              if (!basic.price || basic.price <= 0) return t("common.free", { defaultValue: "免费" });
              const cycleLabel = (() => {
                if (basic.billing_cycle >= 27 && basic.billing_cycle <= 32) return t("common.monthly");
                if (basic.billing_cycle >= 87 && basic.billing_cycle <= 95) return t("common.quarterly");
                if (basic.billing_cycle >= 175 && basic.billing_cycle <= 185) return t("common.semi_annual");
                if (basic.billing_cycle >= 360 && basic.billing_cycle <= 370) return t("common.annual");
                if (basic.billing_cycle >= 720 && basic.billing_cycle <= 750) return t("common.biennial");
                if (basic.billing_cycle == -1) return t("common.once");
                return `${basic.billing_cycle}${t("nodeCard.time_day")}`;
              })();
              return `${basic.currency}${basic.price}/${cycleLabel}`;
            })();

            // 剩余天数行文字（下行）
            const compactExpiryLine = (() => {
              if (!basic.expired_at) {
                // 无截止时间：付费显示【长期】，免费也显示【长期】
                return t("common.long_term", { defaultValue: "长期" });
              }
              const expiredDate = new Date(basic.expired_at);
              const now = new Date();
              const diffDays = Math.ceil((expiredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays <= 0) return t("common.expired", { defaultValue: "已到期" });
              if (diffDays > 36500) return t("common.long_term", { defaultValue: "长期" });
              return t("common.expired_in", { days: diffDays, defaultValue: `余${diffDays}天` });
            })();

            const hasCompactBillingInfo =
              (showPrice && basic.price !== undefined) ||
              (showExpiredAt && !!basic.expired_at);

            // CPU 负载小字：1min / 5min / 15min 平均负载
            const load1 = liveData.load?.load1 ?? 0;
            const load5 = liveData.load?.load5 ?? 0;
            const load15 = liveData.load?.load15 ?? 0;
            const cpuLoadSub = `${load1.toFixed(2)}, ${load5.toFixed(2)}, ${load15.toFixed(2)}`;

            return (
              <div className="space-y-2 text-sm">

                {/* ── 第一行：CPU（左）/ 内存（右）── */}
                <div className="grid grid-cols-2 gap-x-3">
                  {/* CPU 格：进度条下方小字左对齐，显示1/5/15分钟平均负载 */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground text-xs">CPU</span>
                      <DataChange className="font-mono text-xs text-foreground/80" valueKey={Math.round(liveData.cpu.usage)}>
                        {liveData.cpu.usage.toFixed(1)}%
                      </DataChange>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-transform duration-500 origin-left"
                        style={{ transform: `scaleX(${Math.min(liveData.cpu.usage, 100) / 100})` }}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-muted-foreground text-left">
                      {cpuLoadSub}
                    </div>
                  </div>
                  {/* 内存 格：进度条下方小字右对齐 */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground text-xs">{t("nodeCard.ram", { defaultValue: "内存" })}</span>
                      <DataChange className="font-mono text-xs text-foreground/80" valueKey={Math.round(memoryUsagePercent)}>
                        {memoryUsagePercent.toFixed(1)}%
                      </DataChange>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-transform duration-500 origin-left"
                        style={{ transform: `scaleX(${Math.min(memoryUsagePercent, 100) / 100})` }}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-muted-foreground text-right">
                      {`${formatBytes(liveData.ram.used)} / ${formatBytes(basic.mem_total)}`}
                    </div>
                  </div>
                </div>

                {/* ── 第二行：硬盘（左）/ 流量（右）── */}
                <div className="grid grid-cols-2 gap-x-3">
                  {/* 硬盘 格：进度条下方小字左对齐 */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground text-xs">{t("nodeCard.disk", { defaultValue: "硬盘" })}</span>
                      <DataChange className="font-mono text-xs text-foreground/80" valueKey={Math.round(diskUsagePercent)}>
                        {diskUsagePercent.toFixed(1)}%
                      </DataChange>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-transform duration-500 origin-left"
                        style={{ transform: `scaleX(${Math.min(diskUsagePercent, 100) / 100})` }}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-muted-foreground text-left">
                      {`${formatBytes(liveData.disk.used)} / ${formatBytes(basic.disk_total)}`}
                    </div>
                  </div>
                  {/* 流量 格：无限流量也显示，进度条下方小字右对齐 */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground text-xs">{t("nodeCard.totalTraffic", { defaultValue: "流量" })}</span>
                      <span className="font-mono text-xs text-foreground/80">
                        {basic.traffic_limit > 0 ? `${formatTrafficPercentage(compactTrafficPct)}` : "∞"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      {basic.traffic_limit > 0 && (
                        <div
                          className="h-full bg-primary/70 rounded-full transition-transform duration-500 origin-left"
                          style={{ transform: `scaleX(${Math.min(compactTrafficPct, 100) / 100})` }}
                        />
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-muted-foreground text-right">
                      {compactTrafficSub}
                    </div>
                  </div>
                </div>

                <Separator className="opacity-30" />

                {/* ── 第三行：三个等宽独立方块 ── */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* 左方块：实时网速，Upload/Download 图标区分上下行 */}
                  <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5 flex flex-col justify-center gap-0.5">
                    <span className="flex items-center font-mono text-[11px] text-green-600 dark:text-green-400 truncate">
                      <Upload className="h-3 w-3 mr-1 shrink-0" />{uploadSpeed}/s
                    </span>
                    <span className="flex items-center font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate">
                      <Download className="h-3 w-3 mr-1 shrink-0" />{downloadSpeed}/s
                    </span>
                  </div>
                  {/* 中方块：累计流量统计，用 ArrowUp/Down 轮廓箭头区分 */}
                  <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5 flex flex-col justify-center gap-0.5">
                    <span className="flex items-center font-mono text-[11px] text-muted-foreground truncate">
                      <ArrowUp className="h-3 w-3 mr-1 shrink-0" />{totalUpload}
                    </span>
                    <span className="flex items-center font-mono text-[11px] text-muted-foreground truncate">
                      <ArrowDown className="h-3 w-3 mr-1 shrink-0" />{totalDownload}
                    </span>
                  </div>
                  {/* 右方块：价格（上行）/ 剩余天数（下行） */}
                  <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5 flex flex-col justify-center gap-0.5 items-end">
                    {hasCompactBillingInfo ? (
                      <>
                        {showPrice && (
                          <span className="font-mono text-[11px] text-muted-foreground truncate w-full text-right">{compactPriceLine}</span>
                        )}
                        {showExpiredAt && (
                          <span className="font-mono text-[11px] text-muted-foreground truncate w-full text-right">{compactExpiryLine}</span>
                        )}
                      </>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground/40 text-right">--</span>
                    )}
                  </div>
                </div>

                <Separator className="opacity-30" />

                {/* ── 延迟/丢包行，依 cardDesign 切换 ── */}
                {themeConfig.cardDesign === "quality-bars" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <PingHistoryStrip
                      label={t("nodeCard.ping", { defaultValue: "延迟" })}
                      value={pingStats.hasData ? `${Math.round(pingStats.avgLatency)} ms` : "-- ms"}
                      points={pingStats.hasData && pingStats.history.length > 0 ? pingStats.history : PING_HISTORY_PLACEHOLDER_POINTS}
                      metric="latency"
                      isLoaded={pingStats.isLoaded}
                    />
                    <PingHistoryStrip
                      label={t("chart.lossRate", { defaultValue: "丢包" })}
                      value={pingStats.hasData ? `${pingStats.avgLoss.toFixed(1)}%` : "--%"}
                      points={pingStats.hasData && pingStats.history.length > 0 ? pingStats.history : PING_HISTORY_PLACEHOLDER_POINTS}
                      metric="loss"
                      isLoaded={pingStats.isLoaded}
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">{t("nodeCard.pingStats")}</span>
                    {pingStats.hasData ? (
                      <div className="flex gap-3 font-mono text-xs text-muted-foreground">
                        <span>{pingStats.avgLoss.toFixed(1)}% {t("chart.lossRate")}</span>
                        <span>{pingStats.avgVolatility.toFixed(1)} {t("chart.volatility")}</span>
                      </div>
                    ) : !pingStats.isLoaded ? (
                      <div className="flex gap-3 font-mono text-xs text-muted-foreground/70">
                        <span>--% {t("chart.lossRate")}</span>
                        <span>-- {t("chart.volatility")}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/70 italic">{t("nodeCard.noPingData")}</span>
                    )}
                  </div>
                )}

              </div>
            );
          })()
        ) : (
          /* ── Classic / Modern / Minimal / Detailed Layouts ── */
          <>
        {/* Charts Grid - layout affects arrangement */}
        <div className={`grid mb-4 ${
          themeConfig.cardLayout === 'minimal' ? 'grid-cols-3 gap-3' :
          themeConfig.cardLayout === 'detailed' ? 'grid-cols-3 gap-4' :
          themeConfig.cardLayout === 'modern' ? 'grid-cols-3 gap-2' :
          'grid-cols-3 gap-2'
        }`}>
          <AdaptiveChart
            value={liveData.cpu.usage}
            label="CPU"
            subLabel={`${liveData.cpu.usage.toFixed(1)}%`}
            animate
          />
          <AdaptiveChart
            value={memoryUsagePercent}
            label="RAM"
            subLabel={themeConfig.showRamDiskTotal ? `${formatBytes(liveData.ram.used)} / ${formatBytes(basic.mem_total)}` : formatBytes(liveData.ram.used)}
            animate
          />
          <AdaptiveChart
            value={diskUsagePercent}
            label="Disk"
            subLabel={themeConfig.showRamDiskTotal ? `${formatBytes(liveData.disk.used)} / ${formatBytes(basic.disk_total)}` : formatBytes(liveData.disk.used)}
            animate
          />
        </div>

        {/* Network Stats */}
        <div className={`rounded-lg p-3 space-y-2 text-sm ${
          themeConfig.cardLayout === 'modern' ? 'bg-primary/5' :
          themeConfig.cardLayout === 'minimal' ? 'bg-background/50' :
          themeConfig.cardLayout === 'detailed' ? 'bg-muted/40' :
          'bg-muted/30'
        }`}>
          <div className="flex justify-between items-center">
             <span className="text-muted-foreground flex items-center gap-1">
               <Gauge className="h-3 w-3" /> {t("nodeCard.networkSpeed")}
             </span>
             <div className="flex gap-3 font-mono text-xs">
                <span className="flex items-center text-green-600 dark:text-green-400">
                  <ArrowUp className="h-3 w-3 mr-0.5" /> {uploadSpeed}/s
                </span>
                <span className="flex items-center text-blue-600 dark:text-blue-400">
                  <ArrowDown className="h-3 w-3 mr-0.5" /> {downloadSpeed}/s
                </span>
             </div>
          </div>
          
          <Separator className="opacity-30" />
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
               {t("nodeCard.totalTraffic")}
            </span>
             <div className="flex gap-3 font-mono text-xs text-muted-foreground">
                <span className="flex items-center">
                  <ArrowUp className="h-3 w-3 mr-0.5" /> {totalUpload}
                </span>
                <span className="flex items-center">
                  <ArrowDown className="h-3 w-3 mr-0.5" /> {totalDownload}
                </span>
             </div>
          </div>

          <Separator className="opacity-30" />

          {/* Ping Statistics */}
          {themeConfig.cardDesign === "quality-bars" ? (
            <PingQualityBars pingStats={pingStats} t={t} />
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("nodeCard.pingStats")}</span>
              {pingStats.hasData ? (
                <div className="flex gap-3 font-mono text-xs text-muted-foreground">
                  <span>{pingStats.avgLoss.toFixed(1)}% {t("chart.lossRate")}</span>
                  <span>{pingStats.avgVolatility.toFixed(1)} {t("chart.volatility")}</span>
                </div>
              ) : !pingStats.isLoaded ? (
                <div className="flex gap-3 font-mono text-xs text-muted-foreground/70">
                  <span>--% {t("chart.lossRate")}</span>
                  <span>-- {t("chart.volatility")}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/70 italic">{t("nodeCard.noPingData")}</span>
              )}
            </div>
          )}

          {/* Traffic Limit Progress (if exists) */}
          {basic.traffic_limit > 0 && (
            <div className="mt-2 pt-1">
               <div className="flex justify-between text-[10px] mb-1 text-muted-foreground">
                 <span>{trafficLimitType.toUpperCase()} Limit</span>
                 <span className="font-mono">
                   {formatBytes(trafficUsed)} / {formatBytes(basic.traffic_limit)}
                 </span>
               </div>
               <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary/70 rounded-full transition-transform duration-500 origin-left"
                   style={{ transform: `scaleX(${Math.min(trafficPercentage, 100) / 100})` }}
                 />
               </div>
               <div className="mt-1 flex justify-end text-[10px] font-mono text-muted-foreground">
                 <span>{formatTrafficPercentage(trafficPercentage)}</span>
               </div>
            </div>
          )}
        </div>
          </>
        )}
      </CardContent>

      {/* Footer: Price & Extra Info */}
      {themeConfig.cardLayout === 'compact' ? (
        /* compact footer: 只显示自定义tags，不显示 V4/V6、价格、剩余天数 */
        basic.tags && basic.tags.trim() !== '' && (
          <CardFooter className={footerStyles.compact}>
            <PriceTags
              hidden={false}
              price={0}
              tags={basic.tags}
              ip4={undefined}
              ip6={undefined}
            />
          </CardFooter>
        )
      ) : (
        ((showPrice && basic.price) || (showExpiredAt && basic.price) || basic.ipv4 || basic.ipv6 || basic.tags) && (
          <CardFooter className={footerStyles[themeConfig.cardLayout] || footerStyles.classic}>
             <PriceTags
                hidden={false}
                price={basic.price}
                billing_cycle={basic.billing_cycle}
                expired_at={basic.expired_at}
                currency={basic.currency}
                tags={basic.tags}
                ip4={basic.ipv4}
                ip6={basic.ipv6}
                showPrice={showPrice}
                showExpiredAt={showExpiredAt}
             />
          </CardFooter>
        )
      )}
    </Card>
  );
};

export default Node;
