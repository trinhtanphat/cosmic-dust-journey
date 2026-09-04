import type { SceneAudioEnvelope } from './sceneAudio.ts';

export interface AmbientDriver {
  start(): Promise<void> | void;
  stop(): void;
  setEnvelope?(envelope: SceneAudioEnvelope): void;
}

export interface AmbientController {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): Promise<void>;
  setEnvelope(envelope: SceneAudioEnvelope): void;
  dispose(): void;
}

export function createAmbientController(driver: AmbientDriver): AmbientController {
  let enabled = false;
  let envelope: SceneAudioEnvelope | null = null;
  return {
    isEnabled: () => enabled,
    async setEnabled(next) {
      if (next === enabled) return;
      if (next) {
        await driver.start();
        enabled = true;
        if (envelope) driver.setEnvelope?.(envelope);
      } else {
        driver.stop();
        enabled = false;
      }
    },
    setEnvelope(nextEnvelope) {
      envelope = nextEnvelope;
      if (enabled) driver.setEnvelope?.(nextEnvelope);
    },
    dispose() {
      if (enabled) driver.stop();
      enabled = false;
    },
  };
}

export function createWebAudioDriver(): AmbientDriver {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let low: OscillatorNode | null = null;
  let high: OscillatorNode | null = null;
  let texture: OscillatorNode | null = null;
  let lowGain: GainNode | null = null;
  let highGain: GainNode | null = null;
  let textureGain: GainNode | null = null;
  let sources: AudioScheduledSourceNode[] = [];
  let currentEnvelope: SceneAudioEnvelope = { lowHz: 55, highHz: 82.5, filterHz: 820, gain: 0.035, noise: 0.1 };

  const applyEnvelope = (envelope: SceneAudioEnvelope) => {
    currentEnvelope = envelope;
    if (!context || !master || !filter || !low || !high || !lowGain || !highGain || !textureGain) return;
    const now = context.currentTime;
    const smooth = 0.28;
    low.frequency.setTargetAtTime(envelope.lowHz, now, smooth);
    high.frequency.setTargetAtTime(envelope.highHz, now, smooth);
    filter.frequency.setTargetAtTime(envelope.filterHz, now, smooth);
    master.gain.setTargetAtTime(Math.max(0.0001, envelope.gain), now, smooth);
    lowGain.gain.setTargetAtTime(0.34, now, smooth);
    highGain.gain.setTargetAtTime(0.12 + envelope.noise * 0.08, now, smooth);
    textureGain.gain.setTargetAtTime(envelope.noise * 0.045, now, smooth);
  };

  return {
    async start() {
      if (typeof window === 'undefined') return;
      if (!context) context = new AudioContext();
      await context.resume();
      if (master) return;

      master = context.createGain();
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.connect(context.destination);

      filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.35;
      filter.connect(master);

      low = context.createOscillator();
      low.type = 'sine';
      lowGain = context.createGain();
      low.connect(lowGain).connect(filter);

      high = context.createOscillator();
      high.type = 'sine';
      highGain = context.createGain();
      high.connect(highGain).connect(filter);

      texture = context.createOscillator();
      texture.type = 'triangle';
      texture.frequency.value = 137;
      textureGain = context.createGain();
      texture.connect(textureGain).connect(filter);

      low.start();
      high.start();
      texture.start();
      sources = [low, high, texture];
      applyEnvelope(currentEnvelope);
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(Math.max(0.0001, currentEnvelope.gain), context.currentTime + 1.2);
    },
    setEnvelope(envelope) {
      applyEnvelope(envelope);
    },
    stop() {
      if (!context || !master) return;
      const stopAt = context.currentTime + 0.25;
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      for (const source of sources) {
        try { source.stop(stopAt + 0.02); } catch { /* already stopped */ }
      }
      sources = [];
      const oldMaster = master;
      master = null;
      filter = null;
      low = null;
      high = null;
      texture = null;
      lowGain = null;
      highGain = null;
      textureGain = null;
      window.setTimeout(() => oldMaster.disconnect(), 350);
    },
  };
}
