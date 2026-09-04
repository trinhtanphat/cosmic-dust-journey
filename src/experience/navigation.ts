import type { TimelineChapter } from './timeline';

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp01 = (value: number) => Math.min(1, Math.max(0, finiteOrZero(value)));

function maxScrollable(scrollHeight: number, viewportHeight: number) {
  return Math.max(0, finiteOrZero(scrollHeight) - Math.max(0, finiteOrZero(viewportHeight)));
}

export function canonicalChapterHash(chapterId: string): string {
  return `#chapter-${chapterId}`;
}

export function chapterIdFromHash(hash: string, knownIds: readonly string[]): string | null {
  const prefix = '#chapter-';
  if (!hash.startsWith(prefix)) return null;
  const chapterId = hash.slice(prefix.length);
  if (!chapterId || canonicalChapterHash(chapterId) !== hash) return null;
  return knownIds.includes(chapterId) ? chapterId : null;
}

export function chapterStartProgress(
  timeline: readonly TimelineChapter[],
  chapterId: string,
): number | null {
  const chapter = timeline.find((item) => item.id === chapterId);
  return chapter ? clamp01(chapter.start) : null;
}

export function progressToScrollY(
  progress: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  return clamp01(progress) * maxScrollable(scrollHeight, viewportHeight);
}

export function scrollYToProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const maxScroll = maxScrollable(scrollHeight, viewportHeight);
  if (maxScroll <= 0) return 0;
  return clamp01(finiteOrZero(scrollY) / maxScroll);
}
