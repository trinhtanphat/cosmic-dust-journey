import { describe, expect, test } from 'vitest';

const loadSpline = async () => {
  const module = await import('../src/experience/cameraSpline').catch(() => null);
  expect(module).not.toBeNull();
  return module!;
};

const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(...a.map((value, index) => value - b[index]));

const vector = (a: readonly number[], b: readonly number[]) => a.map((value, index) => value - b[index]);
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, value, index) => sum + value * b[index], 0);

describe('V3 global camera spline', () => {
  test('shares the exact same pose at every chapter boundary', async () => {
    const spline = await loadSpline();
    for (let chapterIndex = 0; chapterIndex < 9; chapterIndex += 1) {
      const outgoing = spline.sampleGlobalCameraSpline({
        chapterIndex,
        localProgress: 1,
        pointer: { x: 0, y: 0 },
        reducedMotion: false,
      });
      const incoming = spline.sampleGlobalCameraSpline({
        chapterIndex: chapterIndex + 1,
        localProgress: 0,
        pointer: { x: 0, y: 0 },
        reducedMotion: false,
      });
      expect(distance(outgoing.position, incoming.position)).toBeLessThan(1e-8);
      expect(distance(outgoing.target, incoming.target)).toBeLessThan(1e-8);
      expect(Math.abs(outgoing.fov - incoming.fov)).toBeLessThan(1e-8);
    }
  });

  test('keeps travel direction continuous around normal chapter boundaries', async () => {
    const spline = await loadSpline();
    for (let chapterIndex = 0; chapterIndex < 8; chapterIndex += 1) {
      const before = spline.sampleGlobalCameraSpline({ chapterIndex, localProgress: 0.999, pointer: { x: 0, y: 0 }, reducedMotion: false });
      const edge = spline.sampleGlobalCameraSpline({ chapterIndex, localProgress: 1, pointer: { x: 0, y: 0 }, reducedMotion: false });
      const after = spline.sampleGlobalCameraSpline({ chapterIndex: chapterIndex + 1, localProgress: 0.001, pointer: { x: 0, y: 0 }, reducedMotion: false });
      const incomingDirection = vector(edge.position, before.position);
      const outgoingDirection = vector(after.position, edge.position);
      expect(dot(incomingDirection, outgoingDirection)).toBeGreaterThanOrEqual(-1e-8);
    }
  });

  test('bounds pointer influence and reduced motion lowers its displacement', async () => {
    const spline = await loadSpline();
    const base = spline.sampleGlobalCameraSpline({ chapterIndex: 4, localProgress: 0.5, pointer: { x: 0, y: 0 }, reducedMotion: false });
    const normal = spline.sampleGlobalCameraSpline({ chapterIndex: 4, localProgress: 0.5, pointer: { x: 99, y: -99 }, reducedMotion: false });
    const reduced = spline.sampleGlobalCameraSpline({ chapterIndex: 4, localProgress: 0.5, pointer: { x: 99, y: -99 }, reducedMotion: true });
    expect(distance(normal.position, base.position)).toBeLessThan(1);
    expect(distance(reduced.position, base.position)).toBeLessThan(distance(normal.position, base.position));
  });

  test('clamps invalid chapter/progress input and reports normalized location', async () => {
    const spline = await loadSpline();
    const sample = spline.sampleGlobalCameraSpline({
      chapterIndex: Number.POSITIVE_INFINITY,
      localProgress: Number.NaN,
      pointer: { x: Number.NaN, y: Number.POSITIVE_INFINITY },
      reducedMotion: false,
    });
    expect(sample.chapterIndex).toBe(0);
    expect(sample.chapterProgress).toBe(0);
    expect(sample.position.every(Number.isFinite)).toBe(true);
    expect(sample.target.every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(sample.fov)).toBe(true);
  });
});
