import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function CollapseScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  return (
    <group>
      <ParticleCloud count={model.particleCount} spread={model.particleSpread} tint="#d6a378" opacity={0.78 * opacity} pointer={pointer} impulse={impulse} pointSize={7.2} rotationSpeed={0.18} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} />
    </group>
  );
}
