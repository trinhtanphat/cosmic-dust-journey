import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserObservability } from '../../src/observability/browser.ts';
test('browser observability connects sanitized hub events to local diagnostics and starts once',()=>{let starts=0,stops=0;const runtime=createBrowserObservability({now:()=>100,startPerformance:()=>{starts++;return()=>{stops++}}});assert.equal(starts,0);runtime.start();runtime.start();assert.equal(starts,1);runtime.hub.emit('chapter.enter',{chapterId:'collapse',pointerX:.8});const snapshot=runtime.snapshot();assert.deepEqual(snapshot.chaptersVisited,['collapse']);assert.equal('pointerX' in runtime.hub.recentEvents()[0].context,false);runtime.dispose();runtime.dispose();assert.equal(stops,1);});
