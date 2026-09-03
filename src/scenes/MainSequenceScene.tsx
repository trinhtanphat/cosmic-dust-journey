import OrbitRings from './OrbitRings';
import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function MainSequenceScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  return (
    <group>
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} />
      <OrbitRings opacity={0.18 * opacity} />
      <ParticleCloud count={Math.max(1800, Math.floor(model.particleCount * 0.1))} spread={model.particleSpread} tint="#e2e9ff" opacity={0.24 * opacity} pointer={pointer} impulse={impulse} pointSize={5.2} seed={5077} rotationSpeed={0.055} />
    </group>
  );
}
