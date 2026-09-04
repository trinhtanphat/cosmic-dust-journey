import type { CameraTrackSpec, Vec3 } from './cinematic.ts';

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const clampSigned = (v: number) => Math.min(1, Math.max(-1, Number.isFinite(v) ? v : 0));
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function sampleCameraTrack(
  track: CameraTrackSpec,
  progress: number,
  pointer: { x: number; y: number },
  reducedMotion: boolean,
): CameraPose {
  if (track.keyframes.length < 2) throw new Error('Camera track requires at least two keyframes.');
  const p = clamp01(progress);
  const last = track.keyframes[track.keyframes.length - 1];
  let left = track.keyframes[0];
  let right = last;
  for (let i = 0; i < track.keyframes.length - 1; i += 1) {
    if (p <= track.keyframes[i + 1].at) {
      left = track.keyframes[i];
      right = track.keyframes[i + 1];
      break;
    }
  }
  const span = Math.max(Number.EPSILON, right.at - left.at);
  const t = smoothstep((p - left.at) / span);
  const basePosition = lerp3(left.position, right.position, t);
  const baseTarget = lerp3(left.target, right.target, t);
  const motionScale = reducedMotion ? track.reducedMotionScale : 1;
  const px = clampSigned(pointer.x);
  const py = clampSigned(pointer.y);
  const micro = Math.sin(p * Math.PI * 2) * track.microParallax * motionScale;
  const position: Vec3 = [
    basePosition[0] + px * track.pointerInfluence[0] * motionScale + micro,
    basePosition[1] + py * track.pointerInfluence[1] * motionScale + micro * 0.5,
    basePosition[2],
  ];
  const target: Vec3 = [
    baseTarget[0] + px * track.pointerInfluence[0] * motionScale * 0.18,
    baseTarget[1] + py * track.pointerInfluence[1] * motionScale * 0.18,
    baseTarget[2],
  ];
  return { position, target, fov: lerp(left.fov, right.fov, t) };
}
