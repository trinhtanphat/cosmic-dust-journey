import test from 'node:test';
import assert from 'node:assert/strict';

const loadContinuity = async () => {
  const modulePath = '../../src/experience/visualContinuity.ts';
  return import(modulePath).catch(() => null);
};

const channel = (
  state: { matter: readonly { channel: string; amount: number }[] },
  name: string,
) => state.matter.find((entry) => entry.channel === name);

test('visual continuity resolver is deterministic and clamps invalid inputs', async () => {
  const continuity = await loadContinuity();
  assert.ok(continuity, 'visualContinuity module must exist');
  const input = { chapterIndex: Number.POSITIVE_INFINITY, localProgress: Number.NaN, reducedMotion: false };
  const first = continuity.resolveVisualContinuity(input);
  const second = continuity.resolveVisualContinuity(input);
  assert.deepEqual(first, second);
  assert.equal(first.currentScene, 'dust');
  assert.ok(first.blend.outgoingWeight >= 0 && first.blend.outgoingWeight <= 1);
  assert.ok(first.blend.incomingWeight >= 0 && first.blend.incomingWeight <= 1);
  assert.ok(first.blend.transfer >= 0 && first.blend.transfer <= 1);
});

test('cold cloud transfers inherited dust and gas into collapse', async () => {
  const continuity = await loadContinuity();
  assert.ok(continuity, 'visualContinuity module must exist');
  const state = continuity.resolveVisualContinuity({ chapterIndex: 1, localProgress: 0.95, reducedMotion: false });
  assert.equal(state.currentScene, 'dust');
  assert.equal(state.nextScene, 'collapse');
  assert.ok((channel(state, 'dust')?.amount ?? 0) > 0.2);
  assert.ok((channel(state, 'gas')?.amount ?? 0) > 0.2);
  assert.ok(state.blend.transfer > 0.5);
});

test('red giant transfers envelope into ejecta and white dwarf retains ejecta', async () => {
  const continuity = await loadContinuity();
  assert.ok(continuity, 'visualContinuity module must exist');
  const shedding = continuity.resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.95, reducedMotion: false });
  assert.equal(shedding.currentScene, 'red-giant');
  assert.equal(shedding.nextScene, 'nebula');
  assert.ok((channel(shedding, 'envelope')?.amount ?? 0) > 0.1);
  assert.ok((channel(shedding, 'ejecta')?.amount ?? 0) > 0.25);

  const remnant = continuity.resolveVisualContinuity({ chapterIndex: 6, localProgress: 0.95, reducedMotion: false });
  assert.equal(remnant.nextScene, 'white-dwarf');
  assert.ok((channel(remnant, 'ejecta')?.amount ?? 0) > 0.15);
  assert.ok((channel(remnant, 'remnant')?.amount ?? 0) > 0.3);
});

test('white dwarf to elsewhere is an isolated alternate-outcome bridge', async () => {
  const continuity = await loadContinuity();
  assert.ok(continuity, 'visualContinuity module must exist');
  const state = continuity.resolveVisualContinuity({ chapterIndex: 7, localProgress: 0.95, reducedMotion: false });
  assert.equal(state.currentScene, 'white-dwarf');
  assert.equal(state.nextScene, 'black-hole');
  assert.ok(state.blend.transfer <= 0.08);
  assert.ok((channel(state, 'remnant')?.amount ?? 0) > 0.1);
  assert.ok((channel(state, 'accretion')?.amount ?? 0) >= 0);
});

test('reduced motion keeps transfer topology while lowering turbulence', async () => {
  const continuity = await loadContinuity();
  assert.ok(continuity, 'visualContinuity module must exist');
  const normal = continuity.resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.72, reducedMotion: false });
  const reduced = continuity.resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.72, reducedMotion: true });
  assert.equal(normal.currentScene, reduced.currentScene);
  assert.equal(normal.nextScene, reduced.nextScene);
  assert.equal(normal.blend.transfer, reduced.blend.transfer);
  assert.ok(reduced.energy.turbulence <= normal.energy.turbulence);
});
