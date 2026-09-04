import type { QualityProfile } from '../app/quality.ts';

export type AdaptiveLevel = 0 | 1 | 2 | 3;

export interface RuntimeQualityState {
  level: AdaptiveLevel;
  slowFrames: number;
  fastFrames: number;
}

export interface RenderBudget {
  dpr: number;
  particleBudget: number;
  postprocessing: boolean;
  secondaryLayers: boolean;
  shaderComplexity: 'full' | 'reduced';
}

const clampLevel = (value: number): AdaptiveLevel => Math.min(3, Math.max(0, Math.round(value))) as AdaptiveLevel;

export function createRuntimeQualityState(): RuntimeQualityState {
  return { level: 0, slowFrames: 0, fastFrames: 0 };
}

export function observeFrame(state: RuntimeQualityState, frameMs: number): RuntimeQualityState {
  const ms = Number.isFinite(frameMs) ? Math.max(0, frameMs) : 1000;
  let { level, slowFrames, fastFrames } = state;

  if (ms >= 24) {
    slowFrames += 1;
    fastFrames = 0;
    if (slowFrames >= 45) {
      level = clampLevel(level + 1);
      slowFrames = 0;
    }
  } else if (ms <= 17) {
    fastFrames += 1;
    slowFrames = 0;
    if (fastFrames >= 240) {
      level = clampLevel(level - 1);
      fastFrames = 0;
    }
  } else {
    fastFrames = 0;
  }

  return { level, slowFrames, fastFrames };
}

export function renderBudgetFor(profile: QualityProfile, level: AdaptiveLevel): RenderBudget {
  const base: RenderBudget = {
    dpr: profile.dpr,
    particleBudget: profile.particleBudget,
    postprocessing: profile.postprocessing && !profile.reducedMotion,
    secondaryLayers: true,
    shaderComplexity: 'full',
  };
  if (profile.reducedMotion) {
    base.postprocessing = false;
  }
  if (level === 0) return base;
  if (level === 1) return { ...base, postprocessing: false };
  if (level === 2) {
    return {
      ...base,
      postprocessing: false,
      particleBudget: Math.max(4000, Math.floor(base.particleBudget * 0.64)),
    };
  }
  return {
    ...base,
    dpr: Math.min(1.1, base.dpr),
    particleBudget: Math.max(2800, Math.floor(base.particleBudget * 0.42)),
    postprocessing: false,
    secondaryLayers: false,
    shaderComplexity: 'reduced',
  };
}
