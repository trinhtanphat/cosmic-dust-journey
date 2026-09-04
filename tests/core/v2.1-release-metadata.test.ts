import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as { version?: string };
const envUrl = new URL('.env.example', root);
const pages = readFileSync(new URL('.github/workflows/deploy-pages.yml', root), 'utf8');

test('V2.1 release metadata uses placeholder-only telemetry config and preserves Pages guards', () => {
  assert.equal(pkg.version, '2.1.0');
  assert.equal(existsSync(envUrl), true, '.env.example must exist');
  const env = readFileSync(envUrl, 'utf8');
  for (const name of [
    'VITE_TELEMETRY_MODE', 'VITE_SENTRY_ENABLED', 'VITE_SENTRY_DSN',
    'VITE_PLAUSIBLE_ENABLED', 'VITE_PLAUSIBLE_DOMAIN',
    'VITE_GA4_ENABLED', 'VITE_GA4_MEASUREMENT_ID',
  ]) assert.match(env, new RegExp(`^${name}=`, 'm'));
  assert.doesNotMatch(env, /https?:\/\//, 'example file must not commit a real endpoint or DSN');
  assert.match(pages, /VITE_BASE_PATH: \/cosmic-dust-journey\//);
  assert.match(pages, /\/cosmic-dust-journey\/assets\//);
  assert.match(pages, /! grep -q '\/src\/main\.tsx'/);
});
