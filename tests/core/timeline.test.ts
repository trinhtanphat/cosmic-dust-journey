import test from 'node:test';
import assert from 'node:assert/strict';

test('timeline maps global progress into chapter-local progress', async () => {
  const timelineModule = await import('../../src/experience/timeline.ts').catch(() => null);
  assert.ok(timelineModule, 'timeline module should exist');
  const chapters = [
    { id: 'a', scrollLength: 1 },
    { id: 'b', scrollLength: 3 },
  ] as any;
  const timeline = timelineModule!.buildTimeline(chapters);
  assert.deepEqual(timeline.map((item: any) => [item.id, item.start, item.end]), [
    ['a', 0, 0.25],
    ['b', 0.25, 1],
  ]);
  assert.deepEqual(timelineModule!.locateProgress(timeline, 0.625), {
    chapterId: 'b',
    index: 1,
    localProgress: 0.5,
    globalProgress: 0.625,
  });
});

test('timeline clamps progress outside zero to one', async () => {
  const { buildTimeline, locateProgress } = await import('../../src/experience/timeline.ts');
  const timeline = buildTimeline([{ id: 'a', scrollLength: 1 }] as any);
  assert.equal(locateProgress(timeline, -2).globalProgress, 0);
  assert.equal(locateProgress(timeline, 4).globalProgress, 1);
});
