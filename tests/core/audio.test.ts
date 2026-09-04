import test from 'node:test';
import assert from 'node:assert/strict';
import { createAmbientController } from '../../src/audio/ambient.ts';
import type { SceneAudioEnvelope } from '../../src/audio/sceneAudio.ts';

test('ambient controller starts muted and toggles without autoplaying', async () => {
  let started = 0;
  let stopped = 0;
  let envelopeUpdates = 0;
  const controller = createAmbientController({
    start: async () => { started += 1; },
    stop: () => { stopped += 1; },
    setEnvelope: () => { envelopeUpdates += 1; },
  });
  const envelope: SceneAudioEnvelope = { lowHz: 55, highHz: 82.5, filterHz: 820, gain: .035, noise: .1 };
  assert.equal(controller.isEnabled(), false);
  controller.setEnvelope(envelope);
  assert.equal(started, 0);
  assert.equal(envelopeUpdates, 0);
  await controller.setEnabled(true);
  assert.equal(controller.isEnabled(), true);
  assert.equal(started, 1);
  assert.equal(envelopeUpdates, 1);
  await controller.setEnabled(false);
  assert.equal(controller.isEnabled(), false);
  assert.equal(stopped, 1);
});
