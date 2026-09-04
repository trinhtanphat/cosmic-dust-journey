import { observeFrame, type RuntimeQualityState } from '../experience/runtimeQuality.ts';
import type { ObservabilityEventName } from './types.ts';

interface FrameSink {
  diagnostics: {
    recordFrame(ms: number): void;
    recordQualityTransition(from: 0|1|2|3, to: 0|1|2|3, at: number): void;
  };
  hub: {
    emit(name: ObservabilityEventName, context?: Record<string, unknown>): void;
  };
}

export function observeRuntimeFrame(
  state: RuntimeQualityState,
  frameMs: number,
  sink: FrameSink,
  at: number = Date.now(),
): RuntimeQualityState {
  sink.diagnostics.recordFrame(frameMs);
  const next = observeFrame(state, frameMs);
  if (next.level !== state.level) {
    sink.diagnostics.recordQualityTransition(state.level, next.level, at);
    sink.hub.emit('quality.transition', { fromLevel: state.level, toLevel: next.level });
  }
  return next;
}
