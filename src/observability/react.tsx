import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createConfiguredAdapters } from './adapters/index.ts';
import { createBrowserObservability, type BrowserObservability } from './browser.ts';
import { readBrowserTelemetryConfig } from './config.ts';
import { classifyRuntimeError } from './errors.ts';

interface DiagnosticsBridge {
  snapshot: BrowserObservability['snapshot'];
}

declare global {
  interface Window {
    __CDJ_DIAGNOSTICS__?: DiagnosticsBridge;
  }
}

const ObservabilityContext = createContext<BrowserObservability | null>(null);

const isLocalHost = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  const runtimeRef = useRef<BrowserObservability | null>(null);
  const disposeTimerRef = useRef<number | null>(null);
  const adaptersPromiseRef = useRef<ReturnType<typeof createConfiguredAdapters> | null>(null);
  if (!runtimeRef.current) runtimeRef.current = createBrowserObservability();
  const runtime = runtimeRef.current;

  useEffect(() => {
    if (disposeTimerRef.current !== null) {
      window.clearTimeout(disposeTimerRef.current);
      disposeTimerRef.current = null;
    }
    runtime.start();
    let cancelled = false;
    if (!adaptersPromiseRef.current) {
      adaptersPromiseRef.current = createConfiguredAdapters(readBrowserTelemetryConfig());
    }
    void adaptersPromiseRef.current.then((adapters) => {
      if (!cancelled) adapters.forEach((adapter) => runtime.hub.addAdapter(adapter));
    }).catch(() => undefined);

    const onRuntimeError = (event: ErrorEvent) => {
      runtime.hub.emit('runtime.error', { errorClass: classifyRuntimeError(event.error) });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      runtime.hub.emit('runtime.unhandled-rejection', { errorClass: classifyRuntimeError(event.reason) });
    };
    window.addEventListener('error', onRuntimeError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    const bridge = { snapshot: () => runtime.snapshot() };
    if (isLocalHost()) window.__CDJ_DIAGNOSTICS__ = bridge;

    return () => {
      cancelled = true;
      runtime.stop();
      window.removeEventListener('error', onRuntimeError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      if (window.__CDJ_DIAGNOSTICS__ === bridge) delete window.__CDJ_DIAGNOSTICS__;
      disposeTimerRef.current = window.setTimeout(() => {
        runtime.dispose();
        disposeTimerRef.current = null;
      }, 0);
    };
  }, [runtime]);

  return <ObservabilityContext.Provider value={runtime}>{children}</ObservabilityContext.Provider>;
}

export function useObservability(): BrowserObservability {
  const runtime = useContext(ObservabilityContext);
  if (!runtime) throw new Error('useObservability must be used within ObservabilityProvider.');
  return runtime;
}

export { createBrowserObservability } from './browser.ts';
export type { BrowserObservability } from './browser.ts';
