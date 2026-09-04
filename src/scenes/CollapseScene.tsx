import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function CollapseScene({ model, progress, opacity = 1, pointer, impulse, cinematic }: SceneProps) {
  return (
    <group rotation={[0, 0, progress * 0.08]}>
      <ParticleCloud count={model.particleCount} spread={model.particleSpread} tint="#d6a378" opacity={0.78 * opacity} pointer={pointer} impulse={impulse} pointSize={7.2} rotationSpeed={0.18 + progress * 0.16} densityMorph={cinematic.densityScale} radialMotion={-(1 - cinematic.radialScale) * 0.8 - progress * 0.18} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} flash={model.glowResponse * cinematic.flash} />
    </group>
  );
}
