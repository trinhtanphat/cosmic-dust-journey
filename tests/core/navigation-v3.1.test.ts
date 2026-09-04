import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalChapterHash,
  chapterIdFromHash,
  chapterStartProgress,
  progressToScrollY,
  scrollYToProgress,
} from '../../src/experience/navigation.ts';
import type { TimelineChapter } from '../../src/experience/timeline.ts';

const chapterTimeline: readonly TimelineChapter[] = [
  { id: 'overture', index: 0, start: 0, end: 0.2, length: 1 },
  { id: 'cold-cloud', index: 1, start: 0.2, end: 0.45, length: 1.25 },
  { id: 'red-giant', index: 2, start: 0.45, end: 0.75, length: 1.5 },
  { id: 'epilogue', index: 3, start: 0.75, end: 1, length: 1.25 },
];
const ids = chapterTimeline.map((chapter) => chapter.id);

test('canonical chapter hashes round-trip only known ids', () => {
  assert.equal(canonicalChapterHash('cold-cloud'), '#chapter-cold-cloud');
  assert.equal(chapterIdFromHash('#chapter-cold-cloud', ids), 'cold-cloud');
  assert.equal(chapterIdFromHash('#chapter-not-real', ids), null);
  assert.equal(chapterIdFromHash('chapter-cold-cloud', ids), null);
});

test('chapter lookup returns normalized start and unknown ids fail closed', () => {
  assert.equal(chapterStartProgress(chapterTimeline, 'overture'), 0);
  assert.equal(chapterStartProgress(chapterTimeline, 'red-giant'), 0.45);
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
