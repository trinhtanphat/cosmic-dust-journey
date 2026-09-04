import type { PrivacySignals, TelemetryConfig } from './types.ts';

declare global {
  interface Window {
    __CDJ_TELEMETRY_OVERRIDE__?: Record<string, string | undefined>;
  }
}

type NavigatorWithPrivacy = Navigator & { globalPrivacyControl?: boolean };

const enabled = (value: string | undefined) => value === 'true';
const nonBlank = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export function resolveTelemetryConfig(
  env: Record<string, string | undefined>,
  privacy: PrivacySignals,
): TelemetryConfig {
  const mode = env.VITE_TELEMETRY_MODE === 'external' ? 'external' : 'local';
  const external = mode === 'external';
  const analyticsAllowed = !privacy.doNotTrack && !privacy.globalPrivacyControl;
  const sentryDsn = nonBlank(env.VITE_SENTRY_DSN);
  const plausibleDomain = nonBlank(env.VITE_PLAUSIBLE_DOMAIN);
  const ga4MeasurementId = nonBlank(env.VITE_GA4_MEASUREMENT_ID);

  const result: TelemetryConfig = {
    mode,
    sentry: external && enabled(env.VITE_SENTRY_ENABLED) && Boolean(sentryDsn),
    plausible: external && analyticsAllowed && enabled(env.VITE_PLAUSIBLE_ENABLED) && Boolean(plausibleDomain),
    ga4: external && analyticsAllowed && enabled(env.VITE_GA4_ENABLED) && Boolean(ga4MeasurementId),
  };
  if (sentryDsn) result.sentryDsn = sentryDsn;
  if (plausibleDomain) result.plausibleDomain = plausibleDomain;
  if (ga4MeasurementId) result.ga4MeasurementId = ga4MeasurementId;
  return result;
}

export function readBrowserPrivacySignals(): PrivacySignals {
  if (typeof navigator === 'undefined') return { doNotTrack: false, globalPrivacyControl: false };
  const nav = navigator as NavigatorWithPrivacy;
  const dnt = nav.doNotTrack;
  return {
    doNotTrack: dnt === '1' || dnt === 'yes',
    globalPrivacyControl: nav.globalPrivacyControl === true,
  };
}

export function readBrowserTelemetryConfig(): TelemetryConfig {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const env = { ...metaEnv };
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if ((host === 'localhost' || host === '127.0.0.1') && window.__CDJ_TELEMETRY_OVERRIDE__) {
      Object.assign(env, window.__CDJ_TELEMETRY_OVERRIDE__);
    }
  }
  return resolveTelemetryConfig(env, readBrowserPrivacySignals());
}
