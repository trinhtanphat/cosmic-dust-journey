import { describe, expect, it } from 'vitest';
import {
  canonicalChapterHash,
  chapterIdFromHash,
  chapterStartProgress,
  progressToScrollY,
  scrollYToProgress,
} from '../src/experience/navigation';
import { chapterTimeline } from '../src/experience/chapterRegistry';

const ids = chapterTimeline.map((chapter) => chapter.id);

describe('V3.1 canonical journey navigation', () => {
  it('round-trips only canonical known chapter hashes', () => {
    expect(canonicalChapterHash('cold-cloud')).toBe('#chapter-cold-cloud');
    expect(chapterIdFromHash('#chapter-cold-cloud', ids)).toBe('cold-cloud');
    expect(chapterIdFromHash('#chapter-not-real', ids)).toBeNull();
    expect(chapterIdFromHash('chapter-cold-cloud', ids)).toBeNull();
  });

  it('locates chapter starts and rejects unknown ids', () => {
    expect(chapterStartProgress(chapterTimeline, 'overture')).toBe(0);
    expect(chapterStartProgress(chapterTimeline, 'red-giant')).toBeGreaterThan(0);
    expect(chapterStartProgress(chapterTimeline, 'missing')).toBeNull();
  });

  it('converts progress and scroll positions with safe clamping', () => {
    expect(progressToScrollY(0.5, 3000, 1000)).toBe(1000);
    expect(scrollYToProgress(1000, 3000, 1000)).toBe(0.5);
    expect(progressToScrollY(Number.NaN, 3000, 1000)).toBe(0);
    expect(scrollYToProgress(50, 500, 1000)).toBe(0);
    expect(progressToScrollY(2, 3000, 1000)).toBe(2000);
    expect(scrollYToProgress(-500, 3000, 1000)).toBe(0);
  });
});
