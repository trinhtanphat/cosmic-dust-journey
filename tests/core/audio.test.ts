import test from 'node:test';
import assert from 'node:assert/strict';

test('ambient controller starts muted and toggles without autoplaying', async () => {
  const audio = await import('../../src/audio/ambient.ts').catch(() => null);
  assert.ok(audio, 'ambient controller should exist');
  let started = 0;
  let stopped = 0;
  const controller = audio!.createAmbientController({
    start: async () => { started += 1; },
    stop: () => { stopped += 1; },
  });
  assert.equal(controller.isEnabled(), false);
  assert.equal(started, 0);
  await controller.setEnabled(true);
  assert.equal(controller.isEnabled(), true);
  assert.equal(started, 1);
  await controller.setEnabled(false);
  assert.equal(controller.isEnabled(), false);
  assert.equal(stopped, 1);
});
