import type { ObservabilityAdapter, TelemetryConfig } from '../types.ts';

const analyticsEvents = new Set(['chapter.enter', 'journey.complete', 'audio.enabled', 'audio.disabled']);

export function createGa4Adapter(
  config: TelemetryConfig,
  transport: typeof fetch = fetch,
): ObservabilityAdapter | null {
  if (!config.ga4 || !config.ga4MeasurementId) return null;
  return {
    name: 'ga4',
    kind: 'analytics',
    async send(event) {
      if (!analyticsEvents.has(event.name)) return;
      const params = new URLSearchParams({
        v: '2',
        tid: config.ga4MeasurementId!,
        en: event.name.replace(/\./g, '_'),
        npa: '1',
      });
      if (event.context.chapterId) params.set('ep.chapter_id', event.context.chapterId);
      if (event.context.sceneId) params.set('ep.scene_id', event.context.sceneId);
      if (event.context.phase) params.set('ep.phase', event.context.phase);
      const response = await transport(`https://www.google-analytics.com/g/collect?${params.toString()}`, {
        method: 'POST',
        keepalive: true,
      });
      if (!response.ok) throw new Error(`GA4 transport failed: ${response.status}`);
    },
  };
}
