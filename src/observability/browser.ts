import { createDiagnosticsAccumulator, type DiagnosticsAccumulator, type DiagnosticsSnapshot } from './diagnostics.ts';
import { createObservabilityHub, type ObservabilityHub } from './hub.ts';
import { startPerformanceDiagnostics, type PerformanceDiagnosticsSink } from './performance.ts';

type PerformanceWithMemory = Performance & { memory?: { usedJSHeapSize?: number } };
type PerformanceStarter = (sink: PerformanceDiagnosticsSink) => () => void;

export interface BrowserObservability {
  hub: ObservabilityHub;
  diagnostics: DiagnosticsAccumulator;
  start(): void;
  stop(): void;
  snapshot(): DiagnosticsSnapshot;
  dispose(): void;
}

export function createBrowserObservability(options: {
  now?: () => number;
  startPerformance?: PerformanceStarter;
  performance?: Performance;
} = {}): BrowserObservability {
  const now = options.now ?? Date.now;
  const diagnostics = createDiagnosticsAccumulator(now);
  const hub = createObservabilityHub({ now, onEvent: (event) => diagnostics.recordEvent(event) });
  const starter = options.startPerformance ?? ((sink) => startPerformanceDiagnostics(sink));
  let cleanupPerformance: (() => void) | null = null;
  let disposed = false;

  const runtime: BrowserObservability = {
    hub,
    diagnostics,
    start() {
      if (disposed || cleanupPerformance) return;
      cleanupPerformance = starter(diagnostics);
    },
    stop() {
      const cleanup = cleanupPerformance;
      cleanupPerformance = null;
      cleanup?.();
    },
    snapshot() {
      const perf = options.performance
        ?? (typeof performance !== 'undefined' ? performance : undefined);
      const heap = (perf as PerformanceWithMemory | undefined)?.memory?.usedJSHeapSize;
      if (typeof heap === 'number' && Number.isFinite(heap)) diagnostics.setHeapCurrent(heap);
      return diagnostics.snapshot(now());
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      runtime.stop();
      hub.dispose();
    },
  };
  return runtime;
}
