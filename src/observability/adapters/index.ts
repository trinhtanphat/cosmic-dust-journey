import type { ObservabilityAdapter, TelemetryConfig } from '../types.ts';
import { createGa4Adapter } from './ga4.ts';
import { createPlausibleAdapter } from './plausible.ts';
import { createSentryAdapter } from './sentry.ts';

type SentryModule = typeof import('@sentry/browser');

export async function createConfiguredAdapters(
  config: TelemetryConfig,
  deps: { loadSentry?: () => Promise<SentryModule>; fetch?: typeof fetch } = {},
): Promise<ObservabilityAdapter[]> {
  if (config.mode !== 'external') return [];
  const adapters: ObservabilityAdapter[] = [];
  if (config.sentry) {
    const sentry = await createSentryAdapter(config, deps.loadSentry).catch(() => null);
    if (sentry) adapters.push(sentry);
  }
  const plausible = createPlausibleAdapter(config, deps.fetch);
  if (plausible) adapters.push(plausible);
  const ga4 = createGa4Adapter(config, deps.fetch);
  if (ga4) adapters.push(ga4);
  return adapters;
}
