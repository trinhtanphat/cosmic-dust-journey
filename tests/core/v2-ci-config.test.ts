import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const url = new URL('../../.github/workflows/v2-ci.yml', import.meta.url);

test('V2 PR CI runs full check and browser suite without changing Pages deployment', () => {
  assert.equal(existsSync(url), true, 'V2 CI workflow must exist');
  const workflow = readFileSync(url, 'utf8');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /npm run test:e2e/);
  assert.match(workflow, /visual-checkpoints/);
});
