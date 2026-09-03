import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function DustCloudScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  return (
    <group>
      <ParticleCloud count={model.particleCount} spread={model.particleSpread} tint="#7e8fb7" opacity={0.72 * opacity} pointer={pointer} impulse={impulse} pointSize={7.5} />
      <ParticleCloud count={Math.max(1200, Math.floor(model.particleCount * 0.18))} spread={model.particleSpread * 0.62} tint="#d7a98f" opacity={0.22 * opacity} pointer={pointer} impulse={impulse} seed={8128} rotationSpeed={-0.016} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity * 0.35} hue={model.hue} corona={model.corona} />
    </group>
  );
}
