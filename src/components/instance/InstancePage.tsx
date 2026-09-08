"use client";

import { fetchJson } from "@/lib/request";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useTranslation } from "react-i18next";
import type { Record } from "@/types/LiveData";
import Flag from "@/components/Flag";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { useNodeList } from "@/contexts/NodeListContext";
import { liveDataToRecords } from "@/utils/RecordHelper";
import LoadChart from "./LoadChart";
import PingChart from "./PingChart";
import { Card, CardHeader } from "@/components/ui/card";

// Import DetailsGrid as client-only to prevent hydration mismatch with i18n
const DetailsGrid = dynamic(
  () => import("@/components/DetailsGrid").then((mod) => ({ default: mod.DetailsGrid })),
  { ssr: false }
);

interface InstancePageProps {
  uuid: string;
}

export default function InstancePage({ uuid }: InstancePageProps) {
  const { t } = useTranslation();
  const { onRefresh } = useLiveData();
  const [recent, setRecent] = useState<Record[]>([]);
  const { nodeList } = useNodeList();
  const length = 30 * 5;
  const [chartView, setChartView] = useState<"load" | "ping">("load");
  
  // Find the node
  const node = nodeList?.find((n) => n.uuid === uuid);

  // Initial data loading
  useEffect(() => {
    if (!uuid) return;
    
    const controller = new AbortController();
    setRecent([]);
    fetchJson<{ data: Record[] }>(`/api/recent/${encodeURIComponent(uuid)}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setRecent((live) => {
          const merged = new Map([...data.data, ...live].map((record) => [record.updated_at, record]));
          return [...merged.values()]
            .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
            .slice(-length);
        });
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error("Failed to fetch recent data:", err);
      });
    return () => controller.abort();
  }, [uuid, length]);

  // Dynamic data updates
  useEffect(() => {
    const unsubscribe = onRefresh((resp) => {
      if (!uuid) return;
      const data = resp.data.data[uuid];
      if (!data) return;

      setRecent((prev) => {
        const newRecord: Record = data;
        // Check if record with same timestamp already exists
        const exists = prev.some(
          (item) => item.updated_at === newRecord.updated_at
        );
        if (exists) {
          return prev;
        }

        // Append new record and maintain FIFO with length limit
        const updated = [...prev, newRecord].slice(-length);
        return updated;
      });
    });

    return unsubscribe;
  }, [onRefresh, uuid, length]);

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full max-w-[1400px] mx-auto">
      {/* Header Section */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-4 py-6">
          <div className="flex items-center gap-2">
             <Flag flag={node?.region ?? ""} />
             <h1 className="text-2xl font-bold tracking-tight">
               {node?.name ?? uuid}
             </h1>
          </div>
          <div className="bg-muted px-2 py-1 rounded-lg text-xs font-mono text-muted-foreground">
             {node?.uuid}
          </div>
        </CardHeader>
      </Card>

      {/* Details Grid */}
      <DetailsGrid box align="center" uuid={uuid ?? ""} />

      {/* Charts Section */}
      <div className="w-full space-y-6">
        <div className="w-full overflow-x-auto px-2">
          <div className="w-max mx-auto">
            <SegmentedControl
              value={chartView}
              onValueChange={(value) => setChartView(value as "load" | "ping")}
            >
              <SegmentedControlItem value="load" className="capitalize">
                {t("nodeCard.load")}
              </SegmentedControlItem>
              <SegmentedControlItem value="ping" className="capitalize">
                {t("nodeCard.ping")}
              </SegmentedControlItem>
            </SegmentedControl>
          </div>
        </div>

        {chartView === "load" ? (
          <LoadChart uuid={uuid ?? ""} data={liveDataToRecords(uuid ?? "", recent)} />
        ) : (
          <PingChart uuid={uuid ?? ""} />
        )}
      </div>
    </div>
  );
}
