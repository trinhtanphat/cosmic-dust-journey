import OrbitRings from './OrbitRings';
import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function RedGiantScene({ model, progress, opacity = 1, pointer, impulse }: SceneProps) {
  return (
    <group>
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} />
      <OrbitRings opacity={0.09 * opacity} swallowed={progress * 0.8} />
      <ParticleCloud count={Math.max(2200, Math.floor(model.particleCount * 0.12))} spread={model.starRadius * 1.35} tint="#ff6b2e" opacity={0.16 * opacity} pointer={pointer} impulse={impulse} pointSize={8.6} seed={6659} rotationSpeed={0.013} />
    </group>
  );
}
