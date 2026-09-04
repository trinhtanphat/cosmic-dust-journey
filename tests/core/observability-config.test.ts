import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTelemetryConfig } from '../../src/observability/config.ts';

test('telemetry defaults to local-only with every external provider disabled', () => {
  assert.deepEqual(resolveTelemetryConfig({}, { doNotTrack: false, globalPrivacyControl: false }), {
    mode: 'local', sentry: false, plausible: false, ga4: false,
  });
});

test('external telemetry only enables literal true flags and keeps configured identifiers', () => {
  const config = resolveTelemetryConfig({
    VITE_TELEMETRY_MODE: 'external',
    VITE_SENTRY_ENABLED: 'true', VITE_SENTRY_DSN: 'https://public@example.invalid/1',
    VITE_PLAUSIBLE_ENABLED: 'true', VITE_PLAUSIBLE_DOMAIN: 'journey.example',
    VITE_GA4_ENABLED: 'true', VITE_GA4_MEASUREMENT_ID: 'G-TEST123',
  }, { doNotTrack: false, globalPrivacyControl: false });
  assert.equal(config.mode, 'external');
  assert.equal(config.sentry, true); assert.equal(config.plausible, true); assert.equal(config.ga4, true);
  assert.equal(config.sentryDsn, 'https://public@example.invalid/1');
  assert.equal(config.plausibleDomain, 'journey.example');
  assert.equal(config.ga4MeasurementId, 'G-TEST123');
});

test('DNT and GPC suppress analytics while leaving independently configured error reporting available', () => {
  const env = {
    VITE_TELEMETRY_MODE: 'external', VITE_SENTRY_ENABLED: 'true', VITE_SENTRY_DSN: 'https://public@example.invalid/1',
    VITE_PLAUSIBLE_ENABLED: 'true', VITE_PLAUSIBLE_DOMAIN: 'journey.example',
    VITE_GA4_ENABLED: 'true', VITE_GA4_MEASUREMENT_ID: 'G-TEST123',
  };
  for (const privacy of [{ doNotTrack: true, globalPrivacyControl: false }, { doNotTrack: false, globalPrivacyControl: true }]) {
    const config = resolveTelemetryConfig(env, privacy);
    assert.equal(config.sentry, true); assert.equal(config.plausible, false); assert.equal(config.ga4, false);
  }
});

test('blank provider identifiers normalize to undefined and non-literal flags stay disabled', () => {
  const config = resolveTelemetryConfig({
    VITE_TELEMETRY_MODE: 'EXTERNAL', VITE_SENTRY_ENABLED: '1', VITE_SENTRY_DSN: '   ',
    VITE_PLAUSIBLE_ENABLED: 'TRUE', VITE_GA4_ENABLED: 'yes',
  }, { doNotTrack: false, globalPrivacyControl: false });
  assert.deepEqual(config, { mode: 'local', sentry: false, plausible: false, ga4: false });
});
