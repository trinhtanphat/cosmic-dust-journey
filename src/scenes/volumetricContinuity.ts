import type { MatterChannel, MatterState, VisualContinuityState } from '../experience/visualContinuity';

export type VolumetricQuality = 'full' | 'reduced' | 'minimal';

export interface VolumetricDepthBand {
  index: number;
  seed: number;
  depth: number;
  densityScale: number;
  opacityScale: number;
  turbulenceScale: number;
  countScale: number;
  spreadScale: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const emptyMatter = (channel: MatterChannel): MatterState => ({
  channel,
  amount: 0,
  density: 0,
  temperature: 0,
  turbulence: 0,
  expansion: 0,
});

export function matterChannel(
  continuity: VisualContinuityState | undefined,
  channel: MatterChannel,
): MatterState {
  return continuity?.matter.find((entry) => entry.channel === channel) ?? emptyMatter(channel);
}

export function volumetricQualityFromParticleCount(particleCount: number): VolumetricQuality {
  const safeCount = Number.isFinite(particleCount) ? Math.max(0, particleCount) : 0;
  if (safeCount >= 32000) return 'full';
  if (safeCount >= 12000) return 'reduced';
  return 'minimal';
}

export function resolveVolumetricBands(input: {
  seed: number;
  quality: VolumetricQuality;
  density: number;
  turbulence: number;
}): readonly VolumetricDepthBand[] {
  const safeSeed = Number.isFinite(input.seed) ? Math.trunc(input.seed) : 1776;
  const density = clamp(input.density, 0, 1);
  const turbulence = clamp(input.turbulence, 0, 1);
  const bands: readonly VolumetricDepthBand[] = [
    {
      index: 0,
      seed: safeSeed,
      depth: -0.8,
      densityScale: clamp(0.72 + density * 0.38, 0.08, 1.25),
      opacityScale: 1,
      turbulenceScale: turbulence,
      countScale: 0.72,
      spreadScale: 1,
    },
    {
      index: 1,
      seed: safeSeed + 8128,
      depth: 0.4,
      densityScale: clamp(0.5 + density * 0.28, 0.08, 1.25),
      opacityScale: 0.48,
      turbulenceScale: clamp(turbulence * 0.72, 0, 1),
      countScale: 0.2,
      spreadScale: 0.72,
    },
    {
      index: 2,
      seed: safeSeed + 3911,
      depth: 1.1,
      densityScale: clamp(0.34 + density * 0.2, 0.08, 1.25),
      opacityScale: 0.26,
      turbulenceScale: clamp(turbulence * 0.46, 0, 1),
      countScale: 0.1,
      spreadScale: 1.18,
    },
  ];
  const count = input.quality === 'full' ? 3 : input.quality === 'reduced' ? 2 : 1;
  return bands.slice(0, count);
}
