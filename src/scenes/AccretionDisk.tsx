import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { diskFragmentShader, diskVertexShader } from '../shaders/diskMaterial';

interface AccretionDiskProps {
  opacity: number;
  disturbance: number;
  warp: number;
  lensing: number;
  qualityScale: number;
  secondaryDistortion: boolean;
  innerTemperature: number;
  outerTemperature: number;
  brightnessSkew: number;
  pointer: { x: number; y: number };
}

export default function AccretionDisk({
  opacity,
  disturbance,
  warp,
  lensing,
  qualityScale,
  secondaryDistortion,
  innerTemperature,
  outerTemperature,
  brightnessSkew,
  pointer,
}: AccretionDiskProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const radialSegments = qualityScale < 0.7 ? 128 : 256;
  const secondarySegments = qualityScale < 0.7 ? 96 : 192;
  const sphereSegments = qualityScale < 0.7 ? 40 : 64;
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: opacity },
    uDisturbance: { value: disturbance },
    uWarp: { value: warp },
    uLensing: { value: lensing },
    uPointer: { value: new THREE.Vector2() },
    uQualityScale: { value: qualityScale },
    uSecondaryDistortion: { value: secondaryDistortion ? 1 : 0 },
    uInnerTemperature: { value: innerTemperature },
    uOuterTemperature: { value: outerTemperature },
    uBrightnessSkew: { value: brightnessSkew },
  }), [brightnessSkew, disturbance, innerTemperature, lensing, opacity, outerTemperature, qualityScale, secondaryDistortion, warp]);

  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.elapsedTime;
    material.current.uniforms.uOpacity.value = opacity;
    material.current.uniforms.uDisturbance.value = disturbance;
    material.current.uniforms.uWarp.value = warp;
    material.current.uniforms.uLensing.value = lensing;
    material.current.uniforms.uPointer.value.set(pointer.x, pointer.y);
    material.current.uniforms.uQualityScale.value = qualityScale;
    material.current.uniforms.uSecondaryDistortion.value = secondaryDistortion ? 1 : 0;
    material.current.uniforms.uInnerTemperature.value = innerTemperature;
    material.current.uniforms.uOuterTemperature.value = outerTemperature;
    material.current.uniforms.uBrightnessSkew.value = brightnessSkew;
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
        <meshBasicMaterial color="#ff5a18" transparent opacity={secondaryDistortion ? opacity * (0.08 + warp * 0.07) : 0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.05, sphereSegments, sphereSegments]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh scale={1.14 + lensing * 0.12}>
        <sphereGeometry args={[1.05, sphereSegments, sphereSegments]} />
        <meshBasicMaterial color="#ffb451" transparent opacity={opacity * (0.04 + lensing * 0.07)} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
