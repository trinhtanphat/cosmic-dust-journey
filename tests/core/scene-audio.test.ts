import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneAudioEnvelope } from '../../src/audio/sceneAudio.ts';
import { sceneIds } from '../../src/content/types.ts';

test('scene audio envelopes are bounded and distinguish stable star from black hole', () => {
  const main = sceneAudioEnvelope('main-sequence', .5);
  const black = sceneAudioEnvelope('black-hole', .5);
  assert.ok(black.lowHz < main.lowHz);
  assert.ok(main.gain >= 0 && main.gain <= .06);
  for (const scene of sceneIds) {
    const envelope = sceneAudioEnvelope(scene, 2);
    assert.ok(envelope.lowHz >= 24 && envelope.highHz <= 480);
    assert.ok(envelope.filterHz >= 180 && envelope.filterHz <= 2400);
    assert.ok(envelope.gain >= 0 && envelope.gain <= .06);
    assert.ok(envelope.noise >= 0 && envelope.noise <= 1);
  }
});
