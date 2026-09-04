import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneIds } from '../../src/content/types.ts';
import { interactionImpulse } from '../../src/experience/interactions.ts';

test('interaction impulse changes by scene semantics', () => {
  assert.equal(interactionImpulse('dust', 'click', 0.5).kind, 'shockwave');
  assert.equal(interactionImpulse('collapse', 'move', 0.5).kind, 'gravity');
  assert.equal(interactionImpulse('fusion', 'move', 0.5).kind, 'ignition');
  assert.equal(interactionImpulse('main-sequence', 'move', 0.5).kind, 'radiation');
  assert.equal(interactionImpulse('red-giant', 'move', 0.5).kind, 'convection');
  assert.equal(interactionImpulse('nebula', 'move', 0.5).kind, 'gas-ripple');
  assert.equal(interactionImpulse('white-dwarf', 'move', 0.5).kind, 'dwarf-glow');
  assert.equal(interactionImpulse('black-hole', 'move', 0.5).kind, 'disk-disturbance');
});

test('all interaction strengths remain bounded by the active cinematic envelope', () => {
  for (const scene of sceneIds) {
    const result = interactionImpulse(scene, 'move', 4, 0.7);
    assert.ok(result.strength >= 0 && result.strength <= 0.7, `${scene}: ${result.strength}`);
  }
  assert.equal(interactionImpulse('dust', 'move', 0.5).kind, 'none');
});
