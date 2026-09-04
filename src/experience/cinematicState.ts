import type { QualityProfile } from '../app/quality.ts';
import type { SceneId } from '../content/types.ts';
import { sampleCameraTrack, type CameraPose } from './cameraTrack.ts';
import { cinematicProfileFor, resolveCinematicPhase, type CinematicChapterProfile, type CinematicPhase } from './cinematic.ts';
import { resolvePostFx, type PostFxState } from './postfx.ts';
import { renderBudgetFor, type AdaptiveLevel, type RenderBudget } from './runtimeQuality.ts';
import { resolveTransition, type TransitionState } from './transitions.ts';
import type { VisualContinuityState } from './visualContinuity.ts';

export interface CinematicState {
  profile: CinematicChapterProfile;
  phase: CinematicPhase;
  phaseProgress: number;
  camera: CameraPose;
  transition: TransitionState;
  budget: RenderBudget;
  postFx: PostFxState;
  continuity?: VisualContinuityState;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

function applyContinuityEnergy(
  state: PostFxState,
  continuity: VisualContinuityState | undefined,
  budget: RenderBudget,
): PostFxState {
  if (!continuity || !state.enabled || !budget.postprocessing) return state;
  const { energy } = continuity;
  const bloomStrength = clamp(state.bloomStrength + energy.bloomBias + Math.max(0, energy.luminosity - 0.8) * 0.05, 0, 1.45);
  return {
    ...state,
    bloomStrength,
    bloomRadius: clamp(state.bloomRadius + energy.bloomBias * 0.08, 0, 0.72),
    bloomThreshold: clamp(state.bloomThreshold - Math.max(0, energy.bloomBias) * 0.06, 0.32, 0.9),
    exposure: clamp(state.exposure + energy.exposureBias, 0.78, 1.28),
    chromaticFringe: clamp(state.chromaticFringe + energy.chromaticBias * 0.35, 0, 0.12),
  };
}

export function resolveCinematicState(input: {
  chapterId: string;
  scene: SceneId;
  localProgress: number;
  pointer: { x: number; y: number };
  quality: QualityProfile;
  adaptiveLevel: AdaptiveLevel;
  continuity?: VisualContinuityState;
}): CinematicState {
  const profile = cinematicProfileFor(input.chapterId);
  const resolvedPhase = resolveCinematicPhase(profile, input.localProgress);
  const camera = sampleCameraTrack(profile.camera, input.localProgress, input.pointer, input.quality.reducedMotion);
  const transition = resolveTransition(profile.transition, resolvedPhase.phase, resolvedPhase.phaseProgress, input.quality.reducedMotion);
  const budget = renderBudgetFor(input.quality, input.adaptiveLevel);
  const basePostFx = resolvePostFx(
    input.scene,
    resolvedPhase.phase,
    transition,
    profile.postFx,
    budget,
    input.quality.reducedMotion,
  );
  const postFx = applyContinuityEnergy(basePostFx, input.continuity, budget);
  return {
    profile,
    phase: resolvedPhase.phase,
    phaseProgress: resolvedPhase.phaseProgress,
    camera,
    transition,
    budget,
    postFx,
    continuity: input.continuity,
  };
}
