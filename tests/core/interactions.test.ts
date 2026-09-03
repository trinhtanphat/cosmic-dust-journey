import test from 'node:test';
import assert from 'node:assert/strict';

test('interaction impulse changes by scene semantics', async () => {
  const interactions = await import('../../src/experience/interactions.ts').catch(() => null);
  assert.ok(interactions, 'interactions module should exist');
  assert.equal(interactions!.interactionImpulse('dust', 'click', 0.5).kind, 'shockwave');
  assert.equal(interactions!.interactionImpulse('collapse', 'move', 0.5).kind, 'gravity');
  assert.equal(interactions!.interactionImpulse('main-sequence', 'move', 0.5).kind, 'radiation');
  assert.equal(interactions!.interactionImpulse('black-hole', 'move', 0.5).kind, 'disk-disturbance');
  assert.equal(interactions!.interactionImpulse('white-dwarf', 'move', 0.5).kind, 'none');
});
