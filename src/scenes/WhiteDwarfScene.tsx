import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function WhiteDwarfScene({ model, opacity = 1, pointer, impulse, cinematic }: SceneProps) {
  return (
    <group scale={0.98 + cinematic.radialScale * 0.02}>
      <ParticleCloud count={Math.max(2000, Math.floor(model.particleCount * 0.16))} spread={model.particleSpread} tint="#7f82c8" opacity={model.nebulaOpacity * opacity * 0.17} pointer={pointer} impulse={impulse} seed={7741} rotationSpeed={0.006} radialMotion={0.03} densityMorph={Math.max(0.35, cinematic.densityScale)} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} flash={model.glowResponse * 0.12} />
    </group>
  );
}
