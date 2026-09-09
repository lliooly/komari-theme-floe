"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  CircleX,
  Clock3,
  ExternalLink,
  RefreshCw,
  Server,
  Wrench,
} from "@/components/Icones/Reicon";
import type { ReiconIcon } from "@/components/Icones/Reicon";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { ActionFeedbackIcon } from "@/components/ui/action-feedback-icon";
import { useUptimeKumaStatus } from "@/hooks/useUptimeKumaStatus";
import { useActionFeedback } from "@/hooks/useActionFeedback";
import type {
  UptimeKumaHeartbeat,
  UptimeKumaService,
  UptimeKumaServiceStatus,
  UptimeKumaSettings,
} from "@/lib/uptimeKuma";
import { buildUptimeKumaUrls } from "@/lib/uptimeKuma";
import { getRevealProps } from "@/lib/reveal";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UptimeKumaStatusProps {
  settings: Partial<UptimeKumaSettings> | undefined;
  revealDelay?: number;
  revealReady?: boolean;
}

type StatusMeta = {
  color: BadgeColor;
  icon: ReiconIcon;
  translationKey: string;
};

const STATUS_META: Record<UptimeKumaServiceStatus, StatusMeta> = {
  up: {
    color: "green",
    icon: CheckCircle2,
    translationKey: "uptimeKuma.status.up",
  },
  down: {
    color: "red",
    icon: CircleX,
    translationKey: "uptimeKuma.status.down",
  },
  pending: {
    color: "yellow",
    icon: Clock3,
    translationKey: "uptimeKuma.status.pending",
  },
  maintenance: {
    color: "amber",
    icon: Wrench,
    translationKey: "uptimeKuma.status.maintenance",
  },
  unknown: {
    color: "gray",
    icon: CircleHelp,
    translationKey: "uptimeKuma.status.unknown",
  },
};

function formatPing(ping: number | null, unavailableLabel: string): string {
  return ping === null ? unavailableLabel : `${Math.round(ping)} ms`;
}

function formatUptime(uptime: number | null, unavailableLabel: string): string {
  return uptime === null ? unavailableLabel : `${uptime.toFixed(2)}%`;
}

function formatCompactDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

const MAX_HEARTBEAT_SEGMENTS = 60;

function heartbeatSegmentClass(status: UptimeKumaServiceStatus): string {
  switch (status) {
    case "up":
      return "bg-emerald-500/80 dark:bg-emerald-400/90";
    case "down":
      return "bg-red-500/85 dark:bg-red-400/90";
    case "pending":
      return "bg-amber-500/85 dark:bg-amber-400/90";
    case "maintenance":
      return "bg-orange-500/85 dark:bg-orange-400/90";
    default:
      return "bg-muted-foreground/45";
  }
}

