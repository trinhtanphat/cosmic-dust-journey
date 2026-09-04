import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { chapters } from '../src/content/chapters';
import { resolveCinematicState } from '../src/experience/cinematicState';
import { resolveVisualContinuity } from '../src/experience/visualContinuity';

const highQuality = { tier: 'high' as const, dpr: 1.5, particleBudget: 64000, reducedMotion: false, postprocessing: true };
const lowQuality = { tier: 'low' as const, dpr: 1, particleBudget: 9000, reducedMotion: false, postprocessing: false };
const narrativeHash = 'ac657fe2fad3b2e92d509ebea61a8984796e0b5f89793c445d030387ef568cab';

function frozenNarrativeHash() {
  const narrative = chapters.map(({ id, eyebrow, title, body, interactionCue, clockLabel, scene }) => ({
    id,
    eyebrow,
    title,
    body,
    interactionCue,
    clockLabel,
    scene,
  }));
  return createHash('sha256').update(JSON.stringify(narrative)).digest('hex');
}

describe('V3 pacing and visual energy', () => {
  test('preserves the ten authored chapter IDs, order, scenes, and copy', () => {
    expect(chapters.map((chapter) => chapter.id)).toEqual([
      'overture', 'cold-cloud', 'collapse', 'ignition', 'main-sequence',
      'red-giant', 'shedding', 'white-dwarf', 'elsewhere', 'epilogue',
    ]);
    expect(frozenNarrativeHash()).toBe(narrativeHash);
  });

  test('keeps ignition shorter than collapse and main sequence the longest stable chapter', () => {
    const lengths = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.scrollLength]));
    expect(lengths.ignition).toBeLessThan(lengths.collapse);
    expect(lengths['main-sequence']).toBeGreaterThan(lengths.collapse);
    expect(lengths['main-sequence']).toBeGreaterThan(lengths['red-giant']);
    expect(lengths['main-sequence']).toBeGreaterThan(lengths['white-dwarf']);
  });

  test('continuity energy biases enabled postFX after the runtime budget is resolved', () => {
    const baseInput = {
      chapterId: 'elsewhere',
      scene: 'black-hole' as const,
      localProgress: 0.72,
      pointer: { x: 0, y: 0 },
      quality: highQuality,
      adaptiveLevel: 0 as const,
    };
    const baseline = resolveCinematicState(baseInput);
    const continuity = resolveVisualContinuity({ chapterIndex: 8, localProgress: 0.72, reducedMotion: false });
    const energizedInput: typeof baseInput & { continuity: typeof continuity } = { ...baseInput, continuity };
    const energized = resolveCinematicState(energizedInput);
    expect(energized.postFx.enabled).toBe(true);
    expect(energized.postFx.bloomStrength).not.toBe(baseline.postFx.bloomStrength);
    expect(energized.postFx.exposure).not.toBe(baseline.postFx.exposure);
    expect(energized.postFx.bloomStrength).toBeLessThanOrEqual(1.45);
    expect(energized.postFx.chromaticFringe).toBeLessThanOrEqual(0.12);
  });

  test('continuity energy never re-enables postprocessing disabled by the quality budget', () => {
    const continuity = resolveVisualContinuity({ chapterIndex: 8, localProgress: 0.72, reducedMotion: false });
    const input = {
      chapterId: 'elsewhere',
      scene: 'black-hole' as const,
      localProgress: 0.72,
      pointer: { x: 0, y: 0 },
      quality: lowQuality,
      adaptiveLevel: 3 as const,
      continuity,
    };
    const state = resolveCinematicState(input);
    expect(state.budget.postprocessing).toBe(false);
    expect(state.postFx.enabled).toBe(false);
    expect(state.postFx.bloomStrength).toBe(0);
    expect(state.postFx.chromaticFringe).toBe(0);
  });
});
