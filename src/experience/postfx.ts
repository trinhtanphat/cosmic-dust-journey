import type { SceneId } from '../content/types.ts';
import type { CinematicPhase, PostFxIntent } from './cinematic.ts';
import type { RenderBudget } from './runtimeQuality.ts';
import type { TransitionState } from './transitions.ts';

export interface PostFxState {
  enabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  exposure: number;
  vignetteOpacity: number;
  chromaticFringe: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export function resolvePostFx(
  scene: SceneId,
  phase: CinematicPhase,
  transition: TransitionState,
  intent: PostFxIntent,
  budget: RenderBudget,
  reducedMotion: boolean,
): PostFxState {
  const enabled = budget.postprocessing && !reducedMotion;
  if (!enabled) {
    return {
      enabled: false,
      bloomStrength: 0,
      bloomRadius: 0,
      bloomThreshold: 1,
      exposure: 1,
      vignetteOpacity: clamp(intent.vignette, 0, 1),
      chromaticFringe: 0,
    };
  }

  const energetic = scene === 'fusion' || scene === 'black-hole';
  const transitionEnergy = transition.flash * 0.65 + transition.warp * 0.3;
  const bloomStrength = clamp(intent.bloom + transitionEnergy, 0, 1.45);
  const chromaticAllowed = energetic && phase === 'transition';
  return {
    enabled: true,
    bloomStrength,
    bloomRadius: clamp(0.22 + bloomStrength * 0.34, 0, 0.72),
    bloomThreshold: clamp(0.72 - bloomStrength * 0.18, 0.32, 0.9),
    exposure: clamp(intent.exposure + transition.flash * 0.08, 0.78, 1.28),
    vignetteOpacity: clamp(intent.vignette, 0, 1),
    chromaticFringe: chromaticAllowed ? clamp(intent.chromaticFringe + transitionEnergy * 0.04, 0, 0.12) : 0,
  };
}
