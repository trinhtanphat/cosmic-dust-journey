import { describe, expect, test } from 'vitest';
import { resolveVisualContinuity } from '../src/experience/visualContinuity';

const loadLensing = async () => {
  const module = await import('../src/shaders/blackHoleLensing').catch(() => null);
  expect(module).not.toBeNull();
  return module!;
};

describe('V3 bounded black-hole lensing', () => {
  test('lensing peaks near the center and decays without exceeding bounds', async () => {
    const lensing = await loadLensing();
    const continuity = resolveVisualContinuity({ chapterIndex: 8, localProgress: 0.7, reducedMotion: false });
    const center = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 0.05, qualityScale: 1, reducedMotion: false, baseWarp: 0.9 });
    const edge = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 1, qualityScale: 1, reducedMotion: false, baseWarp: 0.9 });
    expect(center.lensing).toBeGreaterThan(edge.lensing);
    expect(center.lensing).toBeLessThanOrEqual(1);
    expect(edge.lensing).toBeGreaterThanOrEqual(0);
  });

  test('low quality disables secondary distortion while preserving the primary silhouette', async () => {
    const lensing = await loadLensing();
    const continuity = resolveVisualContinuity({ chapterIndex: 8, localProgress: 0.5, reducedMotion: false });
    const full = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 0.3, qualityScale: 1, reducedMotion: false, baseWarp: 0.8 });
    const low = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 0.3, qualityScale: 0.4, reducedMotion: false, baseWarp: 0.8 });
    expect(full.secondaryDistortion).toBe(true);
    expect(low.secondaryDistortion).toBe(false);
    expect(low.lensing).toBeGreaterThan(0);
    expect(low.accretionAmount).toBe(full.accretionAmount);
  });

  test('reduced motion lowers warp amplitude without changing accretion topology', async () => {
    const lensing = await loadLensing();
    const continuity = resolveVisualContinuity({ chapterIndex: 8, localProgress: 0.8, reducedMotion: false });
    const normal = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 0.2, qualityScale: 1, reducedMotion: false, baseWarp: 0.95 });
    const reduced = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 0.2, qualityScale: 1, reducedMotion: true, baseWarp: 0.95 });
    expect(reduced.warp).toBeLessThan(normal.warp);
    expect(reduced.accretionAmount).toBe(normal.accretionAmount);
  });

  test('white-dwarf remnant cannot feed the alternate black-hole accretion branch', async () => {
    const lensing = await loadLensing();
    const continuity = resolveVisualContinuity({ chapterIndex: 7, localProgress: 1, reducedMotion: false });
    const remnant = continuity.matter.find((item) => item.channel === 'remnant');
    expect(remnant?.amount ?? 0).toBeGreaterThan(0);
    const value = lensing.resolveBlackHoleLensingIntent({ continuity, radiusNorm: 0.2, qualityScale: 1, reducedMotion: false, baseWarp: 0.7 });
    expect(value.accretionAmount).toBe(0);
  });
});
