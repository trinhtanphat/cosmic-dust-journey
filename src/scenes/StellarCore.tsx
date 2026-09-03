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
}

function palette(hue: number) {
  const core = new THREE.Color().setHSL(hue, 0.68, hue < 0.08 ? 0.62 : 0.74);
  const edge = new THREE.Color().setHSL(hue, 0.9, hue < 0.08 ? 0.28 : 0.42);
  return { core, edge };
}

export default function StellarCore({ radius, intensity, opacity, hue, corona = 0 }: StellarCoreProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const colors = useMemo(() => palette(hue), [hue]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uCoreColor: { value: colors.core },
    uEdgeColor: { value: colors.edge },
    uOpacity: { value: opacity },
  }), [colors, intensity, opacity]);

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.elapsedTime;
    material.current.uniforms.uIntensity.value = intensity;
    material.current.uniforms.uOpacity.value = opacity;
  });

  if (radius <= 0.01 || opacity <= 0.001) return null;
  return (
    <group scale={radius}>
      <mesh>
        <icosahedronGeometry args={[1, 5]} />
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
        <mesh scale={1 + corona * 0.22}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshBasicMaterial
            color={colors.edge}
            transparent
            opacity={Math.min(0.17, corona * 0.09) * opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      <pointLight intensity={Math.min(90, intensity * 13)} distance={40} decay={1.5} color={colors.core} />
    </group>
  );
}
