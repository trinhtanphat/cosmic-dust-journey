import { chapters } from '../content/chapters.ts';
import type { Vec3 } from './cinematic.ts';
import { cinematicProfiles } from './cinematicProfiles.ts';
import type { CameraPose } from './cameraTrack.ts';

export interface CameraSplineSample extends CameraPose {
  chapterIndex: number;
  chapterProgress: number;
}

interface CameraAnchor {
  position: Vec3;
  target: Vec3;
  fov: number;
  pointerInfluence: readonly [number, number];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const clampSigned = (value: number) => Math.min(1, Math.max(-1, Number.isFinite(value) ? value : 0));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const average = (a: number, b: number) => (a + b) * 0.5;
const average3 = (a: Vec3, b: Vec3): Vec3 => [average(a[0], b[0]), average(a[1], b[1]), average(a[2], b[2])];

const firstKeyframe = (chapterIndex: number) => {
  const profile = cinematicProfiles[chapters[chapterIndex]?.id ?? chapters[0].id];
  return profile.camera.keyframes[0];
};

const lastKeyframe = (chapterIndex: number) => {
  const profile = cinematicProfiles[chapters[chapterIndex]?.id ?? chapters[0].id];
  return profile.camera.keyframes[profile.camera.keyframes.length - 1];
};

function buildAnchors(): readonly CameraAnchor[] {
  const anchors: CameraAnchor[] = [];
  const firstProfile = cinematicProfiles[chapters[0].id];
  const first = firstKeyframe(0);
  anchors.push({
    position: first.position,
    target: first.target,
    fov: first.fov,
    pointerInfluence: firstProfile.camera.pointerInfluence,
  });
  for (let boundary = 1; boundary < chapters.length; boundary += 1) {
    const previous = lastKeyframe(boundary - 1);
    const next = firstKeyframe(boundary);
    const previousProfile = cinematicProfiles[chapters[boundary - 1].id];
    const nextProfile = cinematicProfiles[chapters[boundary].id];
    anchors.push({
      position: average3(previous.position, next.position),
      target: average3(previous.target, next.target),
      fov: average(previous.fov, next.fov),
      pointerInfluence: [
        average(previousProfile.camera.pointerInfluence[0], nextProfile.camera.pointerInfluence[0]),
        average(previousProfile.camera.pointerInfluence[1], nextProfile.camera.pointerInfluence[1]),
      ],
    });
  }
  const lastIndex = chapters.length - 1;
  const finalProfile = cinematicProfiles[chapters[lastIndex].id];
  const final = lastKeyframe(lastIndex);
  anchors.push({
    position: final.position,
    target: final.target,
    fov: final.fov,
    pointerInfluence: finalProfile.camera.pointerInfluence,
  });
  return anchors;
}

const anchors = buildAnchors();

function tangentScalar(previous: number, next: number, scale: number) {
  return (next - previous) * 0.5 * scale;
}

function hermiteScalar(p0: number, p1: number, previous: number, next: number, t: number, tangentScale: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  const m0 = tangentScalar(previous, p1, tangentScale);
  const m1 = tangentScalar(p0, next, tangentScale);
  return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
}

function hermite3(p0: Vec3, p1: Vec3, previous: Vec3, next: Vec3, t: number, tangentScale: number): Vec3 {
  return [
    hermiteScalar(p0[0], p1[0], previous[0], next[0], t, tangentScale),
    hermiteScalar(p0[1], p1[1], previous[1], next[1], t, tangentScale),
    hermiteScalar(p0[2], p1[2], previous[2], next[2], t, tangentScale),
  ];
}

export function sampleGlobalCameraSpline(input: {
  chapterIndex: number;
  localProgress: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
}): CameraSplineSample {
  const rawIndex = Number.isFinite(input.chapterIndex) ? Math.trunc(input.chapterIndex) : 0;
  const chapterIndex = Math.min(chapters.length - 1, Math.max(0, rawIndex));
  const t = clamp01(input.localProgress);
  const a0 = anchors[chapterIndex];
  const a1 = anchors[chapterIndex + 1] ?? a0;
  const previous = anchors[Math.max(0, chapterIndex - 1)] ?? a0;
  const next = anchors[Math.min(anchors.length - 1, chapterIndex + 2)] ?? a1;
  const tangentScale = input.reducedMotion ? 0.35 : 1;
  const basePosition = hermite3(a0.position, a1.position, previous.position, next.position, t, tangentScale);
  const target = hermite3(a0.target, a1.target, previous.target, next.target, t, tangentScale);
  const fov = hermiteScalar(a0.fov, a1.fov, previous.fov, next.fov, t, tangentScale);
  const influenceX = lerp(a0.pointerInfluence[0], a1.pointerInfluence[0], t);
  const influenceY = lerp(a0.pointerInfluence[1], a1.pointerInfluence[1], t);
  const pointerScale = input.reducedMotion ? 0.16 : 1;
  const px = clampSigned(input.pointer.x);
  const py = clampSigned(input.pointer.y);
  const profile = cinematicProfiles[chapters[chapterIndex].id];
  const micro = Math.sin(t * Math.PI) * profile.camera.microParallax * pointerScale;
  const position: Vec3 = [
    basePosition[0] + px * influenceX * pointerScale + micro,
    basePosition[1] + py * influenceY * pointerScale + micro * 0.5,
    basePosition[2],
  ];
  const adjustedTarget: Vec3 = [
    target[0] + px * influenceX * pointerScale * 0.18,
    target[1] + py * influenceY * pointerScale * 0.18,
    target[2],
  ];
  return { position, target: adjustedTarget, fov, chapterIndex, chapterProgress: t };
}
