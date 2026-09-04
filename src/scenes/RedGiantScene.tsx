import OrbitRings from './OrbitRings';
import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import { resolveStellarSurfaceIntent } from '../shaders/stellarSurface';
import type { SceneProps } from './sceneTypes';

export default function RedGiantScene({ model, progress, opacity = 1, pointer, impulse, cinematic, continuity }: SceneProps) {
  const instability = Math.max(model.shellInstability, cinematic.shell);
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
    <group>
      <StellarCore radius={surface.radius} intensity={surface.luminosity} opacity={opacity} hue={surface.hue} corona={surface.limbGlow} turbulence={surface.turbulence} flash={model.glowResponse * instability * 0.2} qualityScale={surface.qualityScale} />
      <OrbitRings opacity={0.09 * opacity} swallowed={progress * 0.8} />
      <ParticleCloud count={Math.max(2200, Math.floor(model.particleCount * 0.12))} spread={surface.radius * 1.35} tint="#ff6b2e" opacity={(0.12 + instability * 0.1) * opacity} pointer={pointer} impulse={impulse} pointSize={8.6} seed={6659} rotationSpeed={0.013 + instability * 0.018} radialMotion={instability * 0.36} densityMorph={0.72 + instability * 0.28} />
    </group>
  );
}
