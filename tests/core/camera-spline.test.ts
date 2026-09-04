import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleGlobalCameraSpline } from '../../src/experience/cameraSpline.ts';

const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(...a.map((value, index) => value - b[index]));

test('global camera spline shares exact boundary poses', () => {
  for (let chapterIndex = 0; chapterIndex < 9; chapterIndex += 1) {
    const outgoing = sampleGlobalCameraSpline({ chapterIndex, localProgress: 1, pointer: { x: 0, y: 0 }, reducedMotion: false });
    const incoming = sampleGlobalCameraSpline({ chapterIndex: chapterIndex + 1, localProgress: 0, pointer: { x: 0, y: 0 }, reducedMotion: false });
    assert.ok(distance(outgoing.position, incoming.position) < 1e-8);
    assert.ok(distance(outgoing.target, incoming.target) < 1e-8);
    assert.ok(Math.abs(outgoing.fov - incoming.fov) < 1e-8);
  }
});

test('reduced motion lowers pointer displacement without moving the shared route', () => {
  const base = sampleGlobalCameraSpline({ chapterIndex: 4, localProgress: 0.5, pointer: { x: 0, y: 0 }, reducedMotion: false });
  const normal = sampleGlobalCameraSpline({ chapterIndex: 4, localProgress: 0.5, pointer: { x: 1, y: 1 }, reducedMotion: false });
  const reduced = sampleGlobalCameraSpline({ chapterIndex: 4, localProgress: 0.5, pointer: { x: 1, y: 1 }, reducedMotion: true });
  assert.ok(distance(reduced.position, base.position) < distance(normal.position, base.position));
});
