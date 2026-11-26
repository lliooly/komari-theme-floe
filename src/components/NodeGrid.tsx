import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData } from "@/types/LiveData";
import { useTheme } from "@/contexts/ThemeContext";
import Node from "./Node";

type NodeGridProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
  revealDelay?: number;
  revealReady?: boolean;
};

type QueuedPingStatsRow = {
  rowIndex: number;
  uuids: string[];
};

const NODE_GRID_MIN_COLUMN_WIDTH = 320;
const NODE_GRID_GAP = 24;
const PING_STATS_ROW_LOAD_DELAY_MS = 400;
const PING_STATS_ROW_ROOT_MARGIN = "360px 0px";

export const NodeGrid = ({
  nodes,
  liveData,
  revealDelay = 0,
  revealReady = true,
}: NodeGridProps) => {
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = React.useState(1);
  const prefersReducedMotion = useReducedMotion();
  const { themeConfig } = useTheme();
  const isCompact = themeConfig.cardLayout === 'compact';
  const NODE_GRID_MIN_COL = isCompact ? 320 : NODE_GRID_MIN_COLUMN_WIDTH;
  const [pingStatsActiveNodes, setPingStatsActiveNodes] = React.useState<Set<string>>(
    () => new Set()
  );
  const pingStatsActiveNodesRef = React.useRef(pingStatsActiveNodes);
  const rowUuidsByIndexRef = React.useRef<string[][]>([]);
  const activeRowItemsRef = React.useRef<Map<number, Set<string>>>(new Map());
  const queuedRowsRef = React.useRef<QueuedPingStatsRow[]>([]);
  const queuedRowKeysRef = React.useRef<Set<string>>(new Set());
  const rowLoadTimerRef = React.useRef<number | null>(null);
  const processNextRowRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    pingStatsActiveNodesRef.current = pingStatsActiveNodes;
  }, [pingStatsActiveNodes]);

  React.useEffect(() => {
    processNextRowRef.current = () => {
      if (rowLoadTimerRef.current !== null) return;

      const queuedRow = queuedRowsRef.current.shift();
      if (!queuedRow) return;

      const rowKey = String(queuedRow.rowIndex);
      queuedRowKeysRef.current.delete(rowKey);
      const rowIsActive = (activeRowItemsRef.current.get(queuedRow.rowIndex)?.size || 0) > 0;
      const pendingUuids = rowIsActive
        ? queuedRow.uuids.filter((uuid) => !pingStatsActiveNodesRef.current.has(uuid))
        : [];

      if (pendingUuids.length > 0) {
        setPingStatsActiveNodes((previous) => {
          const next = new Set(previous);
          pendingUuids.forEach((uuid) => next.add(uuid));
          pingStatsActiveNodesRef.current = next;
          return next;
        });
      }

      rowLoadTimerRef.current = window.setTimeout(() => {
        rowLoadTimerRef.current = null;
        processNextRowRef.current();
      }, PING_STATS_ROW_LOAD_DELAY_MS);
    };

    return () => {
      if (rowLoadTimerRef.current !== null) {
        window.clearTimeout(rowLoadTimerRef.current);
        rowLoadTimerRef.current = null;
      }
    };
  }, []);

  const deactivatePingStatsRow = React.useCallback((rowIndex: number) => {
    const rowUuids = rowUuidsByIndexRef.current[rowIndex] || [];
    const rowKey = String(rowIndex);
    queuedRowKeysRef.current.delete(rowKey);
    queuedRowsRef.current = queuedRowsRef.current.filter(
      (queuedRow) => queuedRow.rowIndex !== rowIndex
    );

    if (rowUuids.length === 0) return;

    setPingStatsActiveNodes((previous) => {
      const next = new Set(previous);
      let changed = false;
      rowUuids.forEach((uuid) => {
        if (next.delete(uuid)) {
          changed = true;
        }
      });

      if (!changed) return previous;
      pingStatsActiveNodesRef.current = next;
      return next;
    });
  }, []);

  const enqueuePingStatsRow = React.useCallback((rowIndex: number, rowUuids: string[]) => {
    if (rowUuids.length === 0) return;
    if ((activeRowItemsRef.current.get(rowIndex)?.size || 0) === 0) return;

    const pendingUuids = rowUuids.filter(
      (uuid) => !pingStatsActiveNodesRef.current.has(uuid)
    );
    if (pendingUuids.length === 0) return;

    const rowKey = String(rowIndex);
    if (queuedRowKeysRef.current.has(rowKey)) return;

    queuedRowKeysRef.current.add(rowKey);
    queuedRowsRef.current.push({ rowIndex, uuids: rowUuids });
    processNextRowRef.current();
  }, []);

  const markPingStatsRowItem = React.useCallback((
    rowIndex: number,
    uuid: string,
    isActive: boolean
  ) => {
    const activeRows = activeRowItemsRef.current;
    const rowItems = activeRows.get(rowIndex) || new Set<string>();

    if (isActive) {
      rowItems.add(uuid);
      activeRows.set(rowIndex, rowItems);
      enqueuePingStatsRow(rowIndex, rowUuidsByIndexRef.current[rowIndex] || []);
      return;
    }

    rowItems.delete(uuid);
    if (rowItems.size > 0) {
      activeRows.set(rowIndex, rowItems);
      return;
    }

    activeRows.delete(rowIndex);
    deactivatePingStatsRow(rowIndex);
  }, [deactivatePingStatsRow, enqueuePingStatsRow]);

  React.useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateColumns = () => {
      const computedStyle = window.getComputedStyle(grid);
      const columnGap = Number.parseFloat(computedStyle.columnGap) || NODE_GRID_GAP;
      const nextColumns = Math.max(
        1,
        Math.floor((grid.clientWidth + columnGap) / (NODE_GRID_MIN_COL + columnGap))
      );
      setColumns((previous) => (previous === nextColumns ? previous : nextColumns));
    };

    updateColumns();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateColumns);
      return () => window.removeEventListener("resize", updateColumns);
    }

    const resizeObserver = new ResizeObserver(updateColumns);
    resizeObserver.observe(grid);

    return () => resizeObserver.disconnect();
  }, [NODE_GRID_MIN_COL]);

  const onlineNodes = React.useMemo(() => liveData?.online ?? [], [liveData?.online]);

  const sortedNodes = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const aOnline = onlineNodes.includes(a.uuid);
      const bOnline = onlineNodes.includes(b.uuid);

      if (aOnline !== bOnline) {
        return aOnline ? -1 : 1;
      }

      return a.weight - b.weight;
    });
  }, [nodes, onlineNodes]);

  const rowUuidsByIndex = React.useMemo(() => {
    const rows: string[][] = [];
    sortedNodes.forEach((node, index) => {
      const rowIndex = Math.floor(index / columns);
      if (!rows[rowIndex]) rows[rowIndex] = [];
      rows[rowIndex].push(node.uuid);
    });
    return rows;
  }, [sortedNodes, columns]);

  React.useEffect(() => {
    rowUuidsByIndexRef.current = rowUuidsByIndex;
  }, [rowUuidsByIndex]);

  React.useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const activeRows = activeRowItemsRef.current;
    const gridItems = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-node-grid-item='true']")
    );

    if (typeof IntersectionObserver === "undefined") {
      const firstRowUuids = rowUuidsByIndex[0] || [];
      activeRows.set(0, new Set(firstRowUuids));
      enqueuePingStatsRow(0, firstRowUuids);

      return () => {
        activeRows.delete(0);
        deactivatePingStatsRow(0);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = entry.target as HTMLElement;
          const rowIndex = Number(item.dataset.rowIndex);
          const uuid = item.dataset.nodeUuid;
          if (!uuid) return;
          if (!Number.isFinite(rowIndex)) return;
          markPingStatsRowItem(rowIndex, uuid, entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: PING_STATS_ROW_ROOT_MARGIN,
        threshold: 0.01,
      }
    );

    gridItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      activeRows.forEach((_rowItems, rowIndex) => {
        deactivatePingStatsRow(rowIndex);
      });
      activeRows.clear();
    };
  }, [deactivatePingStatsRow, enqueuePingStatsRow, markPingStatsRowItem, rowUuidsByIndex]);

  return (
    <div
      ref={gridRef}
      className="grid gap-6 py-4 box-border w-full"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${NODE_GRID_MIN_COL}px, 1fr))`,
      }}
    >
      <AnimatePresence initial={prefersReducedMotion !== true}>
        {sortedNodes.map((node, index) => {
          const isOnline = onlineNodes.includes(node.uuid);
          const nodeData =
            liveData && liveData.data ? liveData.data[node.uuid] : undefined;
          const rowIndex = Math.floor(index / columns);

          return (
            <motion.div
              key={node.uuid}
              data-node-grid-item="true"
              data-row-index={rowIndex}
              data-node-uuid={node.uuid}
              className="flex h-full min-w-0"
              layout={prefersReducedMotion ? false : "position"}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{
                duration: 0.22,
                ease: "easeOut",
                delay: prefersReducedMotion ? 0 : Math.min(index, 5) * 0.04,
              }}
            >
              <Node
                basic={node}
                live={nodeData}
                online={isOnline}
                pingStatsEnabled={pingStatsActiveNodes.has(node.uuid)}
                revealDelay={revealDelay + Math.min(index, 5) * 55}
                revealReady={revealReady}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
