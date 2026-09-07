import React, { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "@/components/ui/badge";
import { Flex } from "@/components/ui/flex";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ArrowUpDown, ChevronRight, ChevronUp, ChevronDown } from "@/components/Icones/Reicon";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData, Record } from "../types/LiveData";
import {
  formatTrafficPercentage,
  formatUptime,
  getTrafficPercentage,
  getTrafficUsed,
} from "./Node";
import { formatBytes } from "@/utils/unitHelper";
import AdaptiveChart from "./AdaptiveChart";
import Flag from "./Flag";
import PriceTags from "./PriceTags";
import Tips from "./ui/tips";
import { DetailsGrid } from "./DetailsGrid";
import MiniPingChart from "./MiniPingChart";
import SpaLink from "./SpaLink";
import { getOSImage } from "@/utils";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, useReducedMotion } from "framer-motion";
import { getRevealProps } from "@/lib/reveal";

interface NodeTableProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
  revealDelay?: number;
  revealReady?: boolean;
}

type SortField = 'name' | 'os' | 'status' | 'cpu' | 'ram' | 'disk' | 'price' | 'networkUp' | 'networkDown' | 'totalUp' | 'totalDown';
type SortOrder = 'asc' | 'desc' | 'default';

interface SortState {
  field: SortField | null;
  order: SortOrder;
}

