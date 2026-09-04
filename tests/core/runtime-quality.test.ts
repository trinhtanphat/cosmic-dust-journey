import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeQualityState, observeFrame, renderBudgetFor } from '../../src/experience/runtimeQuality.ts';

test('runtime quality degrades after sustained slow frames and recovers conservatively', () => {
  let state = createRuntimeQualityState();
  for (let i = 0; i < 45; i += 1) state = observeFrame(state, 30);
  assert.equal(state.level, 1);
  for (let i = 0; i < 239; i += 1) state = observeFrame(state, 12);
  assert.equal(state.level, 1);
  state = observeFrame(state, 12);
  assert.equal(state.level, 0);
});

test('render budgets degrade cost without changing base reduced-motion state', () => {
  const high = { tier:'high', dpr:1.75, particleBudget:64000, reducedMotion:false, postprocessing:true } as const;
  const level0 = renderBudgetFor(high, 0);
  const level3 = renderBudgetFor(high, 3);
  assert.equal(level0.postprocessing, true);
  assert.equal(level3.postprocessing, false);
  assert.ok(level3.particleBudget < level0.particleBudget);
  assert.ok(level3.dpr < level0.dpr);
  assert.equal(level3.secondaryLayers, false);
  assert.equal(level3.shaderComplexity, 'reduced');
});
