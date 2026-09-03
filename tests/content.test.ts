import { describe, expect, test } from 'vitest';

describe('typed narrative content', () => {
  test('provides a chapter validator', async () => {
    const module = await import('../src/content/validate').catch(() => ({ validateChapters: undefined }));
    expect(typeof module.validateChapters).toBe('function');
  });

  test('provides ten valid, uniquely identified chapters', async () => {
    const module = await import('../src/content/chapters').catch(() => ({ chapters: [] }));
    const validator = await import('../src/content/validate').catch(() => ({ validateChapters: () => ['missing'] }));
    expect(module.chapters).toHaveLength(10);
    expect(validator.validateChapters(module.chapters)).toEqual([]);
    expect(new Set(module.chapters.map((chapter: { id: string }) => chapter.id)).size).toBe(10);
  });
});
