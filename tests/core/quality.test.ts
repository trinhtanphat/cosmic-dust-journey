import test from 'node:test';
import assert from 'node:assert/strict';

test('quality reduces motion and particle budget for constrained devices', async () => {
  const quality = await import('../../src/app/quality.ts').catch(() => null);
  assert.ok(quality, 'quality module should exist');
  assert.deepEqual(
    quality!.detectQuality({ dpr: 3, reducedMotion: true, deviceMemory: 2, hardwareConcurrency: 4, width: 390 }),
    { tier: 'low', dpr: 1, particleBudget: 9000, reducedMotion: true, postprocessing: false },
  );
});

test('quality enables richer rendering on desktop hardware', async () => {
  const { detectQuality } = await import('../../src/app/quality.ts');
  const result = detectQuality({ dpr: 2, reducedMotion: false, deviceMemory: 16, hardwareConcurrency: 12, width: 1440 });
  assert.equal(result.tier, 'high');
  assert.equal(result.particleBudget, 64000);
  assert.equal(result.dpr, 1.75);
  assert.equal(result.postprocessing, true);
});
