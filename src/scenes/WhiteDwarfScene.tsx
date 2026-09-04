import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';
import { matterChannel, resolveVolumetricBands, volumetricQualityFromParticleCount } from './volumetricContinuity';

const tints = ['#7f82c8', '#94a4e8', '#655f9e'] as const;

export default function WhiteDwarfScene({ model, progress, opacity = 1, pointer, impulse, cinematic, continuity }: SceneProps) {
  const ejecta = matterChannel(continuity, 'ejecta');
  const remnant = matterChannel(continuity, 'remnant');
  const baseCount = Math.max(2000, Math.floor(model.particleCount * 0.16));
  const bands = resolveVolumetricBands({
    seed: 7741,
    quality: volumetricQualityFromParticleCount(model.particleCount),
    density: Math.max(ejecta.density, 0.08),
    turbulence: ejecta.turbulence,
  });
  const retainedEjecta = Math.max(0.08, ejecta.amount);

  return (
    <group scale={0.98 + cinematic.radialScale * 0.02}>
      {bands.map((band) => (
        <ParticleCloud
          key={band.index}
          count={Math.max(500, Math.floor(baseCount * band.countScale * 1.25))}
          spread={model.particleSpread * band.spreadScale * (0.96 + ejecta.expansion * 0.16)}
          tint={tints[band.index] ?? tints[0]}
          opacity={model.nebulaOpacity * opacity * 0.28 * band.opacityScale * retainedEjecta}
          pointer={pointer}
          impulse={impulse}
          seed={band.seed}
          rotationSpeed={(0.006 + band.turbulenceScale * 0.008) * (band.index === 1 ? -1 : 1)}
          radialMotion={0.03 + ejecta.expansion * 0.035}
          densityMorph={Math.max(0.25, cinematic.densityScale * band.densityScale)}
          layerDepth={band.depth}
          phase={progress}
        />
      ))}
      <StellarCore radius={model.starRadius} intensity={model.starIntensity * (0.85 + remnant.amount * 0.15)} opacity={opacity} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} flash={model.glowResponse * 0.12} />
    </group>
  );
}