function HeartbeatBar({
  service,
  unavailableLabel,
  t,
}: {
  service: UptimeKumaService;
  unavailableLabel: string;
  t: TFunction;
}) {
  const [now, setNow] = useState(() => Date.now());
  const visibleHeartbeats = service.heartbeats.slice(-MAX_HEARTBEAT_SEGMENTS);
  const missingHeartbeatCount = Math.max(
    0,
    MAX_HEARTBEAT_SEGMENTS - visibleHeartbeats.length
  );
  const oldestTimestamp = service.heartbeats.find(
    (heartbeat) => heartbeat.timestamp !== null
  )?.timestamp;
  const historyRange =
    oldestTimestamp === undefined || oldestTimestamp === null
      ? unavailableLabel
      : formatCompactDuration(Math.max(0, now - oldestTimestamp));
  const lastHeartbeatAge =
    service.lastHeartbeatAt === null
      ? unavailableLabel
      : formatCompactDuration(Math.max(0, now - service.lastHeartbeatAt));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="w-full min-w-0 flex-1 rounded-md border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-2">
      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>{historyRange}</span>
        <span>
          {t("uptimeKuma.lastHeartbeat", {
            defaultValue: "{{value}} ago",
            value: lastHeartbeatAge,
          })}
        </span>
      </div>
      {visibleHeartbeats.length > 0 ? (
        <div
          className="mt-1.5 flex h-7 min-w-0 items-stretch gap-0.5 overflow-hidden"
          role="img"
          aria-label={t("uptimeKuma.heartbeatHistory", {
            defaultValue: "Heartbeat history: {{count}} checks",
            count: service.heartbeats.length,
          })}
        >
          {Array.from({ length: missingHeartbeatCount }, (_, index) => (
            <span
              key={`missing-${index}`}
              aria-hidden="true"
              className="block h-full min-w-[3px] flex-1 rounded-full bg-muted-foreground/35 dark:bg-muted-foreground/45"
            />
          ))}
          {visibleHeartbeats.map((heartbeat, index) => (
            <span
              key={`${heartbeat.timestamp ?? "unknown"}-${index}`}
              className={`block h-full min-w-[3px] flex-1 rounded-full transition-colors ${heartbeatSegmentClass(heartbeat.status)}`}
              title={formatHeartbeatTitle(heartbeat, t)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-1.5 flex h-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/25 text-[11px] text-muted-foreground">
          {t("uptimeKuma.heartbeatEmpty", {
            defaultValue: "No heartbeat history",
          })}
        </div>
      )}
    </div>
  );
}

function formatHeartbeatTitle(
  heartbeat: UptimeKumaHeartbeat,
  t: TFunction
): string {
  const statusLabel = t(`uptimeKuma.status.${heartbeat.status}`, {
    defaultValue: heartbeat.status,
  });
  const timestamp = heartbeat.timestamp
    ? new Date(heartbeat.timestamp).toLocaleString()
    : t("uptimeKuma.unknownTime", { defaultValue: "Unknown time" });
  const ping = heartbeat.ping === null ? "" : ` · ${Math.round(heartbeat.ping)} ms`;
  return `${statusLabel} · ${timestamp}${ping}`;
}

function ServiceStatusBadge({
  status,
  t,
}: {
  status: UptimeKumaServiceStatus;
  t: TFunction;
}) {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const isOperational = status === "up";

  return (
    <Badge
      color={isOperational ? undefined : meta.color}
      variant={isOperational ? "default" : "secondary"}
      className={`shrink-0 gap-1 whitespace-nowrap${
        isOperational ? " bg-green-600 hover:bg-green-700" : ""
      }`}
    >
      <StatusIcon className="h-3 w-3" aria-hidden="true" />
      {t(meta.translationKey)}
    </Badge>
  );
}

function ServiceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="truncate font-mono text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  unavailableLabel,
  pingLabel,
  uptimeLabel,
  t,
}: {
  service: UptimeKumaService;
  unavailableLabel: string;
  pingLabel: string;
  uptimeLabel: string;
  t: TFunction;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-background/35 p-3 transition-colors hover:bg-background/55">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" title={service.name}>
            {service.name}
          </div>
        </div>
        <ServiceStatusBadge status={service.status} t={t} />
      </div>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <HeartbeatBar
          service={service}
          unavailableLabel={unavailableLabel}
          t={t}
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:shrink-0 sm:justify-end">
          <ServiceMetric
            label={pingLabel}
            value={formatPing(service.ping, unavailableLabel)}
          />
          <ServiceMetric
            label={uptimeLabel}
            value={formatUptime(service.uptime24h, unavailableLabel)}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingCard({
  title,
  revealDelay = 0,
  revealReady = true,
}: {
  title: ReactNode;
  revealDelay?: number;
  revealReady?: boolean;
}) {
  return (
    <Card {...getRevealProps(revealDelay, revealReady)} data-card-blur-surface="true" aria-busy="true">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      </CardContent>
    </Card>
  );
}

export default function UptimeKumaStatus({
  settings,
  revealDelay = 0,
  revealReady = true,
}: UptimeKumaStatusProps) {
  const [t] = useTranslation();
  const enabled = settings?.enabled === true;
  const { data, isLoading, error, lastUpdatedAt, refresh } =
    useUptimeKumaStatus(settings);
  const {
    status: refreshStatus,
    run: runRefresh,
  } = useActionFeedback();
  const handleManualRefresh = () => runRefresh(() => refresh("manual"));
  const statusPageUrl =
    data?.statusPageUrl ?? buildUptimeKumaUrls(settings ?? {})?.statusPageUrl;

  if (!enabled) {
    return null;
  }

  if (isLoading && !data) {
    return (
      <LoadingCard
        title={t("uptimeKuma.title", { defaultValue: "Service status" })}
        revealDelay={revealDelay}
        revealReady={revealReady}
      />
    );
  }

  if (!data) {
    return (
      <Card {...getRevealProps(revealDelay, revealReady)} data-card-blur-surface="true" role="status">
        <CardHeader className="flex items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CircleAlert className="h-4 w-4 text-amber-500" aria-hidden="true" />
            {t("uptimeKuma.title", { defaultValue: "Service status" })}
          </CardTitle>
          {statusPageUrl && (
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
            >
              <a
                href={statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("uptimeKuma.open", {
                  defaultValue: "Open status page",
                })}
                title={t("uptimeKuma.open", {
                  defaultValue: "Open status page",
                })}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {t("uptimeKuma.unavailable", {
              defaultValue: "Uptime Kuma service status is temporarily unavailable.",
            })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleManualRefresh()}
            disabled={refreshStatus === "loading"}
            aria-busy={refreshStatus === "loading"}
          >
            <ActionFeedbackIcon status={refreshStatus} icon={RefreshCw} />
            {t("uptimeKuma.retry", { defaultValue: "Retry" })}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const overallLabel =
    data.overallStatus === "up"
      ? t("uptimeKuma.overall.up", { defaultValue: "All operational" })
      : data.overallStatus === "empty"
        ? t("uptimeKuma.overall.empty", { defaultValue: "No services" })
        : t("uptimeKuma.overall.degraded", { defaultValue: "Some services need attention" });
  const unavailableLabel = t("uptimeKuma.unavailableValue", {
    defaultValue: "—",
  });
  const checkedAt = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : unavailableLabel;

  return (
    <Card
      {...getRevealProps(revealDelay, revealReady)}
      data-card-blur-surface="true"
      aria-busy={isLoading || refreshStatus === "loading"}
    >
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("uptimeKuma.title", { defaultValue: "Service status" })}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("uptimeKuma.summary", {
              defaultValue: "{{up}} / {{total}} services operational",
              up: data.upCount,
              total: data.serviceCount,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge
            color={data.overallStatus === "up" ? undefined : data.overallStatus === "empty" ? "gray" : "amber"}
            variant={data.overallStatus === "up" ? "default" : "secondary"}
            className={data.overallStatus === "up" ? "bg-green-600 hover:bg-green-700" : undefined}
          >
            {overallLabel}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("uptimeKuma.refresh", { defaultValue: "Refresh service status" })}
            title={t("uptimeKuma.refresh", { defaultValue: "Refresh service status" })}
            onClick={() => void handleManualRefresh()}
            disabled={refreshStatus === "loading"}
            aria-busy={refreshStatus === "loading"}
          >
            <ActionFeedbackIcon status={refreshStatus} icon={RefreshCw} />
          </Button>
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
          >
            <a
              href={data.statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("uptimeKuma.open", { defaultValue: "Open status page" })}
              title={t("uptimeKuma.open", { defaultValue: "Open status page" })}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t("uptimeKuma.checkedAt", {
              defaultValue: "Last checked: {{value}}",
              value: checkedAt,
            })}
          </span>
          {error && (
            <span className="text-amber-600 dark:text-amber-400">
              {t("uptimeKuma.stale", {
                defaultValue: "Refresh failed; showing the last successful result.",
              })}
            </span>
          )}
        </div>

        {data.groups.length > 0 ? (
          data.groups.map((group) => (
            <section key={group.id} className="space-y-2" aria-labelledby={`kuma-group-${group.id}`}>
              <h3
                id={`kuma-group-${group.id}`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {group.name}
              </h3>
              <div className="grid gap-2 xl:grid-cols-2">
                {group.services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    unavailableLabel={unavailableLabel}
                    pingLabel={t("uptimeKuma.ping", { defaultValue: "Latency" })}
                    uptimeLabel={t("uptimeKuma.uptime24h", { defaultValue: "Uptime 24h" })}
                    t={t}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("uptimeKuma.empty", { defaultValue: "No public services are configured." })}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
