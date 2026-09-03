import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function WhiteDwarfScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  return (
    <group>
      <ParticleCloud count={Math.max(2000, Math.floor(model.particleCount * 0.16))} spread={model.particleSpread} tint="#7f82c8" opacity={model.nebulaOpacity * opacity * 0.17} pointer={pointer} impulse={impulse} seed={7741} rotationSpeed={0.006} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} />
    </group>
  );
}
