import type { SceneId } from '../content/types.ts';

export interface SceneAudioEnvelope {
  lowHz: number;
  highHz: number;
  filterHz: number;
  gain: number;
  noise: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

export function sceneAudioEnvelope(scene: SceneId, localProgress: number): SceneAudioEnvelope {
  const p = clamp01(localProgress);
  const envelope: SceneAudioEnvelope = (() => {
    switch (scene) {
      case 'dust': return { lowHz: lerp(42, 48, p), highHz: 74, filterHz: lerp(520, 650, p), gain: 0.024, noise: 0.28 };
      case 'collapse': return { lowHz: lerp(46, 54, p), highHz: lerp(82, 110, p), filterHz: lerp(620, 980, p), gain: lerp(0.027, 0.04, p), noise: lerp(0.2, 0.36, p) };
      case 'fusion': return { lowHz: 56, highHz: lerp(112, 168, p), filterHz: lerp(1100, 1700, p), gain: 0.045, noise: 0.18 };
      case 'main-sequence': return { lowHz: 58, highHz: 116, filterHz: 1260, gain: 0.035, noise: 0.08 };
      case 'red-giant': return { lowHz: lerp(48, 39, p), highHz: lerp(91, 76, p), filterHz: lerp(920, 670, p), gain: 0.038, noise: lerp(0.15, 0.32, p) };
      case 'nebula': return { lowHz: 43, highHz: lerp(126, 168, p), filterHz: lerp(980, 1480, p), gain: 0.028, noise: 0.52 };
      case 'white-dwarf': return { lowHz: 64, highHz: lerp(210, 184, p), filterHz: lerp(1800, 1450, p), gain: lerp(0.026, 0.018, p), noise: 0.06 };
      case 'black-hole': return { lowHz: lerp(34, 29, p), highHz: lerp(68, 61, p), filterHz: lerp(480, 360, p), gain: 0.041, noise: lerp(0.34, 0.55, p) };
    }
  })();
  return {
    lowHz: clamp(envelope.lowHz, 24, 240),
    highHz: clamp(envelope.highHz, 32, 480),
    filterHz: clamp(envelope.filterHz, 180, 2400),
    gain: clamp(envelope.gain, 0, 0.06),
    noise: clamp01(envelope.noise),
  };
}
