import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';

export default function FusionScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  return (
    <group>
      <ParticleCloud count={Math.floor(model.particleCount * 0.52)} spread={model.particleSpread} tint="#ffc97f" opacity={0.35 * opacity} pointer={pointer} impulse={impulse} pointSize={8} />
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} />
      <mesh scale={2.3 + model.corona * 0.7}>
        <ringGeometry args={[0.98, 1, 128]} />
        <meshBasicMaterial color="#ffd19a" transparent opacity={0.16 * opacity} depthWrite={false} />
      </mesh>
    </group>
  );
}
