import type { VisualContinuityState } from '../experience/visualContinuity';

export interface StellarSurfaceFallback {
  radius: number;
  luminosity: number;
  hue: number;
  turbulence: number;
  limbGlow: number;
}

export interface StellarSurfaceIntent extends StellarSurfaceFallback {
  qualityScale: number;
  noiseOctaves: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const clamp01 = (value: number) => clamp(value, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

function normalizedQuality(value: number) {
  return clamp(value, 0.35, 1);
}

function detailFor(qualityScale: number) {
  if (qualityScale >= 0.85) return 5;
  if (qualityScale >= 0.62) return 4;
  return 3;
}

function safeFallback(fallback: StellarSurfaceFallback): StellarSurfaceFallback {
  return {
    radius: clamp(fallback.radius, 0.01, 12),
    luminosity: clamp(fallback.luminosity, 0, 12),
    hue: clamp01(fallback.hue),
    turbulence: clamp01(fallback.turbulence),
    limbGlow: clamp(fallback.limbGlow, 0, 3),
  };
}

export function resolveStellarSurfaceIntent(input: {
  continuity?: VisualContinuityState;
  fallback: StellarSurfaceFallback;
  qualityScale: number;
}): StellarSurfaceIntent {
  const qualityScale = normalizedQuality(input.qualityScale);
  const fallback = safeFallback(input.fallback);
  const continuity = input.continuity;

  if (!continuity || (continuity.currentScene !== 'main-sequence' && continuity.currentScene !== 'red-giant')) {
    return {
      ...fallback,
      qualityScale,
      noiseOctaves: detailFor(qualityScale),
    };
  }

  const envelope = continuity.matter.find((item) => item.channel === 'envelope');
  const giantProgress = continuity.currentScene === 'red-giant'
    ? clamp01(((envelope?.expansion ?? 0.58) - 0.58) / 0.42)
    : 0;

  return {
    radius: lerp(1.35, 5.5, giantProgress),
    luminosity: lerp(3.4, 2.2, giantProgress),
    hue: lerp(0.1, 0.015, giantProgress),
    turbulence: lerp(0.54, 0.92, giantProgress),
    limbGlow: lerp(1.1, 1.6, giantProgress),
    qualityScale,
    noiseOctaves: detailFor(qualityScale),
  };
}
