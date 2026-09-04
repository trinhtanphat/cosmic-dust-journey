import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shell = readFileSync(new URL('../../src/app/ExperienceShell.tsx', import.meta.url), 'utf8');
const canvas = readFileSync(new URL('../../src/experience/ExperienceCanvas.tsx', import.meta.url), 'utf8');

test('renderer recovery is wired outside narrative DOM and follows the remounted DOM canvas', () => {
  assert.match(shell, /RuntimeErrorBoundary/);
  assert.match(shell, /reduceWebGLRecovery/);
  assert.match(canvas, /useLayoutEffect/);
  assert.match(canvas, /querySelector\('canvas'\)/);
  assert.match(canvas, /addEventListener\('webglcontextlost'/);
  assert.match(canvas, /addEventListener\('webglcontextrestored'/);
  assert.match(canvas, /removeEventListener\('webglcontextlost'/);
  assert.match(canvas, /removeEventListener\('webglcontextrestored'/);
  assert.doesNotMatch(canvas, /WebGLRecoveryBoundary/);
  assert.match(canvas, /onContextLost/);
  assert.match(canvas, /onContextRestored/);
  assert.match(shell, /setWebgl\(supported\)[\s\S]*?\}, \[observability\]\);/);
});
