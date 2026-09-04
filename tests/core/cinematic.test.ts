import test from 'node:test';
import assert from 'node:assert/strict';
import { cinematicProfileFor, resolveCinematicPhase } from '../../src/experience/cinematic.ts';

const ids = ['overture','cold-cloud','collapse','ignition','main-sequence','red-giant','shedding','white-dwarf','elsewhere','epilogue'];

test('all ten chapters have valid profiles', () => {
  for (const id of ids) {
    const profile = cinematicProfileFor(id);
    assert.equal(profile.chapterId, id);
    assert.ok(profile.camera.keyframes.length >= 2);
    assert.ok(profile.interactionMax >= 0 && profile.interactionMax <= 1);
  }
});

test('resolver exposes enter settle interact transition', () => {
  const profile = cinematicProfileFor('main-sequence');
  assert.equal(resolveCinematicPhase(profile, 0.05).phase, 'enter');
  assert.equal(resolveCinematicPhase(profile, 0.30).phase, 'settle');
  assert.equal(resolveCinematicPhase(profile, 0.60).phase, 'interact');
  assert.equal(resolveCinematicPhase(profile, 0.95).phase, 'transition');
});
