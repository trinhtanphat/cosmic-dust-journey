import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function DustCloudScene({ model, opacity = 1, pointer, impulse, cinematic }: SceneProps) {
  const density = Math.max(0.18, cinematic.densityScale);
  return (
    <group>
      <ParticleCloud count={model.particleCount} spread={model.particleSpread} tint="#7e8fb7" opacity={0.58 * opacity} pointer={pointer} impulse={impulse} pointSize={7.5} densityMorph={density} layerDepth={-0.8} />
      <ParticleCloud count={Math.max(1200, Math.floor(model.particleCount * 0.2))} spread={model.particleSpread * 0.7} tint="#d7a98f" opacity={0.24 * opacity} pointer={pointer} impulse={impulse} seed={8128} rotationSpeed={-0.016} densityMorph={density} layerDepth={0.4} />
      <ParticleCloud count={Math.max(700, Math.floor(model.particleCount * 0.09))} spread={model.particleSpread * 1.18} tint="#8fa8d7" opacity={0.13 * opacity} pointer={pointer} impulse={impulse} seed={3911} rotationSpeed={0.009} densityMorph={density} layerDepth={1.1} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity * 0.35} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} />
    </group>
  );
}
