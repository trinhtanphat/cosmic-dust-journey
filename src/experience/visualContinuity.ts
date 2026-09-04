import { chapters } from '../content/chapters.ts';
import type { SceneId } from '../content/types.ts';

export type MatterChannel = 'dust' | 'gas' | 'core' | 'envelope' | 'ejecta' | 'remnant' | 'accretion';

export interface MatterState {
  channel: MatterChannel;
  amount: number;
  density: number;
  temperature: number;
  turbulence: number;
  expansion: number;
}

export interface ContinuityEnergy {
  luminosity: number;
  bloomBias: number;
  exposureBias: number;
  turbulence: number;
  chromaticBias: number;
}

export interface ContinuityBlend {
  outgoingWeight: number;
  incomingWeight: number;
  transfer: number;
}

export interface VisualContinuityState {
  previousScene: SceneId;
  currentScene: SceneId;
  nextScene: SceneId;
  matter: readonly MatterState[];
  blend: ContinuityBlend;
  energy: ContinuityEnergy;
}

interface MatterKeyframe {
  channel: MatterChannel;
  start: readonly [amount: number, density: number, temperature: number, turbulence: number, expansion: number];
  end: readonly [amount: number, density: number, temperature: number, turbulence: number, expansion: number];
}

interface EnergyKeyframe {
  start: readonly [luminosity: number, bloomBias: number, exposureBias: number, turbulence: number, chromaticBias: number];
  end: readonly [luminosity: number, bloomBias: number, exposureBias: number, turbulence: number, chromaticBias: number];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
const clamp01 = (value: number) => clamp(value, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

const matter = (
  channel: MatterChannel,
  start: MatterKeyframe['start'],
  end: MatterKeyframe['end'],
): MatterKeyframe => ({ channel, start, end });

const matterProfiles: readonly (readonly MatterKeyframe[])[] = [
  [
    matter('dust', [0.82, 0.34, 0.08, 0.72, 0.74], [0.9, 0.42, 0.09, 0.64, 0.62]),
    matter('gas', [0.38, 0.24, 0.06, 0.58, 0.72], [0.5, 0.34, 0.07, 0.5, 0.58]),
  ],
  [
    matter('dust', [0.9, 0.42, 0.09, 0.62, 0.62], [0.68, 0.74, 0.16, 0.5, 0.34]),
    matter('gas', [0.5, 0.34, 0.07, 0.5, 0.58], [0.78, 0.82, 0.2, 0.64, 0.3]),
    matter('core', [0.02, 0.08, 0.18, 0.1, 0.08], [0.16, 0.56, 0.48, 0.28, 0.04]),
  ],
  [
    matter('dust', [0.68, 0.74, 0.16, 0.5, 0.34], [0.18, 0.88, 0.24, 0.72, 0.12]),
    matter('gas', [0.78, 0.82, 0.2, 0.64, 0.3], [0.28, 0.94, 0.52, 0.78, 0.08]),
    matter('core', [0.16, 0.56, 0.48, 0.28, 0.04], [0.94, 1, 1, 0.58, 0.02]),
  ],
  [
    matter('gas', [0.28, 0.94, 0.52, 0.7, 0.08], [0.08, 0.32, 0.38, 0.24, 0.22]),
    matter('core', [0.94, 1, 1, 0.58, 0.02], [1, 0.98, 0.92, 0.2, 0.08]),
    matter('envelope', [0.12, 0.38, 0.66, 0.42, 0.1], [0.82, 0.66, 0.7, 0.2, 0.5]),
  ],
  [
    matter('core', [1, 0.98, 0.92, 0.18, 0.08], [0.96, 0.96, 0.88, 0.2, 0.1]),
    matter('envelope', [0.82, 0.66, 0.7, 0.2, 0.5], [0.96, 0.62, 0.66, 0.28, 0.58]),
    matter('gas', [0.08, 0.32, 0.38, 0.2, 0.22], [0.04, 0.18, 0.3, 0.16, 0.3]),
  ],
  [
    matter('core', [0.96, 0.96, 0.88, 0.2, 0.1], [0.88, 0.94, 0.84, 0.32, 0.1]),
    matter('envelope', [0.96, 0.62, 0.66, 0.28, 0.58], [0.52, 0.34, 0.42, 0.7, 1]),
    matter('ejecta', [0.02, 0.08, 0.32, 0.2, 0.12], [0.62, 0.28, 0.38, 0.76, 1]),
  ],
  [
    matter('envelope', [0.52, 0.34, 0.42, 0.68, 1], [0.08, 0.1, 0.28, 0.22, 1]),
    matter('ejecta', [0.62, 0.28, 0.38, 0.76, 1], [0.72, 0.16, 0.26, 0.34, 1]),
    matter('remnant', [0.18, 0.82, 0.82, 0.18, 0.08], [0.88, 0.96, 0.9, 0.08, 0.1]),
  ],
  [
    matter('ejecta', [0.72, 0.16, 0.26, 0.32, 1], [0.24, 0.06, 0.16, 0.12, 1]),
    matter('remnant', [0.88, 0.96, 0.9, 0.08, 0.1], [0.82, 0.9, 0.72, 0.04, 0.1]),
  ],
  [
    matter('accretion', [0.62, 0.58, 0.92, 0.64, 0.5], [0.96, 0.72, 1, 0.78, 0.72]),
    matter('gas', [0.08, 0.14, 0.42, 0.28, 0.52], [0.18, 0.18, 0.58, 0.4, 0.68]),
  ],
  [
    matter('accretion', [0.42, 0.34, 0.7, 0.44, 0.68], [0, 0, 0, 0, 1]),
    matter('dust', [0.16, 0.12, 0.12, 0.24, 0.72], [0.76, 0.3, 0.1, 0.38, 1]),
    matter('gas', [0.18, 0.14, 0.34, 0.26, 0.72], [0.58, 0.28, 0.18, 0.34, 1]),
  ],
] as const;

const energyProfiles: readonly EnergyKeyframe[] = [
  { start: [0.18, -0.08, -0.06, 0.7, 0], end: [0.24, -0.04, -0.04, 0.58, 0] },
  { start: [0.24, -0.04, -0.04, 0.58, 0], end: [0.36, 0, 0, 0.64, 0.01] },
  { start: [0.36, 0, 0, 0.64, 0.01], end: [0.92, 0.22, 0.12, 0.82, 0.06] },
  { start: [1.28, 0.4, 0.28, 0.76, 0.12], end: [0.88, 0.16, 0.08, 0.28, 0.03] },
  { start: [0.88, 0.16, 0.08, 0.24, 0.02], end: [0.92, 0.14, 0.06, 0.3, 0.02] },
  { start: [0.92, 0.14, 0.04, 0.3, 0.02], end: [1.06, 0.22, 0.06, 0.66, 0.04] },
  { start: [0.96, 0.16, 0.02, 0.66, 0.04], end: [0.62, 0.04, -0.02, 0.34, 0.02] },
  { start: [0.6, 0.08, 0.06, 0.18, 0.01], end: [0.42, 0, -0.04, 0.08, 0] },
  { start: [0.9, 0.3, 0.06, 0.72, 0.12], end: [1.08, 0.36, 0.08, 0.8, 0.15] },
  { start: [0.4, -0.06, -0.08, 0.24, 0.01], end: [0.2, -0.12, -0.1, 0.16, 0] },
] as const;

function sampleMatter(frame: MatterKeyframe, progress: number, reducedMotion: boolean): MatterState {
  const values = frame.start.map((value, index) => lerp(value, frame.end[index], progress));
  return {
    channel: frame.channel,
    amount: clamp01(values[0]),
    density: clamp01(values[1]),
    temperature: clamp01(values[2]),
    turbulence: clamp01(values[3] * (reducedMotion ? 0.45 : 1)),
    expansion: clamp01(values[4]),
  };
}

function sampleEnergy(frame: EnergyKeyframe, progress: number, reducedMotion: boolean): ContinuityEnergy {
  const values = frame.start.map((value, index) => lerp(value, frame.end[index], progress));
  return {
    luminosity: clamp(values[0], 0, 1.5),
    bloomBias: clamp(values[1], -0.35, 0.45),
    exposureBias: clamp(values[2], -0.3, 0.35),
    turbulence: clamp01(values[3] * (reducedMotion ? 0.42 : 1)),
    chromaticBias: clamp(values[4], 0, 0.15),
  };
}

function resolveBlend(chapterIndex: number, progress: number, currentScene: SceneId, nextScene: SceneId): ContinuityBlend {
  if (chapterIndex >= chapters.length - 1 || currentScene === nextScene) {
    return { outgoingWeight: 1, incomingWeight: 0, transfer: 0 };
  }
  const transition = smoothstep((progress - 0.7) / 0.3);
  if (chapterIndex === 7) {
    const bridge = transition * 0.06;
    return {
      outgoingWeight: clamp01(1 - transition * 0.78),
      incomingWeight: clamp01(transition * 0.78),
      transfer: bridge,
    };
  }
  return {
    outgoingWeight: clamp01(1 - transition * 0.72),
    incomingWeight: clamp01(transition),
    transfer: transition,
  };
}

export function resolveVisualContinuity(input: {
  chapterIndex: number;
  localProgress: number;
  reducedMotion: boolean;
}): VisualContinuityState {
  const rawIndex = Number.isFinite(input.chapterIndex) ? Math.trunc(input.chapterIndex) : 0;
  const chapterIndex = Math.min(chapters.length - 1, Math.max(0, rawIndex));
  const progress = clamp01(input.localProgress);
  const chapter = chapters[chapterIndex] ?? chapters[0];
  const previousChapter = chapters[Math.max(0, chapterIndex - 1)] ?? chapter;
  const nextChapter = chapters[Math.min(chapters.length - 1, chapterIndex + 1)] ?? chapter;
  const frames = matterProfiles[chapterIndex] ?? matterProfiles[0];
  const energyFrame = energyProfiles[chapterIndex] ?? energyProfiles[0];
  const matter = frames.map((frame) => sampleMatter(frame, progress, input.reducedMotion));
  return {
    previousScene: previousChapter.scene,
    currentScene: chapter.scene,
    nextScene: nextChapter.scene,
    matter,
    blend: resolveBlend(chapterIndex, progress, chapter.scene, nextChapter.scene),
    energy: sampleEnergy(energyFrame, progress, input.reducedMotion),
  };
}
