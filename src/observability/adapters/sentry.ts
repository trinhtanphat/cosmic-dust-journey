import type { ObservabilityAdapter, ObservabilityEvent, TelemetryConfig } from '../types.ts';

type SentryModule = typeof import('@sentry/browser');
const reportable = new Set([
  'runtime.error', 'runtime.unhandled-rejection', 'webgl.context-lost', 'webgl.fallback',
]);

export async function createSentryAdapter(
  config: TelemetryConfig,
  loadSentry: () => Promise<SentryModule> = () => import('@sentry/browser'),
): Promise<ObservabilityAdapter | null> {
  if (!config.sentry || !config.sentryDsn) return null;
  const sentry = await loadSentry();
  sentry.init({
    dsn: config.sentryDsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
  return {
    name: 'sentry',
    kind: 'error',
    send(event: ObservabilityEvent) {
      if (!reportable.has(event.name)) return;
      const classification = event.context.errorClass ?? event.name;
      sentry.captureMessage(classification, {
        level: 'error',
        tags: {
          event: event.name,
          chapter: event.context.chapterId,
          scene: event.context.sceneId,
        },
      });
    },
  };
}
