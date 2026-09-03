import test from 'node:test';
import assert from 'node:assert/strict';

test('scene model expresses distinct stellar phases', async () => {
  const scenes = await import('../../src/scenes/sceneModel.ts').catch(() => null);
  assert.ok(scenes, 'scene model should exist');
  const low = { tier: 'low', dpr: 1, particleBudget: 9000, reducedMotion: false, postprocessing: false } as any;
  const dust = scenes!.sceneModel('dust', 0.5, low);
  const collapse = scenes!.sceneModel('collapse', 1, low);
  const red = scenes!.sceneModel('red-giant', 1, low);
  const dwarf = scenes!.sceneModel('white-dwarf', 1, low);
  const blackHole = scenes!.sceneModel('black-hole', 0.7, low);
  assert.ok(dust.particleSpread > collapse.particleSpread);
  assert.ok(red.starRadius > collapse.starRadius);
  assert.ok(dwarf.starRadius < 1);
  assert.equal(blackHole.blackHoleVisible, true);
});
