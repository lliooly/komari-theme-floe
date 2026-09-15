export interface VisibilityPollingRun {
  generation: number;
  isCurrent: () => boolean;
}

export interface VisibilityPollingOptions {
  intervalMs: number;
  maxBackoffMs?: number;
  poll: (run: VisibilityPollingRun) => Promise<boolean>;
}

export function getExponentialBackoffDelay(
  intervalMs: number,
  failureCount: number,
  maxBackoffMs: number,
): number {
  const base = Math.max(0, intervalMs);
  const failures = Math.max(0, Math.floor(failureCount));
  const maximum = Math.max(base, maxBackoffMs);

  return Math.min(maximum, base * 2 ** failures);
}

function isPageHidden() {
  return (
    typeof document !== "undefined" &&
    (document.hidden || document.visibilityState === "hidden")
  );
}

/**
 * Runs one request at a time, pauses while the document is hidden, and
 * schedules the next request only after the current one has settled.
 * Returning false from poll applies exponential backoff; throwing is treated
 * as the same failure and is intentionally swallowed by the scheduler.
 */
export function createVisibilityPoller({
  intervalMs,
  maxBackoffMs = 30_000,
  poll,
}: VisibilityPollingOptions): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => undefined;
  }

  let stopped = false;
  let running = false;
  let timer: number | undefined;
  let failures = 0;
  let generation = 0;
  let resumeRequested = false;

  const clearTimer = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };

  const schedule = (delay: number) => {
    clearTimer();
    if (stopped || isPageHidden()) return;

    timer = window.setTimeout(() => {
      timer = undefined;
      void run(false);
    }, delay);
  };

  const run = async (resetBackoff: boolean) => {
    if (stopped || isPageHidden()) return;

    if (running) {
      if (resetBackoff) resumeRequested = true;
      return;
    }

    running = true;
    if (resetBackoff) failures = 0;

    const runGeneration = ++generation;
    const context: VisibilityPollingRun = {
      generation: runGeneration,
      isCurrent: () =>
        !stopped && !isPageHidden() && generation === runGeneration,
    };

    try {
      const succeeded = await poll(context);
      if (!context.isCurrent()) return;
      failures = succeeded ? 0 : Math.min(failures + 1, 31);
    } catch {
      if (!context.isCurrent()) return;
      failures = Math.min(failures + 1, 31);
    } finally {
      running = false;

      if (!stopped && !isPageHidden() && resumeRequested) {
        resumeRequested = false;
        void run(true);
      } else if (!stopped && !isPageHidden() && context.isCurrent()) {
        schedule(getExponentialBackoffDelay(intervalMs, failures, maxBackoffMs));
      }
    }
  };

  const resume = () => {
    if (stopped || isPageHidden()) return;
    clearTimer();
    failures = 0;
    void run(true);
  };

  const handleVisibilityChange = () => {
    if (isPageHidden()) {
      generation++;
      resumeRequested = false;
      clearTimer();
      return;
    }

    resume();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", resume);
  window.addEventListener("online", resume);
  void run(true);

  return () => {
    stopped = true;
    generation++;
    resumeRequested = false;
    clearTimer();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", resume);
    window.removeEventListener("online", resume);
  };
}
