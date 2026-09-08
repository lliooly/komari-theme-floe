export const REQUEST_TIMEOUT_MS = 30_000;

/** Keep the timeout active until the response body has also been consumed. */
export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { signal?: AbortSignal; timeout?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = options.timeout && Number.isFinite(options.timeout) && options.timeout > 0
    ? options.timeout : REQUEST_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeout);
  try {
    controller.signal.throwIfAborted();
    return await operation(controller.signal);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

export function fetchJson<T>(url: string, options: { signal?: AbortSignal; timeout?: number } = {}): Promise<T> {
  return withRequestTimeout(async (signal) => {
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json() as Promise<T>;
  }, options);
}
