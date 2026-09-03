import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function NebulaScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  const base = Math.floor(model.particleCount * 0.44);
  return (
    <group>
      <ParticleCloud count={base} spread={model.particleSpread} tint="#9c62ff" opacity={model.nebulaOpacity * opacity * 0.44} pointer={pointer} impulse={impulse} pointSize={9} seed={1701} rotationSpeed={0.018} />
      <ParticleCloud count={Math.max(1600, Math.floor(base * 0.58))} spread={model.particleSpread * 0.66} tint="#47c9d6" opacity={model.nebulaOpacity * opacity * 0.34} pointer={pointer} impulse={impulse} pointSize={7.2} seed={2003} rotationSpeed={-0.022} />
      <ParticleCloud count={Math.max(1300, Math.floor(base * 0.35))} spread={model.particleSpread * 0.42} tint="#ff6f91" opacity={model.nebulaOpacity * opacity * 0.2} pointer={pointer} impulse={impulse} pointSize={6.5} seed={4079} rotationSpeed={0.03} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={0.57} corona={model.corona} />
    </group>
  );
}
