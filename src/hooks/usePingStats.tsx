import { useEffect, useState } from 'react';
import { useRPC2Call } from '@/contexts/RPC2Context';
import { fetchPingRecords, PING_RECORDS_AUTO_REFRESH_MS, type PingRecord } from '@/lib/pingRecords';

export interface PingHistoryPoint {
  time: string;
  latency: number | null;
  loss: number | null;
}

export interface PingStats {
  avgLatency: number;
  avgLoss: number;
  avgVolatility: number;
  history: PingHistoryPoint[];
  hasData: boolean;
  isLoaded: boolean;
  isLoading: boolean;
}

const HISTORY_BUCKET_COUNT = 28;

function createEmptyStats({
  isLoaded = false,
  isLoading = false,
}: { isLoaded?: boolean; isLoading?: boolean } = {}): PingStats {
  return {
    avgLatency: 0,
    avgLoss: 0,
    avgVolatility: 0,
    history: [],
    hasData: false,
    isLoaded,
    isLoading,
  };
}

function buildPingHistory(records: PingRecord[]): PingHistoryPoint[] {
  const sortedRecords = records
    .map((record) => ({
      ...record,
      timestamp: new Date(record.time).getTime(),
    }))
    .filter((record) => Number.isFinite(record.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp);

  if (sortedRecords.length === 0) {
    return [];
  }

  const firstTime = sortedRecords[0].timestamp;
  const lastTime = sortedRecords[sortedRecords.length - 1].timestamp;
  const bucketCount = Math.min(HISTORY_BUCKET_COUNT, sortedRecords.length);
  const bucketSize = Math.max(1, (lastTime - firstTime) / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const startTime = firstTime + bucketSize * index;
    const endTime = index === bucketCount - 1 ? lastTime + 1 : startTime + bucketSize;
    const bucketRecords = sortedRecords.filter(
      (record) => record.timestamp >= startTime && record.timestamp < endTime,
    );
    const validLatencyRecords = bucketRecords.filter((record) => record.value >= 0);
    const lostRecords = bucketRecords.length - validLatencyRecords.length;
    const latency =
      validLatencyRecords.length > 0
        ? validLatencyRecords.reduce((sum, record) => sum + record.value, 0) / validLatencyRecords.length
        : null;
    const loss = bucketRecords.length > 0 ? (lostRecords / bucketRecords.length) * 100 : null;

    return {
      time: new Date(startTime).toISOString(),
      latency,
      loss,
    };
  });
}

export function usePingStats(uuid: string, hours: number = 24, enabled: boolean = true): PingStats {
  const { call } = useRPC2Call();
  const [stats, setStats] = useState<PingStats>(() => createEmptyStats());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!uuid.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset async stats when its source key is empty
      setStats(createEmptyStats({ isLoaded: true }));
      return;
    }

    let active = true;

    let hasReceivedResponse = false;

    const fetchStats = async (forceRefresh = false) => {
      try {
        if (!hasReceivedResponse) {
          setStats((previous) => ({ ...previous, isLoading: true }));
        }

        const result = await fetchPingRecords(call, uuid, hours, { forceRefresh });
        if (!active) return;

        hasReceivedResponse = true;
        const records = result?.records || [];
        const tasks = result?.tasks || [];

        if (records.length === 0 || tasks.length === 0) {
          setStats(createEmptyStats({ isLoaded: true }));
          return;
        }

        const history = buildPingHistory(records);
        const latencyValues = tasks
          .map((task) => task.avg ?? task.latest ?? task.value ?? task.p50)
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
        const avgLatency = latencyValues.length > 0
          ? latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length
          : 0;

        // Calculate average loss from tasks
        const totalLoss = tasks.reduce((sum, task) => sum + (task.loss || 0), 0);
        const avgLoss = tasks.length > 0 ? totalLoss / tasks.length : 0;

        // Calculate volatility (p99/p50 ratio average)
        const volatilityValues = tasks
          .filter(task => task.p99_p50_ratio !== undefined && task.p99_p50_ratio > 0)
          .map(task => task.p99_p50_ratio!);

        const avgVolatility = volatilityValues.length > 0
          ? volatilityValues.reduce((sum, val) => sum + val, 0) / volatilityValues.length
          : 0;

        setStats({
          avgLatency,
          avgLoss,
          avgVolatility,
          history,
          hasData: true,
          isLoaded: true,
          isLoading: false,
        });
      } catch {
        if (!active) return;
        if (!hasReceivedResponse) {
          setStats(createEmptyStats({ isLoaded: true }));
        }
      }
    };

    void fetchStats();
    const refreshTimer = window.setInterval(() => {
      void fetchStats(true);
    }, PING_RECORDS_AUTO_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [uuid, hours, enabled, call]);

  return stats;
}
