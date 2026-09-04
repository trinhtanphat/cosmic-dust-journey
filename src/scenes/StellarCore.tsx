import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { starFragmentShader, starVertexShader } from '../shaders/starMaterial';

interface StellarCoreProps {
  radius: number;
  intensity: number;
  opacity: number;
  hue: number;
  corona?: number;
  turbulence?: number;
  flash?: number;
  qualityScale?: number;
}

function palette(hue: number) {
  const core = new THREE.Color().setHSL(hue, 0.68, hue < 0.08 ? 0.62 : 0.74);
  const edge = new THREE.Color().setHSL(hue, 0.9, hue < 0.08 ? 0.28 : 0.42);
  return { core, edge };
}

export default function StellarCore({
  radius,
  intensity,
  opacity,
  hue,
  corona = 0,
  turbulence = 0.35,
  flash = 0,
  qualityScale = 1,
}: StellarCoreProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const colors = useMemo(() => palette(hue), [hue]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uCoreColor: { value: colors.core },
    uEdgeColor: { value: colors.edge },
    uOpacity: { value: opacity },
    uTurbulence: { value: turbulence },
    uFlash: { value: flash },
    uQualityScale: { value: qualityScale },
  }), [colors, flash, intensity, opacity, qualityScale, turbulence]);
  const detail = qualityScale < 0.7 ? 4 : 5;
  const segments = qualityScale < 0.7 ? 32 : 48;

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.elapsedTime;
    material.current.uniforms.uIntensity.value = intensity;
    material.current.uniforms.uOpacity.value = opacity;
    material.current.uniforms.uTurbulence.value = turbulence;
    material.current.uniforms.uFlash.value = flash;
    material.current.uniforms.uQualityScale.value = qualityScale;
  });

  if (radius <= 0.01 || opacity <= 0.001) return null;
  return (
    <group scale={radius}>
      <mesh>
        <icosahedronGeometry args={[1, detail]} />
        <shaderMaterial
          ref={material}
          transparent
          depthWrite
          uniforms={uniforms}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
        />
      </mesh>
      {corona > 0 && (
        <mesh scale={1 + corona * 0.22 + flash * 0.08}>
          <sphereGeometry args={[1, segments, segments]} />
          <meshBasicMaterial
            color={colors.edge}
            transparent
            opacity={Math.min(0.2, corona * 0.09 + flash * 0.08) * opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      <pointLight intensity={Math.min(100, intensity * 13 + flash * 24)} distance={40} decay={1.5} color={colors.core} />
    </group>
  );
}
