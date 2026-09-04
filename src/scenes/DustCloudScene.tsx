import ParticleCloud from './ParticleCloud';
import StellarCore from './StellarCore';
import type { SceneProps } from './sceneTypes';
import { matterChannel, resolveVolumetricBands, volumetricQualityFromParticleCount } from './volumetricContinuity';

const tints = ['#7e8fb7', '#d7a98f', '#8fa8d7'] as const;
const rotations = [0.025, -0.016, 0.009] as const;

export default function DustCloudScene({ model, progress, opacity = 1, pointer, impulse, cinematic, continuity }: SceneProps) {
  const dust = matterChannel(continuity, 'dust');
  const gas = matterChannel(continuity, 'gas');
  const density = Math.max(0.18, cinematic.densityScale, dust.density, gas.density * 0.85);
  const turbulence = Math.max(dust.turbulence, gas.turbulence * 0.8);
  const bands = resolveVolumetricBands({
    seed: 1776,
    quality: volumetricQualityFromParticleCount(model.particleCount),
    density,
    turbulence,
  });
  const inheritedMatter = Math.max(0.35, dust.amount, gas.amount * 0.72);
  const expansion = Math.max(dust.expansion, gas.expansion * 0.8);

  return (
    <group>
      {bands.map((band) => (
        <ParticleCloud
          key={band.index}
          count={Math.max(700, Math.floor(model.particleCount * band.countScale))}
          spread={model.particleSpread * band.spreadScale * (0.92 + expansion * 0.08)}
          tint={tints[band.index] ?? tints[0]}
          opacity={0.58 * opacity * band.opacityScale * inheritedMatter}
          pointer={pointer}
          impulse={impulse}
          pointSize={7.5 - band.index * 0.6}
          seed={band.seed}
          rotationSpeed={(rotations[band.index] ?? rotations[0]) * (0.6 + band.turbulenceScale * 0.7)}
          densityMorph={Math.max(0.18, cinematic.densityScale * band.densityScale)}
          layerDepth={band.depth}
          phase={progress}
        />
      ))}
      <StellarCore radius={model.starRadius} intensity={model.starIntensity} opacity={opacity * 0.35} hue={model.hue} corona={model.corona} turbulence={model.surfaceTurbulence} />
    </group>
  );
}
