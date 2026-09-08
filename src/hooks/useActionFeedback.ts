"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ActionFeedbackStatus = "idle" | "loading" | "success" | "error";

export type ActionFeedbackAction = () => Promise<boolean>;

const DEFAULT_RESET_DELAY_MS = 800;

export function useActionFeedback(resetDelayMs = DEFAULT_RESET_DELAY_MS) {
  const [status, setStatus] = useState<ActionFeedbackStatus>("idle");
  const statusRef = useRef<ActionFeedbackStatus>("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);
  const mountedRef = useRef(true);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const updateStatus = useCallback((nextStatus: ActionFeedbackStatus) => {
    statusRef.current = nextStatus;
    if (mountedRef.current) {
      setStatus(nextStatus);
    }
  }, []);

  const scheduleReset = useCallback(
    (runId: number) => {
      clearResetTimer();
      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        if (!mountedRef.current || runId !== runIdRef.current) {
          return;
        }
        updateStatus("idle");
      }, resetDelayMs);
    },
    [clearResetTimer, resetDelayMs, updateStatus],
  );

  const run = useCallback(
    async (action: ActionFeedbackAction): Promise<boolean> => {
      if (!mountedRef.current || statusRef.current === "loading") {
        return false;
      }

      clearResetTimer();
      const runId = ++runIdRef.current;
      updateStatus("loading");

      try {
        const succeeded = await action();
        if (!mountedRef.current || runId !== runIdRef.current) {
          return succeeded;
        }

        updateStatus(succeeded ? "success" : "error");
        scheduleReset(runId);
        return succeeded;
      } catch {
        if (!mountedRef.current || runId !== runIdRef.current) {
          return false;
        }

        updateStatus("error");
        scheduleReset(runId);
        return false;
      }
    },
    [clearResetTimer, scheduleReset, updateStatus],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
      clearResetTimer();
    };
  }, [clearResetTimer]);

  return { status, run };
}
