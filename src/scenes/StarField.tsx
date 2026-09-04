import { useMemo } from 'react';
import * as THREE from 'three';

export default function StarField({ count = 1200, qualityScale = 1 }: { count?: number; qualityScale?: number }) {
  const positions = useMemo(() => {
    let seed = 99173;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const safeCount = Math.max(120, Math.floor(count));
    const data = new Float32Array(safeCount * 3);
    for (let i = 0; i < safeCount; i += 1) {
      const z = -8 - random() * 48;
      const spread = 20 + Math.abs(z) * 0.4;
      data[i * 3] = (random() - 0.5) * spread;
      data[i * 3 + 1] = (random() - 0.5) * spread;
      data[i * 3 + 2] = z;
    }
    return data;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028 + Math.max(0.35, qualityScale) * 0.008}
        color="#cad7ff"
        transparent
        opacity={0.36 + Math.max(0.35, qualityScale) * 0.16}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
