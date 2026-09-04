import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';
import { matterChannel, resolveVolumetricBands, volumetricQualityFromParticleCount } from './volumetricContinuity';

const tints = ['#9c62ff', '#47c9d6', '#ff6f91'] as const;
const rotations = [0.018, -0.022, 0.03] as const;

export default function NebulaScene({ model, progress, opacity = 1, pointer, impulse, cinematic, continuity }: SceneProps) {
  const ejecta = matterChannel(continuity, 'ejecta');
  const remnant = matterChannel(continuity, 'remnant');
  const base = Math.max(1, Math.floor(model.particleCount * 0.44));
  const ejection = Math.max(model.ejection, cinematic.shell, ejecta.expansion * 0.72);
  const bands = resolveVolumetricBands({
    seed: 1701,
    quality: volumetricQualityFromParticleCount(model.particleCount),
    density: Math.max(ejecta.density, remnant.density * 0.16),
    turbulence: Math.max(ejecta.turbulence, remnant.turbulence * 0.3),
  });
  const retainedEjecta = Math.max(0.2, ejecta.amount);

  return (
    <group>
      {bands.map((band) => (
        <ParticleCloud
          key={band.index}
          count={Math.max(900, Math.floor(base * band.countScale * 1.35))}
          spread={model.particleSpread * band.spreadScale * (0.9 + ejecta.expansion * 0.22)}
          tint={tints[band.index] ?? tints[0]}
          opacity={model.nebulaOpacity * opacity * 0.6 * band.opacityScale * retainedEjecta}
          pointer={pointer}
          impulse={impulse}
          pointSize={9 - band.index * 1.1}
          seed={band.seed}
          rotationSpeed={(rotations[band.index] ?? rotations[0]) * (0.75 + band.turbulenceScale * 0.65)}
          radialMotion={ejection * (0.62 - band.index * 0.12)}
          densityMorph={Math.max(0.2, cinematic.densityScale * band.densityScale)}
          layerDepth={band.depth}
          phase={progress}
        />
      ))}
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={0.57} corona={model.corona} turbulence={model.surfaceTurbulence} flash={model.glowResponse * 0.15} />
    </group>
  );
}
