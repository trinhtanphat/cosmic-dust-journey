import { chapters } from '../content/chapters';
import { buildTimeline } from './timeline';

export const chapterTimeline = buildTimeline(chapters);
export const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter] as const));
