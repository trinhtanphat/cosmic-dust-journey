import assert from 'node:assert/strict';
import test from 'node:test';
import {
  captureCasesForProfile,
  captureFilename,
  v32CaptureCases,
  v32CaptureProfiles,
} from '../e2e/support/v3.2-capture-plan.ts';

const chapterIds = [
  'overture',
  'cold-cloud',
  'collapse',
  'ignition',
  'main-sequence',
  'red-giant',
  'shedding',
  'white-dwarf',
  'elsewhere',
  'epilogue',
] as const;

const boundaryPairs = chapterIds.slice(0, -1).map((chapterId, index) => [chapterId, chapterIds[index + 1]] as const);

test('V3.2 capture plan has the exact deterministic 23-case profile matrix', () => {
  assert.deepEqual(v32CaptureProfiles, ['desktop', 'mobile', 'reduced-motion']);
  assert.equal(v32CaptureCases.length, 23);
  assert.equal(captureCasesForProfile('desktop').length, 19);
  assert.equal(captureCasesForProfile('mobile').length, 3);
  assert.equal(captureCasesForProfile('reduced-motion').length, 1);
});

test('desktop plan covers every public chapter and every adjacent boundary in order', () => {
  const desktop = captureCasesForProfile('desktop');
  assert.deepEqual(
    desktop.filter((capture) => capture.kind === 'chapter').map((capture) => capture.chapterId),
    chapterIds,
  );
  assert.deepEqual(
    desktop
      .filter((capture) => capture.kind === 'boundary')
      .map((capture) => [capture.chapterId, capture.nextChapterId] as const),
    boundaryPairs,
  );
});

test('capture IDs filenames fractions and reduced-motion flags are globally valid', () => {
  assert.equal(new Set(v32CaptureCases.map((capture) => capture.id)).size, v32CaptureCases.length);
  assert.equal(new Set(v32CaptureCases.map(captureFilename)).size, v32CaptureCases.length);

  for (const capture of v32CaptureCases) {
    assert.equal(captureFilename(capture), `${capture.id}.png`);
    assert.ok(Number.isFinite(capture.fraction));
    assert.ok(capture.fraction >= 0 && capture.fraction <= 1);
    if (capture.kind === 'boundary') assert.ok(capture.nextChapterId);
    assert.equal(capture.reducedMotion, capture.profile === 'reduced-motion');
  }
});
