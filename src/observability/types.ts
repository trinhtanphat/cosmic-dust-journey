export type TelemetryMode = 'local' | 'external';
export type AdapterKind = 'error' | 'analytics';

export type ObservabilityEventName =
  | 'runtime.error'
  | 'runtime.unhandled-rejection'
  | 'quality.transition'
  | 'chapter.enter'
  | 'journey.complete'
  | 'webgl.context-lost'
  | 'webgl.context-restored'
  | 'webgl.fallback'
  | 'audio.enabled'
  | 'audio.disabled'
  | 'audio.suspended'
  | 'audio.interrupted'
  | 'audio.resumed';

export interface PrivacySignals {
  doNotTrack: boolean;
  globalPrivacyControl: boolean;
}

export interface TelemetryConfig {
  mode: TelemetryMode;
  sentry: boolean;
  plausible: boolean;
  ga4: boolean;
  sentryDsn?: string;
  plausibleDomain?: string;
  ga4MeasurementId?: string;
}

export interface ObservabilityContext {
  chapterId?: string;
  sceneId?: string;
  phase?: string;
  qualityTier?: 'low' | 'medium' | 'high';
  adaptiveLevel?: 0 | 1 | 2 | 3;
  viewportClass?: 'small' | 'medium' | 'large';
  errorClass?: string;
  value?: number;
  fromLevel?: 0 | 1 | 2 | 3;
  toLevel?: 0 | 1 | 2 | 3;
}

export interface ObservabilityEvent {
  name: ObservabilityEventName;
  at: number;
  context: ObservabilityContext;
}

export interface ObservabilityAdapter {
  name: string;
  kind: AdapterKind;
  send(event: ObservabilityEvent): void | Promise<void>;
  dispose?(): void;
}
