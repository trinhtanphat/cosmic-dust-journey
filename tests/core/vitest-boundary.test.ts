import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Vitest keeps Node core tests outside the jsdom suite', () => {
  const vite = read('vite.config.ts');
  assert.match(vite, /exclude:\s*\[[^\]]*tests\/core\/\*\*/s);
});

test('jsdom setup provides matchMedia for GSAP ScrollTrigger', () => {
  const setup = read('tests/setup.ts');
  assert.match(setup, /matchMedia/);
  assert.match(setup, /addEventListener/);
  assert.match(setup, /removeEventListener/);
});
