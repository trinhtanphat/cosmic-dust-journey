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
  surfaceTurbulence: number;
  shellInstability: number;
  ejection: number;
  lensing: number;
  glowResponse: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
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
    surfaceTurbulence: 0,
    shellInstability: 0,
    ejection: 0,
    lensing: 0,
    glowResponse: 0,
  };

  switch (scene) {
    case 'dust':
      return {
        ...base,
        particleSpread: lerp(15, 10, p),
        starRadius: 0.08,
        starIntensity: 0.08,
        hue: 0.64,
        surfaceTurbulence: lerp(0.12, 0.24, p),
      };
    case 'collapse':
      return {
        ...base,
        particleSpread: lerp(10, 2.3, p),
        starRadius: lerp(0.12, 0.8, p),
        starIntensity: lerp(0.2, 1.2, p),
        corona: p * 0.35,
        hue: 0.1,
        surfaceTurbulence: lerp(0.22, 0.62, p),
        glowResponse: lerp(0.05, 0.38, p),
      };
    case 'fusion': {
      const flash = Math.sin(p * Math.PI);
      return {
        ...base,
        particleSpread: lerp(2.4, 3.8, p),
        starRadius: lerp(0.8, 1.35, p),
        starIntensity: lerp(1.5, 4.2, p) + flash * 0.9,
        corona: lerp(0.6, 1.4, p),
        hue: 0.1,
        surfaceTurbulence: lerp(0.48, 0.68, p),
        glowResponse: clamp01(flash),
      };
    }
    case 'main-sequence':
      return {
        ...base,
        particleSpread: 6,
        starRadius: 1.35,
        starIntensity: 3.4,
        corona: 1.1,
        hue: 0.1,
        surfaceTurbulence: 0.54,
        glowResponse: 0.42,
      };
    case 'red-giant':
      return {
        ...base,
        particleSpread: lerp(6.5, 9.4, p),
        starRadius: lerp(1.5, 5.5, p),
        starIntensity: lerp(3.1, 2.2, p),
        corona: 1.6,
        hue: 0.015,
        surfaceTurbulence: lerp(0.62, 0.92, p),
        shellInstability: clamp01(Math.pow(p, 1.8)),
        glowResponse: lerp(0.42, 0.26, p),
      };
    case 'nebula':
      return {
        ...base,
        particleSpread: lerp(5, 18, p),
        starRadius: lerp(3, 0.7, p),
        starIntensity: lerp(2.6, 2.1, p),
        corona: lerp(0.8, 0.45, p),
        nebulaOpacity: lerp(0.25, 1, p),
        hue: 0.82,
        surfaceTurbulence: lerp(0.5, 0.2, p),
        ejection: p,
        shellInstability: clamp01(1 - p * 0.55),
        glowResponse: lerp(0.45, 0.25, p),
      };
    case 'white-dwarf':
      return {
        ...base,
        particleSpread: lerp(18, 20, p),
        starRadius: lerp(0.7, 0.26, p),
        starIntensity: lerp(4.8, 3.8, p),
        corona: lerp(0.24, 0.12, p),
        nebulaOpacity: lerp(0.8, 0.3, p),
        hue: 0.56,
        surfaceTurbulence: lerp(0.22, 0.08, p),
        glowResponse: lerp(0.58, 0.34, p),
      };
    case 'black-hole':
      return {
        ...base,
        particleSpread: 9,
        starRadius: 0,
        starIntensity: 0,
        diskOpacity: lerp(0.45, 1, p),
        blackHoleVisible: true,
        hue: 0.07,
        surfaceTurbulence: lerp(0.35, 0.72, p),
        lensing: lerp(0.52, 0.9, p),
        glowResponse: lerp(0.25, 0.5, p),
      };
  }
}
