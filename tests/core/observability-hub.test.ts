import test from 'node:test';
import assert from 'node:assert/strict';
import { createObservabilityHub } from '../../src/observability/hub.ts';
import { sanitizeContext } from '../../src/observability/sanitize.ts';
import type { ObservabilityAdapter, ObservabilityEvent } from '../../src/observability/types.ts';
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test('sanitizer keeps only bounded allow-listed context', () => {
  const sanitized = sanitizeContext({
    chapterId:'main-sequence', sceneId:'main-sequence', phase:'interact', qualityTier:'high', adaptiveLevel:2,
    viewportClass:'large', errorClass:'TypeError', value:42.5, fromLevel:1, toLevel:2,
    pointerX:.91, pointerY:-.4, body:'private', query:'?secret=yes', email:'person@example.com', userId:'123', url:'https://example.com', arbitrary:'drop',
  });
  assert.deepEqual(sanitized, { chapterId:'main-sequence', sceneId:'main-sequence', phase:'interact', qualityTier:'high', adaptiveLevel:2, viewportClass:'large', errorClass:'TypeError', value:42.5, fromLevel:1, toLevel:2 });
});

test('hub keeps a bounded ring and forwards the same sanitized event to local sink', () => {
  const local: ObservabilityEvent[]=[]; let clock=10;
  const hub=createObservabilityHub({capacity:3, now:()=>clock++, onEvent:(event)=>local.push(event)});
  hub.emit('chapter.enter',{chapterId:'overture',pointerX:1}); hub.emit('chapter.enter',{chapterId:'collapse'}); hub.emit('chapter.enter',{chapterId:'ignition'}); hub.emit('chapter.enter',{chapterId:'main-sequence'});
  assert.deepEqual(hub.recentEvents().map((e)=>e.context.chapterId),['collapse','ignition','main-sequence']);
  assert.deepEqual(local[0],{name:'chapter.enter',at:10,context:{chapterId:'overture'}});
});

test('adapter failures circuit-break only the failing adapter and do not recurse', async () => {
  let failingCalls=0, healthyCalls=0;
  const failing: ObservabilityAdapter={name:'failing',kind:'analytics',send:async()=>{failingCalls++;throw new Error('provider down')}};
  const healthy: ObservabilityAdapter={name:'healthy',kind:'analytics',send:()=>{healthyCalls++}};
  const hub=createObservabilityHub({failureLimit:3,adapters:[failing,healthy]});
  for(let i=0;i<3;i++){hub.emit('chapter.enter',{chapterId:'collapse'});await tick();}
  assert.deepEqual(hub.adapterState().failing,{failures:3,disabled:true});
  hub.emit('chapter.enter',{chapterId:'ignition'}); await tick();
  assert.equal(failingCalls,3); assert.equal(healthyCalls,4);
  assert.equal(hub.recentEvents().filter((e)=>e.name==='runtime.error').length,0);
});

test('hub accepts one lazy adapter per name and disposes adapters once', () => {
  let calls=0, disposed=0;
  const adapter: ObservabilityAdapter={name:'lazy',kind:'error',send:()=>{calls++},dispose:()=>{disposed++}};
  const hub=createObservabilityHub(); hub.addAdapter(adapter); hub.addAdapter(adapter); hub.emit('runtime.error',{errorClass:'TypeError'}); hub.dispose(); hub.dispose();
  assert.equal(calls,1); assert.equal(disposed,1);
});
