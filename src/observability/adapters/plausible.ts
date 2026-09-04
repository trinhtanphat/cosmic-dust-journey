import type { ObservabilityAdapter, ObservabilityEvent, TelemetryConfig } from '../types.ts';

const analyticsEvents = new Set(['chapter.enter', 'journey.complete', 'audio.enabled', 'audio.disabled']);
const propsFor = (event: ObservabilityEvent) => Object.fromEntries(
  Object.entries(event.context).filter(([, value]) => typeof value === 'string' || typeof value === 'number'),
);

export function createPlausibleAdapter(
  config: TelemetryConfig,
  transport: typeof fetch = fetch,
): ObservabilityAdapter | null {
  if (!config.plausible || !config.plausibleDomain) return null;
  return {
    name: 'plausible',
    kind: 'analytics',
    async send(event) {
      if (!analyticsEvents.has(event.name)) return;
      const response = await transport('https://plausible.io/api/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: event.name,
          url: '/',
          domain: config.plausibleDomain,
          props: propsFor(event),
        }),
        keepalive: true,
      });
      if (!response.ok) throw new Error(`Plausible transport failed: ${response.status}`);
    },
  };
}
