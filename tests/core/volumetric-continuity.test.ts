import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVisualContinuity } from '../../src/experience/visualContinuity.ts';
import { matterChannel, resolveVolumetricBands } from '../../src/scenes/volumetricContinuity.ts';

test('full volumetric quality resolves three deterministic depth bands', () => {
  const input = { seed: 1701, quality: 'full' as const, density: 0.82, turbulence: 0.67 };
  const first = resolveVolumetricBands(input);
  const second = resolveVolumetricBands(input);
  assert.deepEqual(first, second);
  assert.equal(first.length, 3);
  assert.equal(new Set(first.map((band) => band.seed)).size, 3);
  assert.ok(first[0].depth < first[1].depth && first[1].depth < first[2].depth);
});

test('quality degradation removes secondary bands without changing the primary band', () => {
  const full = resolveVolumetricBands({ seed: 8128, quality: 'full', density: 0.65, turbulence: 0.5 });
  const reduced = resolveVolumetricBands({ seed: 8128, quality: 'reduced', density: 0.65, turbulence: 0.5 });
  const minimal = resolveVolumetricBands({ seed: 8128, quality: 'minimal', density: 0.65, turbulence: 0.5 });
  assert.equal(reduced.length, 2);
  assert.equal(minimal.length, 1);
  assert.equal(reduced[0].seed, full[0].seed);
  assert.equal(minimal[0].depth, full[0].depth);
});

test('matter channel lookup preserves continuity state', () => {
  const continuity = resolveVisualContinuity({ chapterIndex: 6, localProgress: 0.95, reducedMotion: false });
  const transfer = continuity.blend.transfer;
  assert.ok(matterChannel(continuity, 'ejecta').amount > 0.15);
  assert.ok(matterChannel(continuity, 'remnant').amount > 0.3);
  assert.equal(continuity.blend.transfer, transfer);
});
