import type { TFunction } from "i18next";
import type { PingStats, PingHistoryPoint } from "@/hooks/usePingStats";

type QualityTone = "good" | "warn" | "bad";

export const PING_HISTORY_PLACEHOLDER_POINTS: PingHistoryPoint[] = Array.from(
  { length: 28 },
  (_, index) => ({
    time: `placeholder-${index}`,
    latency: null,
    loss: null,
  })
);

const qualityToneStyles: {
  [tone in QualityTone]: { bar: string };
} = {
  good: {
    bar: "bg-emerald-500",
  },
  warn: {
    bar: "bg-amber-500",
  },
  bad: {
    bar: "bg-rose-500",
  },
};

function getLatencyTone(latency: number): QualityTone {
  if (latency <= 80) return "good";
  if (latency <= 180) return "warn";
  return "bad";
}

function getLossTone(loss: number): QualityTone {
  if (loss <= 1) return "good";
  if (loss <= 5) return "warn";
  return "bad";
}

function formatHistoryTime(time: string) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PingHistoryStrip({
  label,
  value,
  points,
  metric,
  isLoaded,
}: {
  label: string;
  value: string;
  points: PingHistoryPoint[];
  metric: "latency" | "loss";
  isLoaded: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md bg-background/45 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] leading-none">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="shrink-0 font-mono font-semibold text-foreground/80">{value}</span>
      </div>
      <div className="flex h-5 gap-0.5">
        {points.filter(p => p.latency !== null || !isLoaded).map((point, index) => {
          const metricValue = point[metric];
          const tone =
            metricValue === null
              ? null
              : metric === "latency"
                ? getLatencyTone(metricValue)
                : getLossTone(metricValue);
          const blockClassName = tone
            ? qualityToneStyles[tone].bar
            : "bg-muted-foreground/18";
          const titleValue =
            metricValue === null
              ? "No data"
              : metric === "latency"
                ? `${Math.round(metricValue)} ms`
                : `${metricValue.toFixed(1)}%`;

          return (
            <span
              key={`${point.time}-${index}`}
              className={`flex-1 min-w-[2px] rounded-[2px] ${blockClassName}`}
              title={`${formatHistoryTime(point.time)} ${titleValue}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function PingQualityBars({ pingStats, t }: { pingStats: PingStats; t: TFunction }) {
  const historyPoints = pingStats.hasData && pingStats.history.length > 0
    ? pingStats.history
    : PING_HISTORY_PLACEHOLDER_POINTS;
  const statusText = pingStats.hasData
    ? `${pingStats.avgVolatility.toFixed(1)} ${t("chart.volatility")}`
    : pingStats.isLoaded
      ? t("nodeCard.noPingData")
      : "--";
  const latencyValue = pingStats.hasData
    ? `${Math.round(pingStats.avgLatency)} ms`
    : "-- ms";
  const lossValue = pingStats.hasData
    ? `${pingStats.avgLoss.toFixed(1)}%`
    : "--%";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{t("nodeCard.pingStats")}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {statusText}
        </span>
      </div>
      {(!pingStats.isLoaded || pingStats.hasData) && (
        <div className="grid grid-cols-2 gap-2">
          <PingHistoryStrip
            label={t("nodeCard.latency", { defaultValue: "Latency" })}
            value={latencyValue}
            points={historyPoints}
            metric="latency"
            isLoaded={pingStats.isLoaded}
          />
          <PingHistoryStrip
            label={t("chart.lossRate", { defaultValue: "Loss" })}
            value={lossValue}
            points={historyPoints}
            metric="loss"
            isLoaded={pingStats.isLoaded}
          />
        </div>
      )}
    </div>
  );
}
