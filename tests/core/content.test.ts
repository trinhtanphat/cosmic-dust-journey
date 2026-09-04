import test from 'node:test';
import assert from 'node:assert/strict';

test('narrative exports ten valid unique chapters', async () => {
  const content = await import('../../src/content/chapters.ts').catch(() => ({ chapters: [] as unknown[] }));
  const validation = await import('../../src/content/validate.ts').catch(() => ({ validateChapters: () => ['missing'] }));
  assert.equal(content.chapters.length, 10);
  assert.deepEqual(validation.validateChapters(content.chapters), []);
  const chapterIds = (content.chapters as readonly { id: string }[]).map((chapter) => chapter.id);
  assert.equal(new Set(chapterIds).size, 10);
});
