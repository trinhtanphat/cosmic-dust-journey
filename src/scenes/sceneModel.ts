import type { QualityProfile } from '../app/quality.ts';
import type { SceneId } from '../content/types.ts';

export interface SceneVisualModel {
  starRadius: number;
  starIntensity: number;
  particleSpread: number;
  particleCount: number;
  corona: number;
  nebulaOpacity: number;
  diskOpacity: number;
  blackHoleVisible: boolean;
  hue: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);

export function sceneModel(scene: SceneId, progress: number, quality: QualityProfile): SceneVisualModel {
  const p = clamp01(progress);
  const base: SceneVisualModel = {
    starRadius: 0,
    starIntensity: 0,
    particleSpread: 12,
    particleCount: quality.particleBudget,
    corona: 0,
    nebulaOpacity: 0,
    diskOpacity: 0,
    blackHoleVisible: false,
    hue: 0.6,
  };

  switch (scene) {
    case 'dust':
      return { ...base, particleSpread: lerp(15, 10, p), starRadius: 0.08, starIntensity: 0.08, hue: 0.64 };
    case 'collapse':
      return { ...base, particleSpread: lerp(10, 2.3, p), starRadius: lerp(0.12, 0.8, p), starIntensity: lerp(0.2, 1.2, p), corona: p * 0.35, hue: 0.1 };
    case 'fusion':
      return { ...base, particleSpread: 3, starRadius: lerp(0.8, 1.35, p), starIntensity: lerp(1.5, 4.2, p), corona: lerp(0.6, 1.4, p), hue: 0.1 };
    case 'main-sequence':
      return { ...base, particleSpread: 6, starRadius: 1.35, starIntensity: 3.4, corona: 1.1, hue: 0.1 };
    case 'red-giant':
      return { ...base, particleSpread: 8, starRadius: lerp(1.5, 5.5, p), starIntensity: lerp(3.1, 2.2, p), corona: 1.6, hue: 0.015 };
    case 'nebula':
      return { ...base, particleSpread: lerp(5, 18, p), starRadius: lerp(3, 0.7, p), starIntensity: 2.4, corona: 0.6, nebulaOpacity: lerp(0.25, 1, p), hue: 0.82 };
    case 'white-dwarf':
      return { ...base, particleSpread: 18, starRadius: lerp(0.7, 0.26, p), starIntensity: 4.5, corona: 0.18, nebulaOpacity: lerp(0.8, 0.3, p), hue: 0.56 };
    case 'black-hole':
      return { ...base, particleSpread: 9, starRadius: 0, starIntensity: 0, diskOpacity: lerp(0.45, 1, p), blackHoleVisible: true, hue: 0.07 };
  }
}
