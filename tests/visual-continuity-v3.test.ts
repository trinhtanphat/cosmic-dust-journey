import { describe, expect, test } from 'vitest';

const loadContinuity = async () => {
  const module = await import('../src/experience/visualContinuity').catch(() => null);
  expect(module).not.toBeNull();
  return module!;
};

const channel = (
  state: { matter: readonly { channel: string; amount: number }[] },
  name: string,
) => state.matter.find((entry) => entry.channel === name);

describe('V3 visual continuity', () => {
  test('is deterministic and clamps invalid inputs', async () => {
    const continuity = await loadContinuity();
    const input = { chapterIndex: Number.POSITIVE_INFINITY, localProgress: Number.NaN, reducedMotion: false };
    const first = continuity.resolveVisualContinuity(input);
    const second = continuity.resolveVisualContinuity(input);
    expect(first).toEqual(second);
    expect(first.currentScene).toBe('dust');
    expect(first.blend.outgoingWeight).toBeGreaterThanOrEqual(0);
    expect(first.blend.outgoingWeight).toBeLessThanOrEqual(1);
    expect(first.blend.incomingWeight).toBeGreaterThanOrEqual(0);
    expect(first.blend.incomingWeight).toBeLessThanOrEqual(1);
    expect(first.blend.transfer).toBeGreaterThanOrEqual(0);
    expect(first.blend.transfer).toBeLessThanOrEqual(1);
  });

  test('transfers dust and gas from cold cloud into collapse', async () => {
    const continuity = await loadContinuity();
    const state = continuity.resolveVisualContinuity({ chapterIndex: 1, localProgress: 0.95, reducedMotion: false });
    expect(state.currentScene).toBe('dust');
    expect(state.nextScene).toBe('collapse');
    expect(channel(state, 'dust')?.amount ?? 0).toBeGreaterThan(0.2);
    expect(channel(state, 'gas')?.amount ?? 0).toBeGreaterThan(0.2);
    expect(state.blend.transfer).toBeGreaterThan(0.5);
  });

  test('transfers envelope into ejecta and retains ejecta around the white dwarf', async () => {
    const continuity = await loadContinuity();
    const shedding = continuity.resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.95, reducedMotion: false });
    expect(shedding.currentScene).toBe('red-giant');
    expect(shedding.nextScene).toBe('nebula');
    expect(channel(shedding, 'envelope')?.amount ?? 0).toBeGreaterThan(0.1);
    expect(channel(shedding, 'ejecta')?.amount ?? 0).toBeGreaterThan(0.25);

    const remnant = continuity.resolveVisualContinuity({ chapterIndex: 6, localProgress: 0.95, reducedMotion: false });
    expect(remnant.nextScene).toBe('white-dwarf');
    expect(channel(remnant, 'ejecta')?.amount ?? 0).toBeGreaterThan(0.15);
    expect(channel(remnant, 'remnant')?.amount ?? 0).toBeGreaterThan(0.3);
  });

  test('keeps white dwarf to black hole as a non-physical alternate-outcome bridge', async () => {
    const continuity = await loadContinuity();
    const state = continuity.resolveVisualContinuity({ chapterIndex: 7, localProgress: 0.95, reducedMotion: false });
    expect(state.currentScene).toBe('white-dwarf');
    expect(state.nextScene).toBe('black-hole');
    expect(state.blend.transfer).toBeLessThanOrEqual(0.08);
    expect(channel(state, 'remnant')?.amount ?? 0).toBeGreaterThan(0.1);
  });

  test('reduced motion preserves topology while lowering turbulence', async () => {
    const continuity = await loadContinuity();
    const normal = continuity.resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.72, reducedMotion: false });
    const reduced = continuity.resolveVisualContinuity({ chapterIndex: 5, localProgress: 0.72, reducedMotion: true });
    expect(reduced.currentScene).toBe(normal.currentScene);
    expect(reduced.nextScene).toBe(normal.nextScene);
    expect(reduced.blend.transfer).toBe(normal.blend.transfer);
    expect(reduced.energy.turbulence).toBeLessThanOrEqual(normal.energy.turbulence);
  });
});
