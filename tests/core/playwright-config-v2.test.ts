import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('V2 Playwright config defines desktop/mobile projects and visual checkpoints', () => {
  const config = read('playwright.config.ts');
  assert.match(config, /chromium-desktop/);
  assert.match(config, /chromium-mobile/);
  assert.match(config, /Pixel 7/);
  assert.equal(existsSync(new URL('../../tests/e2e/v2-experience.spec.ts', import.meta.url)), true);
  const spec = read('tests/e2e/v2-experience.spec.ts');
  for (const name of [
    'dust-settle.png','collapse-late.png','fusion-after.png','main-sequence-settle.png',
    'red-giant-expanded.png','nebula-wide.png','white-dwarf.png','black-hole.png',
  ]) assert.match(spec, new RegExp(name.replace('.', '\\.')));
});
