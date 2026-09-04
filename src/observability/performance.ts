export interface PerformanceDiagnosticsSink {
  recordFrame(ms: number): void;
  recordLongTask(ms: number): void;
  setHeapBaseline(bytes: number): void;
  setHeapCurrent(bytes: number): void;
}

type PerformanceWithMemory = Performance & {
  memory?: { usedJSHeapSize?: number };
};

export function startPerformanceDiagnostics(
  sink: PerformanceDiagnosticsSink,
  runtime: { PerformanceObserver?: typeof PerformanceObserver; performance?: Performance } = {},
): () => void {
  const Observer = runtime.PerformanceObserver
    ?? (typeof PerformanceObserver !== 'undefined' ? PerformanceObserver : undefined);
  const perf = runtime.performance
    ?? (typeof performance !== 'undefined' ? performance : undefined);
  const heap = (perf as PerformanceWithMemory | undefined)?.memory?.usedJSHeapSize;

  if (typeof heap === 'number' && Number.isFinite(heap)) sink.setHeapBaseline(heap);

  let observer: PerformanceObserver | undefined;
  if (Observer) {
    try {
      observer = new Observer((list) => {
        for (const entry of list.getEntries()) {
          if (Number.isFinite(entry.duration)) sink.recordLongTask(Math.max(0, entry.duration));
        }
      });
      try {
        observer.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit);
      } catch {
        observer.observe({ entryTypes: ['longtask'] });
      }
    } catch {
      observer = undefined;
    }
  }

  return () => {
    try {
      observer?.disconnect();
    } catch {
      // Optional diagnostics must never break application cleanup.
    }
  };
}
