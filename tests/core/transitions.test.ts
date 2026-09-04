import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTransition } from '../../src/experience/transitions.ts';

test('flash cut emits a strong bounded flash during transition', () => {
  const flash = resolveTransition('flash-cut', 'transition', 0.5, false);
  assert.ok(flash.flash > 0.5);
  for (const value of [flash.amount, flash.outgoingOpacity, flash.incomingOpacity, flash.radialScale, flash.densityScale, flash.flash, flash.warp, flash.shell]) {
    assert.ok(value >= 0 && value <= 1);
  }
});

test('reduced motion degrades accretion warp to crossfade', () => {
  const reduced = resolveTransition('accretion-warp', 'transition', 1, true);
  assert.equal(reduced.mode, 'crossfade');
  assert.equal(reduced.warp, 0);
  assert.equal(reduced.incomingOpacity, 1);
});