const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  liveData,
  revealDelay = 0,
  revealReady = true,
}) => {
  const [t] = useTranslation();
  const { guestDisplay, themeConfig } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortState, setSortState] = useState<SortState>({ field: null, order: 'default' });
  const [animateReorder, setAnimateReorder] = useState(false);
  const sortAnimationTimerRef = useRef<number | null>(null);
  const showPrice = guestDisplay.showPrice;
  const showExpiredAt = guestDisplay.showExpiredAt;

  useEffect(() => {
    return () => {
      if (sortAnimationTimerRef.current !== null) {
        window.clearTimeout(sortAnimationTimerRef.current);
      }
    };
  }, []);

  const toggleRowExpansion = (uuid: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uuid)) {
        newSet.delete(uuid);
      } else {
        newSet.add(uuid);
      }
      return newSet;
    });
  };

  const handleSort = (field: SortField) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();

      setAnimateReorder(true);
      if (sortAnimationTimerRef.current !== null) {
        window.clearTimeout(sortAnimationTimerRef.current);
      }
      sortAnimationTimerRef.current = window.setTimeout(() => {
        sortAnimationTimerRef.current = null;
        setAnimateReorder(false);
      }, 280);
      
      setSortState((prev) => {
        if (prev.field === field) {
          const nextOrder: SortOrder = 
            prev.order === 'default' ? 'asc' : 
            prev.order === 'asc' ? 'desc' : 'default';
          return { field: nextOrder === 'default' ? null : field, order: nextOrder };
        } else {
          return { field, order: 'asc' };
        }
      });
    };
  };

  const getSortIcon = (field: SortField) => {
    const isActive = sortState.field === field && sortState.order !== "default";
    const SortIcon = isActive
      ? sortState.order === "asc"
        ? ChevronUp
        : ChevronDown
      : ArrowUpDown;

    return (
      <SortIcon
        key={`${field}-${isActive ? sortState.order : "default"}`}
        size={14}
        aria-hidden="true"
        className={cn(
          "semantic-icon-transition shrink-0",
          isActive && "text-primary"
        )}
      />
    );
  };

  const getSortAria = (field: SortField): "ascending" | "descending" | "none" => {
    if (sortState.field !== field || sortState.order === "default") {
      return "none";
    }
    return sortState.order === "asc" ? "ascending" : "descending";
  };

  const onlineNodes = liveData && liveData.online ? liveData.online : [];

  const getNodeData = (uuid: string): Record => {
    const defaultLive = {
      cpu: { usage: 0 },
      ram: { used: 0 },
      disk: { used: 0 },
      network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
      uptime: 0,
    } as Record;

    return liveData && liveData.data
      ? liveData.data[uuid] || defaultLive
      : defaultLive;
  };

  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline = onlineNodes.includes(a.uuid);
    const bOnline = onlineNodes.includes(b.uuid);
    const aData = getNodeData(a.uuid);
    const bData = getNodeData(b.uuid);

    if (!sortState.field || sortState.order === 'default') {
      if (aOnline !== bOnline) {
        return aOnline ? -1 : 1;
      }
      return a.weight - b.weight;
    }

    let comparison = 0;
    switch (sortState.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'os':
        comparison = a.os.localeCompare(b.os);
        break;
      case 'status':
        comparison = Number(bOnline) - Number(aOnline);
        break;
      case 'cpu':
        comparison = aData.cpu.usage - bData.cpu.usage;
        break;
      case 'ram': {
        const aRamPercent = a.mem_total ? (aData.ram.used / a.mem_total) * 100 : 0;
        const bRamPercent = b.mem_total ? (bData.ram.used / b.mem_total) * 100 : 0;
        comparison = aRamPercent - bRamPercent;
        break;
      }
      case 'disk': {
        const aDiskPercent = a.disk_total ? (aData.disk.used / a.disk_total) * 100 : 0;
        const bDiskPercent = b.disk_total ? (bData.disk.used / b.disk_total) * 100 : 0;
        comparison = aDiskPercent - bDiskPercent;
        break;
      }
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'networkUp':
        comparison = aData.network.up - bData.network.up;
        break;
      case 'networkDown':
        comparison = aData.network.down - bData.network.down;
        break;
      case 'totalUp':
        comparison = aData.network.totalUp - bData.network.totalUp;
        break;
      case 'totalDown':
        comparison = aData.network.totalDown - bData.network.totalDown;
        break;
      default:
        comparison = 0;
    }

    return sortState.order === 'desc' ? -comparison : comparison;
  });

  const showBillingColumn = (showPrice || showExpiredAt) && nodes.some(node => node.price !== 0);
  const billingColumnTitle = showPrice
    ? t("nodeCard.price")
    : t("nodeCard.expires_at", { defaultValue: "Expires At" });
  const tableColumnCount = showBillingColumn ? 10 : 9;

  return (
    <div {...getRevealProps(revealDelay, revealReady)} data-card-blur-surface="true" className="rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className={cn("w-full table-fixed", showBillingColumn ? "min-w-[1240px]" : "min-w-[1084px]")}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[30px] px-2"></TableHead>
              <TableHead
                className="w-[264px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('name')}
                aria-sort={getSortAria("name")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.name")}
                  {getSortIcon('name')}
                </Flex>
              </TableHead>
              <TableHead
                className="w-[90px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('os')}
                aria-sort={getSortAria("os")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.os")}
                  {getSortIcon('os')}
                </Flex>
              </TableHead>
              <TableHead
                className="w-[120px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('status')}
                aria-sort={getSortAria("status")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.status")}
                  {getSortIcon('status')}
                </Flex>
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('cpu')}
                aria-sort={getSortAria("cpu")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.cpu")}
                  {getSortIcon('cpu')}
                </Flex>
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('ram')}
                aria-sort={getSortAria("ram")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.ram")}
                  {getSortIcon('ram')}
                </Flex>
              </TableHead>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('disk')}
                aria-sort={getSortAria("disk")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.disk")}
                  {getSortIcon('disk')}
                </Flex>
              </TableHead>
              {showBillingColumn &&
                <TableHead
                  className={cn(
                    "w-[156px] transition-colors text-center px-2",
                    showPrice && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={showPrice ? handleSort('price') : undefined}
                  aria-sort={showPrice ? getSortAria("price") : "none"}
                  title={showPrice ? t("nodeCard.sortTooltip") : undefined}
                >
                  <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                    {billingColumnTitle}
                    {showPrice && getSortIcon('price')}
                  </Flex>
                </TableHead>
              }
              <TableHead
                className="w-[140px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('networkUp')}
                aria-sort={getSortAria("networkUp")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.networkSpeed")}
                  {getSortIcon('networkUp')}
                </Flex>
              </TableHead>
              <TableHead
                className="w-[200px] cursor-pointer hover:bg-muted/50 transition-colors text-center px-2"
                onClick={handleSort('totalUp')}
                aria-sort={getSortAria("totalUp")}
                title={t("nodeCard.sortTooltip")}
              >
                <Flex align="center" gap="1" justify="center" className="whitespace-nowrap">
                  {t("nodeCard.totalTransfer")}
                  {getSortIcon('totalUp')}
                </Flex>
              </TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {sortedNodes.map((node) => {
            const isOnline = onlineNodes.includes(node.uuid);
            const nodeData = getNodeData(node.uuid);
            const isExpanded = expandedRows.has(node.uuid);

            const memoryUsagePercent = node.mem_total
              ? (nodeData.ram.used / node.mem_total) * 100
              : 0;
            const diskUsagePercent = node.disk_total
              ? (nodeData.disk.used / node.disk_total) * 100
              : 0;
            const trafficLimitType = node.traffic_limit_type ?? "sum";
            const trafficUsed = getTrafficUsed(
              nodeData.network.totalUp,
              nodeData.network.totalDown,
              trafficLimitType
            );
            const trafficPercentage = getTrafficPercentage(
              nodeData.network.totalUp,
              nodeData.network.totalDown,
              node.traffic_limit,
              trafficLimitType
            );
            const trafficBarWidth = Number.isFinite(trafficPercentage)
              ? Math.min(Math.max(trafficPercentage, 0), 100)
              : 0;

            return (
              <React.Fragment key={node.uuid}>
                <motion.tr
                  data-slot="table-row"
                  className={cn(
                    "transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer",
                    !isOnline && "opacity-60",
                    isExpanded && "bg-muted/50"
                  )}
                  layout={animateReorder && prefersReducedMotion !== true ? "position" : false}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={() => toggleRowExpansion(node.uuid)}
                >
                  <TableCell className="py-2 px-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`node-details-${node.uuid}`}
                      aria-label={isExpanded ? "Collapse row" : "Expand row"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleRowExpansion(node.uuid);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    <div className="flex items-center justify-start gap-2">
                      <Flag flag={node.region} />
                      <SpaLink
                        href={`/instance/${node.uuid}`}
                        className="hover:underline focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate max-w-[200px]">
                            {node.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isOnline ? formatUptime(nodeData.uptime, t) : 'Offline'}
                          </span>
                        </div>
                      </SpaLink>
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2">
                    <div className="flex items-center justify-center">
                      <img src={getOSImage(node.os)} alt={node.os} className="w-5 h-5 opacity-80" />
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        key={`${node.uuid}-${isOnline ? "online" : "offline"}`}
                        variant="outline"
                        className={cn(
                          "node-status-badge-transition font-normal text-xs px-2 py-0.5 h-6",
                          isOnline
                            ? "text-green-600 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20"
                            : "text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20"
                        )}
                      >
                        <span
                          key={`${node.uuid}-${isOnline ? "online" : "offline"}`}
                          className={cn(
                            "status-indicator-change w-1.5 h-1.5 rounded-full mr-1.5",
                            isOnline ? "bg-green-500" : "bg-red-500"
                          )}
                        />
                        {isOnline ? t("nodeCard.online") : t("nodeCard.offline")}
                      </Badge>
                      {nodeData.message && (
                        <Tips color="#ef4444">{nodeData.message}</Tips>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2">
                    <div className="flex justify-center">
                      <AdaptiveChart
                        value={nodeData.cpu.usage}
                        label={t("nodeCard.cpu")}
                        compact={true}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AdaptiveChart
                        value={memoryUsagePercent}
                        label={t("nodeCard.ram")}
                        subLabel={themeConfig.showRamDiskTotal ? `${formatBytes(nodeData.ram.used)} / ${formatBytes(node.mem_total)}` : formatBytes(nodeData.ram.used)}
                        compact={true}
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {themeConfig.showRamDiskTotal ? `${formatBytes(nodeData.ram.used)} / ${formatBytes(node.mem_total)}` : formatBytes(nodeData.ram.used)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AdaptiveChart
                        value={diskUsagePercent}
                        label={t("nodeCard.disk")}
                        subLabel={themeConfig.showRamDiskTotal ? `${formatBytes(nodeData.disk.used)} / ${formatBytes(node.disk_total)}` : formatBytes(nodeData.disk.used)}
                        compact={true}
                      />
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {themeConfig.showRamDiskTotal ? `${formatBytes(nodeData.disk.used)} / ${formatBytes(node.disk_total)}` : formatBytes(nodeData.disk.used)}
                      </span>
                    </div>
                  </TableCell>
                  {showBillingColumn &&
                    <TableCell className="py-2 px-1.5">
                      <div className="flex min-w-0 items-center justify-center">
                        <PriceTags
                          price={node.price}
                          billing_cycle={node.billing_cycle}
                          expired_at={node.expired_at}
                          currency={node.currency}
                          gap="1"
                          tags={node.tags || ""}
                          compact
                          maxCustomTags={3}
                          className="max-w-[148px] justify-center"
                          showPrice={showPrice}
                          showExpiredAt={showExpiredAt}
                        />
                      </div>
                    </TableCell>
                  }
                  <TableCell className="py-2 px-2 text-center">
                    <div className="font-mono text-xs tabular-nums flex items-center justify-center gap-1 whitespace-nowrap">
                      <span className="text-blue-600 dark:text-blue-400">
                        ↑{formatBytes(nodeData.network.up)}/s
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-green-600 dark:text-green-400">
                        ↓{formatBytes(nodeData.network.down)}/s
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-center">
                    <div className="space-y-1.5">
                      {node.traffic_limit > 0 ? (
                        <div className="mx-auto w-full max-w-[184px] space-y-1">
                          <div className="flex items-center justify-between gap-2 text-[10px] leading-none text-muted-foreground">
                            <span className="shrink-0">{trafficLimitType.toUpperCase()} Limit</span>
                            <span className="shrink-0 font-mono tabular-nums">
                              {formatTrafficPercentage(trafficPercentage)}
                            </span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary/70 transition-transform duration-500 origin-left"
                              style={{ transform: `scaleX(${trafficBarWidth / 100})` }}
                            />
                          </div>
                          <div className="truncate text-[10px] leading-none text-muted-foreground">
                            {formatBytes(trafficUsed)} / {formatBytes(node.traffic_limit)}
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                          {formatBytes(nodeData.network.totalUp + nodeData.network.totalDown)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>

                {isExpanded && (
                  <TableRow
                    id={`node-details-${node.uuid}`}
                    className="bg-muted/30 hover:bg-muted/30"
                  >
                    <TableCell colSpan={tableColumnCount} className="max-w-0 p-0">
                      <div className="w-full max-w-full overflow-hidden px-4 py-6 md:px-8 md:py-8">
                        <ExpandedNodeDetails node={node} nodeData={nodeData} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
        </Table>
      </div>
    </div>
  );
};

interface ExpandedNodeDetailsProps {
  node: NodeBasicInfo;
  nodeData: Record;
}

const ExpandedNodeDetails: React.FC<ExpandedNodeDetailsProps> = ({ node }) => {
  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-hidden">
      <div data-card-blur-surface="true" className="min-w-0 max-w-full overflow-hidden rounded-lg bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <DetailsGrid uuid={node.uuid} />
      </div>
      <div data-card-blur-surface="true" className="min-w-0 max-w-full overflow-hidden rounded-lg bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <MiniPingChart hours={24} uuid={node.uuid} />
      </div>
    </div>
  );
};

export default NodeTable;
