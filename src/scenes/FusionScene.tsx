import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function FusionScene({ model, opacity = 1, pointer, impulse, cinematic }: SceneProps) {
  const flash = Math.max(model.glowResponse * 0.75, cinematic.flash);
  return (
    <group>
      <ParticleCloud count={Math.floor(model.particleCount * 0.52)} spread={model.particleSpread} tint="#ffc97f" opacity={0.35 * opacity} pointer={pointer} impulse={impulse} pointSize={8} radialMotion={model.glowResponse * 0.9} densityMorph={0.75 + model.glowResponse * 0.25} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} flash={flash} />
      <mesh scale={2.3 + model.corona * 0.7 + flash * 0.5}>
        <ringGeometry args={[0.98, 1, 128]} />
        <meshBasicMaterial color="#ffd19a" transparent opacity={(0.12 + flash * 0.12) * opacity} depthWrite={false} />
      </mesh>
    </group>
  );
}
