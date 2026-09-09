"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentTimeCardProps {
  className?: string;
}

/**
 * Client-only component that displays the current time.
 * Prevents hydration mismatch by only rendering after mount.
 */
export function CurrentTimeCard({ className }: CurrentTimeCardProps) {
  const [time, setTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // The mount flag intentionally gates client-only time rendering to avoid hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- establish the client-only render boundary
    setMounted(true);
    const updateTime = () => setTime(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <Skeleton className="h-6 w-24" />;
  }

  return <span className={className}>{time}</span>;
}
