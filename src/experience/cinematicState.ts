import type { QualityProfile } from '../app/quality.ts';
import type { SceneId } from '../content/types.ts';
import { sampleCameraTrack, type CameraPose } from './cameraTrack.ts';
import { cinematicProfileFor, resolveCinematicPhase, type CinematicChapterProfile, type CinematicPhase } from './cinematic.ts';
import { resolvePostFx, type PostFxState } from './postfx.ts';
import { renderBudgetFor, type AdaptiveLevel, type RenderBudget } from './runtimeQuality.ts';
import { resolveTransition, type TransitionState } from './transitions.ts';

export interface CinematicState {
  profile: CinematicChapterProfile;
  phase: CinematicPhase;
  phaseProgress: number;
  camera: CameraPose;
  transition: TransitionState;
  budget: RenderBudget;
  postFx: PostFxState;
}

export function resolveCinematicState(input: {
  chapterId: string;
  scene: SceneId;
  localProgress: number;
  pointer: { x: number; y: number };
  quality: QualityProfile;
  adaptiveLevel: AdaptiveLevel;
}): CinematicState {
  const profile = cinematicProfileFor(input.chapterId);
  const resolvedPhase = resolveCinematicPhase(profile, input.localProgress);
  const camera = sampleCameraTrack(profile.camera, input.localProgress, input.pointer, input.quality.reducedMotion);
  const transition = resolveTransition(profile.transition, resolvedPhase.phase, resolvedPhase.phaseProgress, input.quality.reducedMotion);
  const budget = renderBudgetFor(input.quality, input.adaptiveLevel);
  const postFx = resolvePostFx(
    input.scene,
    resolvedPhase.phase,
    transition,
    profile.postFx,
    budget,
    input.quality.reducedMotion,
  );
  return {
    profile,
    phase: resolvedPhase.phase,
    phaseProgress: resolvedPhase.phaseProgress,
    camera,
    transition,
    budget,
    postFx,
  };
}
