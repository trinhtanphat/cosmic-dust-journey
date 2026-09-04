import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';
import { matterChannel, resolveVolumetricBands, volumetricQualityFromParticleCount } from './volumetricContinuity';

const tints = ['#d6a378', '#efbe8a', '#bd8f78'] as const;

export default function CollapseScene({ model, progress, opacity = 1, pointer, impulse, cinematic, continuity }: SceneProps) {
  const dust = matterChannel(continuity, 'dust');
  const gas = matterChannel(continuity, 'gas');
  const core = matterChannel(continuity, 'core');
  const density = Math.max(dust.density, gas.density, core.density * 0.7);
  const turbulence = Math.max(dust.turbulence, gas.turbulence, core.turbulence);
  const bands = resolveVolumetricBands({
    seed: 2753,
    quality: volumetricQualityFromParticleCount(model.particleCount),
    density,
    turbulence,
  });
  const inheritedMatter = Math.max(0.4, dust.amount * 0.75 + gas.amount * 0.25);
  const concentration = Math.max(0.15, density);

  return (
    <group rotation={[0, 0, progress * 0.08]}>
      {bands.map((band) => (
        <ParticleCloud
          key={band.index}
          count={Math.max(850, Math.floor(model.particleCount * band.countScale))}
          spread={model.particleSpread * band.spreadScale * (1.05 - concentration * 0.12)}
          tint={tints[band.index] ?? tints[0]}
          opacity={0.78 * opacity * band.opacityScale * inheritedMatter}
          pointer={pointer}
          impulse={impulse}
          pointSize={7.2 - band.index * 0.45}
          seed={band.seed}
          rotationSpeed={(0.18 + progress * 0.16) * (1 + band.turbulenceScale * 0.3) * (band.index === 1 ? -0.75 : 1)}
          densityMorph={Math.max(0.2, cinematic.densityScale * band.densityScale)}
          radialMotion={-(1 - cinematic.radialScale) * 0.8 - progress * 0.18 - concentration * 0.08}
          layerDepth={band.depth * 0.72}
          phase={progress}
        />
      ))}
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} flash={model.glowResponse * cinematic.flash} />
    </group>
  );
}
