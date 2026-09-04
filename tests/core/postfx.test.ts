import test from 'node:test';
import assert from 'node:assert/strict';
import type { PostFxIntent } from '../../src/experience/cinematic.ts';
import type { RenderBudget } from '../../src/experience/runtimeQuality.ts';
import type { TransitionState } from '../../src/experience/transitions.ts';
import { resolvePostFx } from '../../src/experience/postfx.ts';

const neutral: TransitionState = {
  mode:'crossfade', amount:0, outgoingOpacity:1, incomingOpacity:0,
  radialScale:1, densityScale:1, flash:0, warp:0, shell:0,
};
const budgetLow: RenderBudget = {
  dpr:1, particleBudget:9000, postprocessing:false,
  secondaryLayers:false, shaderComplexity:'reduced',
};
const budgetHigh: RenderBudget = {
  dpr:1.5, particleBudget:50000, postprocessing:true,
  secondaryLayers:true, shaderComplexity:'full',
};
const intent: PostFxIntent = { bloom:0.8, exposure:1.05, vignette:0.5, chromaticFringe:0.08 };

test('postfx disables on low budget', () => {
  assert.equal(resolvePostFx('dust','settle',neutral,intent,budgetLow,false).enabled, false);
});

test('ignition flash increases bloom but keeps chromatic fringe bounded', () => {
  const flashState = { ...neutral, mode:'flash-cut' as const, amount:0.5, flash:1 };
  const ignition = resolvePostFx('fusion','transition',flashState,intent,budgetHigh,false);
  assert.ok(ignition.bloomStrength > 0.7);
  assert.ok(ignition.chromaticFringe <= 0.12);
  assert.ok(ignition.chromaticFringe > 0);
});

test('reduced motion disables postfx regardless of budget', () => {
  assert.equal(resolvePostFx('black-hole','transition',{...neutral,mode:'accretion-warp',warp:1},intent,budgetHigh,true).enabled, false);
});
