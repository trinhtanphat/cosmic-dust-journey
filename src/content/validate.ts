import { sceneIds, type Chapter } from './types.ts';

export function validateChapters(input: readonly Chapter[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const allowed = new Set<string>(sceneIds);

  input.forEach((chapter, index) => {
    if (!chapter.id.trim()) errors.push(`chapter ${index} has no id`);
    if (seen.has(chapter.id)) errors.push(`duplicate chapter id: ${chapter.id}`);
    seen.add(chapter.id);
    if (!chapter.title.trim()) errors.push(`${chapter.id || index} has no title`);
    if (!chapter.body.trim()) errors.push(`${chapter.id || index} has no body`);
    if (!allowed.has(chapter.scene)) errors.push(`${chapter.id || index} has unknown scene`);
    if (!Number.isFinite(chapter.scrollLength) || chapter.scrollLength <= 0) {
      errors.push(`${chapter.id || index} has invalid scrollLength`);
    }
  });

  return errors;
}
