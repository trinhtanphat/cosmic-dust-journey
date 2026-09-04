import { cinematicProfiles } from './cinematicProfiles.ts';

export type CinematicPhase = 'enter' | 'settle' | 'interact' | 'transition';
export type TransitionMode =
  | 'crossfade'
  | 'morph-density'
  | 'radial-collapse'
  | 'radial-expansion'
  | 'shell-ejection'
  | 'flash-cut'
  | 'dissolve-to-point'
  | 'accretion-warp';

export type Vec3 = readonly [number, number, number];

export interface PhaseStops {
  enterEnd: number;
  settleEnd: number;
  interactEnd: number;
}

export interface CameraKeyframe {
  at: number;
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface CameraTrackSpec {
  keyframes: readonly CameraKeyframe[];
  pointerInfluence: readonly [number, number];
  microParallax: number;
  reducedMotionScale: number;
}

export interface PostFxIntent {
  bloom: number;
  exposure: number;
  vignette: number;
  chromaticFringe: number;
}

export interface CinematicChapterProfile {
  chapterId: string;
  transition: TransitionMode;
  phaseStops: PhaseStops;
  camera: CameraTrackSpec;
  postFx: PostFxIntent;
  particleMultiplier: number;
  interactionMax: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function resolveCinematicPhase(profile: CinematicChapterProfile, localProgress: number) {
  const p = clamp01(localProgress);
  const { enterEnd, settleEnd, interactEnd } = profile.phaseStops;
  if (!(0 < enterEnd && enterEnd < settleEnd && settleEnd < interactEnd && interactEnd < 1)) {
    throw new Error(`Invalid cinematic phase stops for ${profile.chapterId}.`);
  }
  if (p < enterEnd) return { phase: 'enter' as const, phaseProgress: p / enterEnd };
  if (p < settleEnd) return { phase: 'settle' as const, phaseProgress: (p - enterEnd) / (settleEnd - enterEnd) };
  if (p < interactEnd) return { phase: 'interact' as const, phaseProgress: (p - settleEnd) / (interactEnd - settleEnd) };
  return { phase: 'transition' as const, phaseProgress: (p - interactEnd) / (1 - interactEnd) };
}

export function cinematicProfileFor(chapterId: string): CinematicChapterProfile {
  const profile = cinematicProfiles[chapterId];
  if (!profile) throw new Error(`Missing cinematic profile: ${chapterId}`);
  return profile;
}
