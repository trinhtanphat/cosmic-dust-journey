import { describe, expect, test } from 'vitest';

const loadVolumetric = async () => {
  const module = await import('../src/scenes/volumetricContinuity').catch(() => null);
  expect(module).not.toBeNull();
  return module!;
};

describe('V3 volumetric continuity', () => {
  test('full quality resolves three deterministic depth bands', async () => {
    const volumetric = await loadVolumetric();
    const input = { seed: 1701, quality: 'full' as const, density: 0.82, turbulence: 0.67 };
    const first = volumetric.resolveVolumetricBands(input);
    const second = volumetric.resolveVolumetricBands(input);
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(new Set(first.map((band: { seed: number }) => band.seed)).size).toBe(3);
    expect(first[0].depth).toBeLessThan(first[1].depth);
    expect(first[1].depth).toBeLessThan(first[2].depth);
  });

  test('adaptive quality reduces secondary layers while preserving the primary silhouette', async () => {
    const volumetric = await loadVolumetric();
    const full = volumetric.resolveVolumetricBands({ seed: 8128, quality: 'full', density: 0.65, turbulence: 0.5 });
    const reduced = volumetric.resolveVolumetricBands({ seed: 8128, quality: 'reduced', density: 0.65, turbulence: 0.5 });
    const minimal = volumetric.resolveVolumetricBands({ seed: 8128, quality: 'minimal', density: 0.65, turbulence: 0.5 });
    expect(reduced).toHaveLength(2);
    expect(minimal).toHaveLength(1);
    expect(reduced[0].seed).toBe(full[0].seed);
    expect(minimal[0].seed).toBe(full[0].seed);
    expect(minimal[0].depth).toBe(full[0].depth);
  });

  test('clamps invalid density and turbulence into bounded render descriptors', async () => {
    const volumetric = await loadVolumetric();
    const bands = volumetric.resolveVolumetricBands({
      seed: Number.NaN,
      quality: 'full',
      density: Number.POSITIVE_INFINITY,
      turbulence: -99,
    });
    for (const band of bands) {
      expect(band.densityScale).toBeGreaterThanOrEqual(0.08);
      expect(band.densityScale).toBeLessThanOrEqual(1.25);
      expect(band.turbulenceScale).toBeGreaterThanOrEqual(0);
      expect(band.turbulenceScale).toBeLessThanOrEqual(1);
      expect(Number.isFinite(band.seed)).toBe(true);
    }
  });

  test('reads semantic matter channels without changing transfer topology', async () => {
    const volumetric = await loadVolumetric();
    const { resolveVisualContinuity } = await import('../src/experience/visualContinuity');
    const continuity = resolveVisualContinuity({ chapterIndex: 6, localProgress: 0.95, reducedMotion: false });
    const before = continuity.blend.transfer;
    const ejecta = volumetric.matterChannel(continuity, 'ejecta');
    const remnant = volumetric.matterChannel(continuity, 'remnant');
    expect(ejecta.amount).toBeGreaterThan(0.15);
    expect(remnant.amount).toBeGreaterThan(0.3);
    expect(continuity.blend.transfer).toBe(before);
  });
});
