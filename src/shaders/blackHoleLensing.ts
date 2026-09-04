import type { VisualContinuityState } from '../experience/visualContinuity';

export interface BlackHoleLensingIntent {
  lensing: number;
  warp: number;
  accretionAmount: number;
  secondaryDistortion: boolean;
  innerTemperature: number;
  outerTemperature: number;
  brightnessSkew: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const clamp01 = (value: number) => clamp(value, 0, 1);

export function resolveBlackHoleLensingIntent(input: {
  continuity?: VisualContinuityState;
  radiusNorm: number;
  qualityScale: number;
  reducedMotion: boolean;
  baseWarp: number;
}): BlackHoleLensingIntent {
  const radius = clamp01(input.radiusNorm);
  const qualityScale = clamp(input.qualityScale, 0.35, 1);
  const accretion = input.continuity?.matter.find((item) => item.channel === 'accretion');
  const accretionAmount = clamp01(accretion?.amount ?? 0);
  const centerFalloff = (1 - radius) * (1 - radius);
  const lensing = clamp((0.34 + accretionAmount * 0.58) * centerFalloff, 0, 1);
  const motionScale = input.reducedMotion ? 0.42 : 1;
  const warp = clamp01(input.baseWarp) * motionScale;

  return {
    lensing,
    warp,
    accretionAmount,
    secondaryDistortion: qualityScale >= 0.7 && !input.reducedMotion,
    innerTemperature: clamp(0.78 + accretionAmount * 0.22, 0, 1),
    outerTemperature: clamp(0.28 + accretionAmount * 0.35, 0, 1),
    brightnessSkew: clamp((0.16 + accretionAmount * 0.34) * (input.reducedMotion ? 0.7 : 1), 0, 0.6),
  };
}
