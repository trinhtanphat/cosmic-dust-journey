export interface ScrollChapterLike {
  id: string;
  scrollLength: number;
}

export interface TimelineChapter {
  id: string;
  index: number;
  start: number;
  end: number;
  length: number;
}

export interface LocatedProgress {
  chapterId: string;
  index: number;
  localProgress: number;
  globalProgress: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function buildTimeline(chapters: readonly ScrollChapterLike[]): readonly TimelineChapter[] {
  if (!chapters.length) return [];
  const total = chapters.reduce((sum, chapter) => sum + Math.max(0, chapter.scrollLength), 0);
  if (total <= 0) throw new Error('Timeline requires positive total scroll length.');
  let cursor = 0;
  return chapters.map((chapter, index) => {
    const start = cursor / total;
    cursor += Math.max(0, chapter.scrollLength);
    return { id: chapter.id, index, start, end: cursor / total, length: chapter.scrollLength };
  });
}

export function locateProgress(timeline: readonly TimelineChapter[], inputProgress: number): LocatedProgress {
  if (!timeline.length) return { chapterId: '', index: -1, localProgress: 0, globalProgress: clamp01(inputProgress) };
  const globalProgress = clamp01(inputProgress);
  const chapter = timeline.find((item, index) => globalProgress < item.end || index === timeline.length - 1) ?? timeline[0];
  const span = Math.max(Number.EPSILON, chapter.end - chapter.start);
  const localProgress = clamp01((globalProgress - chapter.start) / span);
  return { chapterId: chapter.id, index: chapter.index, localProgress, globalProgress };
}
