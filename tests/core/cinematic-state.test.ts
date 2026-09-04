import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCinematicState } from '../../src/experience/cinematicState.ts';

const high = { tier:'high', dpr:1.5, particleBudget:64000, reducedMotion:false, postprocessing:true } as const;

test('cinematic state is deterministic for identical inputs', () => {
  const input = { chapterId:'collapse', scene:'collapse' as const, localProgress:.6, pointer:{x:0,y:0}, quality:high, adaptiveLevel:0 as const };
  const a = resolveCinematicState(input);
  const b = resolveCinematicState(input);
  assert.deepEqual(a, b);
  assert.equal(a.profile.chapterId, 'collapse');
});

test('reduced motion removes warp without changing chapter identity', () => {
  const reduced = resolveCinematicState({
    chapterId:'elsewhere',
    scene:'black-hole',
    localProgress:.95,
    pointer:{x:1,y:1},
    quality:{...high,reducedMotion:true},
    adaptiveLevel:0,
  });
  assert.equal(reduced.transition.warp, 0);
  assert.equal(reduced.profile.chapterId, 'elsewhere');
  assert.equal(reduced.postFx.enabled, false);
});
