export interface AmbientDriver {
  start(): Promise<void> | void;
  stop(): void;
}

export interface AmbientController {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): Promise<void>;
  dispose(): void;
}

export function createAmbientController(driver: AmbientDriver): AmbientController {
  let enabled = false;
  return {
    isEnabled: () => enabled,
    async setEnabled(next) {
      if (next === enabled) return;
      if (next) await driver.start();
      else driver.stop();
      enabled = next;
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
  let sources: AudioScheduledSourceNode[] = [];

  return {
    async start() {
      if (typeof window === 'undefined') return;
      if (!context) context = new AudioContext();
      await context.resume();
      if (master) return;

      master = context.createGain();
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 1.2);
      master.connect(context.destination);

      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 820;
      filter.Q.value = 0.35;
      filter.connect(master);

      const low = context.createOscillator();
      low.type = 'sine';
      low.frequency.value = 55;
      const lowGain = context.createGain();
      lowGain.gain.value = 0.36;
      low.connect(lowGain).connect(filter);

      const high = context.createOscillator();
      high.type = 'sine';
      high.frequency.value = 82.5;
      const highGain = context.createGain();
      highGain.gain.value = 0.12;
      high.connect(highGain).connect(filter);

      low.start();
      high.start();
      sources = [low, high];
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
      window.setTimeout(() => oldMaster.disconnect(), 350);
    },
  };
}
