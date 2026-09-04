import { describe, expect, test } from 'vitest';
import { resolveVisualContinuity } from '../src/experience/visualContinuity';

const loadSurface = async () => {
  const module = await import('../src/shaders/stellarSurface').catch(() => null);
  expect(module).not.toBeNull();
  return module!;
};

const fallback = { radius: 1.35, luminosity: 3.4, hue: 0.1, turbulence: 0.54, limbGlow: 1.1 };

describe('V3 shared stellar surface', () => {
  test('main-sequence late and red-giant early resolve the same primary surface intent', async () => {
    const surface = await loadSurface();
    const main = surface.resolveStellarSurfaceIntent({
      continuity: resolveVisualContinuity({ chapterIndex: 4, localProgress: 1, reducedMotion: false }),
      fallback,
      qualityScale: 1,
    });
    const giant = surface.resolveStellarSurfaceIntent({
      continuity: resolveVisualContinuity({ chapterIndex: 5, localProgress: 0, reducedMotion: false }),
      fallback: { ...fallback, radius: 1.5, luminosity: 3.1, hue: 0.015, turbulence: 0.62, limbGlow: 1.6 },
      qualityScale: 1,
    });
    expect(giant.radius).toBeCloseTo(main.radius, 8);
    expect(giant.luminosity).toBeCloseTo(main.luminosity, 8);
    expect(giant.hue).toBeCloseTo(main.hue, 8);
    expect(giant.turbulence).toBeCloseTo(main.turbulence, 8);
  });

  test('red-giant evolution expands and cools the same surface vocabulary', async () => {
    const surface = await loadSurface();
    const start = surface.resolveStellarSurfaceIntent({
      continuity: resolveVisualContinuity({ chapterIndex: 5, localProgress: 0, reducedMotion: false }),
      fallback,
      qualityScale: 1,
    });
    const end = surface.resolveStellarSurfaceIntent({
      continuity: resolveVisualContinuity({ chapterIndex: 5, localProgress: 1, reducedMotion: false }),
      fallback,
      qualityScale: 1,
    });
    expect(end.radius).toBeGreaterThan(start.radius);
    expect(end.hue).toBeLessThan(start.hue);
    expect(end.turbulence).toBeGreaterThan(start.turbulence);
  });

  test('quality only lowers surface detail, not radius/color/luminosity continuity', async () => {
    const surface = await loadSurface();
    const continuity = resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.63, reducedMotion: false });
    const full = surface.resolveStellarSurfaceIntent({ continuity, fallback, qualityScale: 1 });
    const low = surface.resolveStellarSurfaceIntent({ continuity, fallback, qualityScale: 0.42 });
    expect(low.radius).toBe(full.radius);
    expect(low.hue).toBe(full.hue);
    expect(low.luminosity).toBe(full.luminosity);
    expect(low.noiseOctaves).toBeLessThan(full.noiseOctaves);
    expect(low.qualityScale).toBeLessThan(full.qualityScale);
  });

  test('falls back safely when continuity is absent', async () => {
    const surface = await loadSurface();
    const value = surface.resolveStellarSurfaceIntent({ continuity: undefined, fallback, qualityScale: Number.NaN });
    expect(value.radius).toBe(fallback.radius);
    expect(value.luminosity).toBe(fallback.luminosity);
    expect(value.hue).toBe(fallback.hue);
    expect(value.qualityScale).toBeGreaterThan(0);
  });
});
