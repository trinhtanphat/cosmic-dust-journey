import AccretionDisk from './AccretionDisk';
import ParticleCloud from './ParticleCloud';
import type { SceneProps } from './sceneTypes';

export default function BlackHoleScene({ model, opacity = 1, pointer, impulse }: SceneProps) {
  const disturbance = impulse.kind === 'disk-disturbance' ? impulse.strength : 0;
  return (
    <group>
      <ParticleCloud count={Math.max(1400, Math.floor(model.particleCount * 0.1))} spread={model.particleSpread} tint="#9fa8c9" opacity={0.12 * opacity} pointer={pointer} impulse={impulse} pointSize={4.2} seed={9119} rotationSpeed={0.08} />
      {model.blackHoleVisible && <AccretionDisk opacity={model.diskOpacity * opacity} disturbance={disturbance} />}
    </group>
  );
}
