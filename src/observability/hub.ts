import { sanitizeContext } from './sanitize.ts';
import type { ObservabilityAdapter, ObservabilityEvent, ObservabilityEventName } from './types.ts';

interface AdapterRuntime {
  adapter: ObservabilityAdapter;
  failures: number;
  disabled: boolean;
}

export interface ObservabilityHub {
  emit(name: ObservabilityEventName, context?: Record<string, unknown>): void;
  addAdapter(adapter: ObservabilityAdapter): void;
  recentEvents(): readonly ObservabilityEvent[];
  adapterState(): Readonly<Record<string, { failures: number; disabled: boolean }>>;
  dispose(): void;
}

export function createObservabilityHub(options: {
  capacity?: number;
  failureLimit?: number;
  adapters?: ObservabilityAdapter[];
  onEvent?: (event: ObservabilityEvent) => void;
  now?: () => number;
} = {}): ObservabilityHub {
  const capacity = Math.max(1, Math.floor(options.capacity ?? 256));
  const failureLimit = Math.max(1, Math.floor(options.failureLimit ?? 3));
  const now = options.now ?? Date.now;
  const events: ObservabilityEvent[] = [];
  const adapters = new Map<string, AdapterRuntime>();
  let disposed = false;

  const addAdapter = (adapter: ObservabilityAdapter) => {
    if (disposed || adapters.has(adapter.name)) return;
    adapters.set(adapter.name, { adapter, failures: 0, disabled: false });
  };
  for (const adapter of options.adapters ?? []) addAdapter(adapter);

  const markFailure = (runtime: AdapterRuntime) => {
    runtime.failures += 1;
    if (runtime.failures >= failureLimit) runtime.disabled = true;
  };
  const markSuccess = (runtime: AdapterRuntime) => {
    runtime.failures = 0;
  };

  return {
    emit(name, context = {}) {
      if (disposed) return;
      const event: ObservabilityEvent = { name, at: now(), context: sanitizeContext(context) };
      events.push(event);
      if (events.length > capacity) events.splice(0, events.length - capacity);
      try { options.onEvent?.(event); } catch { /* local diagnostics must not break runtime */ }

      for (const runtime of adapters.values()) {
        if (runtime.disabled) continue;
        try {
          Promise.resolve(runtime.adapter.send(event)).then(
            () => markSuccess(runtime),
            () => markFailure(runtime),
          );
        } catch {
          markFailure(runtime);
        }
      }
    },
    addAdapter,
    recentEvents: () => events.slice(),
    adapterState() {
      return Object.fromEntries(
        Array.from(adapters.entries(), ([name, runtime]) => [
          name,
          { failures: runtime.failures, disabled: runtime.disabled },
        ]),
      );
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const runtime of adapters.values()) {
        try { runtime.adapter.dispose?.(); } catch { /* provider cleanup is fail-open */ }
      }
      adapters.clear();
    },
  };
}
