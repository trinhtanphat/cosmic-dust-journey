import test from 'node:test';
import assert from 'node:assert/strict';
import { createAmbientController } from '../../src/audio/ambient.ts';
import type { SceneAudioEnvelope } from '../../src/audio/sceneAudio.ts';

test('ambient controller starts muted and toggles without autoplaying', async () => {
  let started = 0; let stopped = 0; let envelopeUpdates = 0;
  const controller=createAmbientController({start:async()=>{started++},stop:()=>{stopped++},setEnvelope:()=>{envelopeUpdates++}});
  const envelope: SceneAudioEnvelope={lowHz:55,highHz:82.5,filterHz:820,gain:.035,noise:.1};
  assert.equal(controller.isEnabled(),false); controller.setEnvelope(envelope); assert.equal(started,0);assert.equal(envelopeUpdates,0);await controller.setEnabled(true);assert.equal(started,1);assert.equal(envelopeUpdates,1);await controller.setEnabled(false);assert.equal(stopped,1);
});
test('ambient controller is idempotent across repeated enable disable and dispose',async()=>{let started=0,stopped=0,disposed=0;const controller=createAmbientController({start:async()=>{started++},stop:()=>{stopped++},dispose:()=>{disposed++}});await controller.setEnabled(true);await controller.setEnabled(true);assert.equal(started,1);await controller.setEnabled(false);await controller.setEnabled(false);assert.equal(stopped,1);controller.dispose();controller.dispose();assert.equal(disposed,1);assert.equal(stopped,1);});
test('driver lifecycle notifications never cause controller autoplay by themselves',async()=>{let started=0;let listener:((state:'idle'|'running'|'suspended'|'interrupted'|'stopped')=>void)|undefined;const controller=createAmbientController({start:async()=>{started++},stop:()=>undefined,onStateChange:(next)=>{listener=next;return()=>{listener=undefined}}});listener?.('suspended');listener?.('interrupted');assert.equal(started,0);assert.equal(controller.isEnabled(),false);});
