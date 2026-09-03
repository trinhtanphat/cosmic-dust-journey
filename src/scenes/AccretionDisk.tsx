import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { diskFragmentShader, diskVertexShader } from '../shaders/diskMaterial';

export default function AccretionDisk({ opacity, disturbance }: { opacity: number; disturbance: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: opacity },
    uDisturbance: { value: disturbance },
  }), [disturbance, opacity]);

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.elapsedTime;
    material.current.uniforms.uOpacity.value = opacity;
    material.current.uniforms.uDisturbance.value = disturbance;
  });

  return (
    <group rotation={[1.02, 0, 0.18]}>
      <mesh>
        <ringGeometry args={[1.25, 5.2, 256, 4]} />
        <shaderMaterial
          ref={material}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={diskVertexShader}
          fragmentShader={diskFragmentShader}
        />
      </mesh>
      <mesh scale={[1, 1, 1.02]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[1.35, 4.6, 192, 2]} />
        <meshBasicMaterial color="#ff5a18" transparent opacity={opacity * 0.11} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh scale={1.14}>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshBasicMaterial color="#ffb451" transparent opacity={opacity * 0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
