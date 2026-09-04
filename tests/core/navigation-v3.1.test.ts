import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalChapterHash,
  chapterIdFromHash,
  chapterStartProgress,
  progressToScrollY,
  scrollYToProgress,
} from '../../src/experience/navigation.ts';
import { chapterTimeline } from '../../src/experience/chapterRegistry.ts';

const ids = chapterTimeline.map((chapter) => chapter.id);

test('canonical chapter hashes round-trip only known ids', () => {
  assert.equal(canonicalChapterHash('cold-cloud'), '#chapter-cold-cloud');
  assert.equal(chapterIdFromHash('#chapter-cold-cloud', ids), 'cold-cloud');
  assert.equal(chapterIdFromHash('#chapter-not-real', ids), null);
  assert.equal(chapterIdFromHash('chapter-cold-cloud', ids), null);
});

test('chapter lookup returns normalized start and unknown ids fail closed', () => {
  assert.equal(chapterStartProgress(chapterTimeline, 'overture'), 0);
  assert.ok((chapterStartProgress(chapterTimeline, 'red-giant') ?? -1) > 0);
  assert.equal(chapterStartProgress(chapterTimeline, 'missing'), null);
});

test('scroll/progress conversion is clamped and reversible', () => {
  assert.equal(progressToScrollY(0.5, 3000, 1000), 1000);
  assert.equal(scrollYToProgress(1000, 3000, 1000), 0.5);
  assert.equal(progressToScrollY(Number.NaN, 3000, 1000), 0);
  assert.equal(scrollYToProgress(50, 500, 1000), 0);
  assert.equal(progressToScrollY(2, 3000, 1000), 2000);
  assert.equal(scrollYToProgress(-500, 3000, 1000), 0);
});
