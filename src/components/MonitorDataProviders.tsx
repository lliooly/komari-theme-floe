"use client";

import type { ReactNode } from "react";
import { LiveDataProvider } from "@/contexts/LiveDataContext";
import { NodeListProvider } from "@/contexts/NodeListContext";

export default function MonitorDataProviders({ children }: { children: ReactNode }) {
  return (
    <NodeListProvider>
      <LiveDataProvider>{children}</LiveDataProvider>
    </NodeListProvider>
  );
}
