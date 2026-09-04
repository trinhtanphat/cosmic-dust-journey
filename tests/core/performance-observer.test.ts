import test from 'node:test';
import assert from 'node:assert/strict';
import { startPerformanceDiagnostics } from '../../src/observability/performance.ts';
class FakePerformanceObserver {
  static latest: FakePerformanceObserver | null = null; disconnected=false; observed=false; callback: PerformanceObserverCallback;
  constructor(callback:PerformanceObserverCallback){this.callback=callback;FakePerformanceObserver.latest=this;}
  observe(){this.observed=true;} disconnect(){this.disconnected=true;} takeRecords():PerformanceEntryList{return []}
  push(duration:number){const entry={duration} as PerformanceEntry;const list={getEntries:()=>[entry]} as PerformanceObserverEntryList;this.callback(list,this as unknown as PerformanceObserver);}
}
test('performance diagnostics records long tasks and heap baseline without creating a frame loop',()=>{const longTasks:number[]=[],baselines:number[]=[],currents:number[]=[];const cleanup=startPerformanceDiagnostics({recordFrame:()=>{throw new Error('observer must not sample frames')},recordLongTask:ms=>longTasks.push(ms),setHeapBaseline:b=>baselines.push(b),setHeapCurrent:b=>currents.push(b)},{PerformanceObserver:FakePerformanceObserver as unknown as typeof PerformanceObserver,performance:{memory:{usedJSHeapSize:1234}} as unknown as Performance});assert.equal(FakePerformanceObserver.latest?.observed,true);FakePerformanceObserver.latest?.push(321);assert.deepEqual(longTasks,[321]);assert.deepEqual(baselines,[1234]);assert.deepEqual(currents,[]);cleanup();assert.equal(FakePerformanceObserver.latest?.disconnected,true);});
test('performance diagnostics degrades to a no-op when optional browser APIs are unavailable',()=>{let calls=0;const cleanup=startPerformanceDiagnostics({recordFrame:()=>{calls++},recordLongTask:()=>{calls++},setHeapBaseline:()=>{calls++},setHeapCurrent:()=>{calls++}},{});cleanup();assert.equal(calls,0);});
