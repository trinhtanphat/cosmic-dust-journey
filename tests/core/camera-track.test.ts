import test from 'node:test';
import assert from 'node:assert/strict';
import type { CameraTrackSpec } from '../../src/experience/cinematic.ts';
import { sampleCameraTrack } from '../../src/experience/cameraTrack.ts';

const track: CameraTrackSpec = {
  keyframes: [
    { at: 0, position: [0,0,10], target: [0,0,0], fov: 46 },
    { at: 1, position: [0.2,0.1,8], target: [0,0,0], fov: 42 },
  ],
  pointerInfluence: [0.3,0.2],
  microParallax: 0.1,
  reducedMotionScale: 0.15,
};

test('camera interpolation clamps pointer and preserves fov bounds', () => {
  const pose = sampleCameraTrack(track, 0.5, { x: 9, y: -9 }, false);
  assert.ok(pose.position[0] <= 0.5 && pose.position[0] >= -0.5);
  assert.ok(pose.fov >= 42 && pose.fov <= 46);
});

test('reduced motion materially reduces pointer displacement', () => {
  const pose = sampleCameraTrack(track, 0.5, { x: 1, y: 1 }, false);
  const reduced = sampleCameraTrack(track, 0.5, { x: 1, y: 1 }, true);
  assert.ok(Math.abs(reduced.position[0] - 0.1) < Math.abs(pose.position[0] - 0.1));
});
