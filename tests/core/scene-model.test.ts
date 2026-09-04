import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneIds } from '../../src/content/types.ts';
import { sceneModel } from '../../src/scenes/sceneModel.ts';

const low = { tier: 'low', dpr: 1, particleBudget: 9000, reducedMotion: false, postprocessing: false } as const;

test('scene model expresses distinct stellar phases', () => {
  const dust = sceneModel('dust', 0.5, low);
  const collapse = sceneModel('collapse', 1, low);
  const red = sceneModel('red-giant', 1, low);
  const dwarf = sceneModel('white-dwarf', 1, low);
  const blackHole = sceneModel('black-hole', 0.7, low);
  assert.ok(dust.particleSpread > collapse.particleSpread);
  assert.ok(red.starRadius > collapse.starRadius);
  assert.ok(dwarf.starRadius < 1);
  assert.equal(blackHole.blackHoleVisible, true);
});

test('early V2 phases expose bounded cinematic visual scalars', () => {
  const earlyCollapse = sceneModel('collapse', 0.1, low);
  const lateCollapse = sceneModel('collapse', 0.9, low);
  assert.ok(lateCollapse.particleSpread < earlyCollapse.particleSpread);

  const ignitionEarly = sceneModel('fusion', 0, low);
  const ignitionPeak = sceneModel('fusion', 0.5, low);
  const ignitionLate = sceneModel('fusion', 1, low);
  assert.ok(ignitionPeak.glowResponse > ignitionEarly.glowResponse);
  assert.ok(ignitionPeak.glowResponse > ignitionLate.glowResponse);

  const main = sceneModel('main-sequence', 0.5, low);
  assert.ok(Number.isFinite(main.surfaceTurbulence));

  for (const scene of sceneIds) {
    for (const progress of [-1, 0, 0.5, 1, 2]) {
      const model = sceneModel(scene, progress, low);
      for (const value of [model.surfaceTurbulence, model.shellInstability, model.ejection, model.lensing, model.glowResponse]) {
        assert.ok(Number.isFinite(value));
        assert.ok(value >= 0 && value <= 1, `${scene}@${progress}: ${value}`);
      }
    }
  }
});

test('late V2 phases expose shell ejection compaction and lensing', () => {
  const redEarly = sceneModel('red-giant', 0.15, low);
  const redLate = sceneModel('red-giant', 0.9, low);
  assert.ok(redLate.shellInstability > redEarly.shellInstability);

  const nebulaEarly = sceneModel('nebula', 0.1, low);
  const nebulaLate = sceneModel('nebula', 0.9, low);
  assert.ok(nebulaLate.ejection > nebulaEarly.ejection);
  assert.ok(nebulaLate.starRadius < nebulaEarly.starRadius);

  const dwarfEarly = sceneModel('white-dwarf', 0.1, low);
  const dwarfLate = sceneModel('white-dwarf', 0.9, low);
  assert.ok(dwarfLate.starRadius < dwarfEarly.starRadius);
  assert.ok(Number.isFinite(dwarfLate.glowResponse));

  const black = sceneModel('black-hole', 0.7, low);
  assert.ok(black.lensing > 0 && black.lensing <= 1);
});
