export type QualityTier = 'low' | 'medium' | 'high';

export interface QualityInput {
  dpr: number;
  reducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  width: number;
}

export interface QualityProfile {
  tier: QualityTier;
  dpr: number;
  particleBudget: number;
  reducedMotion: boolean;
  postprocessing: boolean;
}

export function detectQuality(input: QualityInput): QualityProfile {
  const memory = input.deviceMemory ?? 8;
  const cores = input.hardwareConcurrency ?? 8;
  const constrained = input.reducedMotion || input.width < 640 || memory <= 4 || cores <= 4;
  if (constrained) {
    return { tier: 'low', dpr: 1, particleBudget: 9000, reducedMotion: input.reducedMotion, postprocessing: false };
  }
  const high = input.width >= 1100 && memory >= 8 && cores >= 8;
  if (high) {
    return { tier: 'high', dpr: Math.min(1.75, Math.max(1, input.dpr)), particleBudget: 64000, reducedMotion: false, postprocessing: true };
  }
  return { tier: 'medium', dpr: Math.min(1.4, Math.max(1, input.dpr)), particleBudget: 28000, reducedMotion: false, postprocessing: false };
}

export function detectBrowserQuality(): QualityProfile {
  if (typeof window === 'undefined') {
    return detectQuality({ dpr: 1, reducedMotion: false, width: 1280, deviceMemory: 8, hardwareConcurrency: 8 });
  }
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  return detectQuality({
    dpr: window.devicePixelRatio || 1,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    deviceMemory: navigatorWithMemory.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    width: window.innerWidth,
  });
}
