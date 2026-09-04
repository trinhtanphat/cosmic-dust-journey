import OrbitRings from './OrbitRings';
import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import { resolveStellarSurfaceIntent } from '../shaders/stellarSurface';
import type { SceneProps } from './sceneTypes';

export default function MainSequenceScene({ model, opacity = 1, pointer, impulse, cinematic, continuity }: SceneProps) {
  const surface = resolveStellarSurfaceIntent({
    continuity,
    fallback: {
      radius: model.starRadius,
      luminosity: model.starIntensity,
      hue: model.hue,
      turbulence: model.surfaceTurbulence,
      limbGlow: model.corona,
    },
    qualityScale: 1,
  });

  return (
    <group scale={0.96 + cinematic.radialScale * 0.04}>
      <StellarCore radius={surface.radius} intensity={surface.luminosity} opacity={opacity} hue={surface.hue} corona={surface.limbGlow} turbulence={surface.turbulence} qualityScale={surface.qualityScale} />
      <OrbitRings opacity={0.18 * opacity} />
      <ParticleCloud count={Math.max(1800, Math.floor(model.particleCount * 0.1))} spread={model.particleSpread} tint="#e2e9ff" opacity={0.24 * opacity} pointer={pointer} impulse={impulse} pointSize={5.2} seed={5077} rotationSpeed={0.055} densityMorph={cinematic.densityScale} radialMotion={(cinematic.radialScale - 0.5) * 0.08} />
    </group>
  );
}
