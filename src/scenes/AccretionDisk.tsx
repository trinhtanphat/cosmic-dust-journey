import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { diskFragmentShader, diskVertexShader } from '../shaders/diskMaterial';

interface AccretionDiskProps {
  opacity: number;
  disturbance: number;
  warp: number;
  qualityScale: number;
  pointer: { x: number; y: number };
}

export default function AccretionDisk({ opacity, disturbance, warp, qualityScale, pointer }: AccretionDiskProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const radialSegments = qualityScale < 0.7 ? 128 : 256;
  const secondarySegments = qualityScale < 0.7 ? 96 : 192;
  const sphereSegments = qualityScale < 0.7 ? 40 : 64;
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: opacity },
    uDisturbance: { value: disturbance },
    uWarp: { value: warp },
    uPointer: { value: new THREE.Vector2() },
    uQualityScale: { value: qualityScale },
  }), [disturbance, opacity, qualityScale, warp]);

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.elapsedTime;
    material.current.uniforms.uOpacity.value = opacity;
    material.current.uniforms.uDisturbance.value = disturbance;
    material.current.uniforms.uWarp.value = warp;
    material.current.uniforms.uPointer.value.set(pointer.x, pointer.y);
    material.current.uniforms.uQualityScale.value = qualityScale;
  });

  return (
    <group rotation={[1.02, 0, 0.18]}>
      <mesh>
        <ringGeometry args={[1.25, 5.2, radialSegments, 4]} />
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
        <ringGeometry args={[1.35, 4.6, secondarySegments, 2]} />
        <meshBasicMaterial color="#ff5a18" transparent opacity={opacity * (0.08 + warp * 0.07)} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.05, sphereSegments, sphereSegments]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh scale={1.14 + warp * 0.12}>
        <sphereGeometry args={[1.05, sphereSegments, sphereSegments]} />
        <meshBasicMaterial color="#ffb451" transparent opacity={opacity * (0.04 + warp * 0.07)} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
