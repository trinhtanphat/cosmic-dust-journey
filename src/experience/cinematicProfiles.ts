import type { CameraTrackSpec, CinematicChapterProfile, PostFxIntent, TransitionMode } from './cinematic.ts';

const post = (bloom: number, exposure = 1, vignette = 0.45, chromaticFringe = 0): PostFxIntent => ({
  bloom,
  exposure,
  vignette,
  chromaticFringe,
});

const track = (
  start: readonly [number, number, number],
  end: readonly [number, number, number],
  fovStart: number,
  fovEnd: number,
  pointerInfluence: readonly [number, number] = [0.28, 0.18],
  microParallax = 0.08,
  reducedMotionScale = 0.16,
): CameraTrackSpec => ({
  keyframes: [
    { at: 0, position: start, target: [0, 0, 0], fov: fovStart },
    { at: 1, position: end, target: [0, 0, 0], fov: fovEnd },
  ],
  pointerInfluence,
  microParallax,
  reducedMotionScale,
});

function profile(
  chapterId: string,
  transition: TransitionMode,
  camera: CameraTrackSpec,
  postFx: PostFxIntent,
  interactionMax: number,
  particleMultiplier = 1,
): CinematicChapterProfile {
  if (camera.keyframes.length < 2 || camera.keyframes.some((keyframe, index) => index > 0 && keyframe.at <= camera.keyframes[index - 1].at)) {
    throw new Error(`Invalid camera keyframes for ${chapterId}.`);
  }
  return {
    chapterId,
    transition,
    phaseStops: { enterEnd: 0.16, settleEnd: 0.42, interactEnd: 0.82 },
    camera,
    postFx,
    particleMultiplier,
    interactionMax: Math.min(1, Math.max(0, interactionMax)),
  };
}

export const cinematicProfiles: Readonly<Record<string, CinematicChapterProfile>> = {
  overture: profile('overture', 'morph-density', track([0, 0.15, 11.2], [0.1, 0, 9.6], 50, 46), post(0.22, 0.94, 0.58), 1, 1.05),
  'cold-cloud': profile('cold-cloud', 'radial-collapse', track([0.15, 0.08, 10], [0, 0, 8.8], 47, 44), post(0.28, 0.96, 0.55), 0.78, 1.08),
  collapse: profile('collapse', 'flash-cut', track([0.2, 0.08, 9.2], [0, -0.05, 6.7], 46, 40, [0.34, 0.2], 0.1), post(0.48, 1.02, 0.5, 0.04), 1, 1.12),
  ignition: profile('ignition', 'crossfade', track([0, 0, 6.8], [0, 0, 7.5], 39, 45, [0.2, 0.12], 0.05), post(0.92, 1.12, 0.38, 0.08), 0.72, 1.04),
  'main-sequence': profile('main-sequence', 'radial-expansion', track([0.05, 0.04, 8.2], [0.14, -0.02, 8], 44, 43, [0.22, 0.12], 0.04), post(0.64, 1.04, 0.42), 0.8, 1),
  'red-giant': profile('red-giant', 'shell-ejection', track([0.1, 0.02, 8.3], [0, 0, 12.2], 45, 51, [0.16, 0.1], 0.05), post(0.72, 1, 0.5, 0.02), 0.7, 0.92),
  shedding: profile('shedding', 'dissolve-to-point', track([0, 0, 12.5], [0.2, 0.08, 15.4], 50, 54, [0.14, 0.08], 0.04), post(0.5, 0.98, 0.46), 0.62, 1.08),
  'white-dwarf': profile('white-dwarf', 'crossfade', track([0.1, 0.04, 10.2], [0, 0, 9.2], 46, 43, [0.08, 0.05], 0.02), post(0.58, 1.05, 0.5), 0.35, 0.76),
  elsewhere: profile('elsewhere', 'accretion-warp', track([0.6, 1.0, 10.5], [0.25, 0.55, 8.1], 51, 44, [0.3, 0.18], 0.07), post(0.82, 1.02, 0.6, 0.1), 0.8, 0.88),
  epilogue: profile('epilogue', 'crossfade', track([0.1, 0.05, 9.5], [0.25, 0.25, 12.8], 45, 52, [0.08, 0.05], 0.02), post(0.18, 0.92, 0.62), 0.2, 0.7),
};
