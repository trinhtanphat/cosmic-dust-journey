import { useMemo } from 'react';
import * as THREE from 'three';

export default function StarField({ count = 1200 }: { count?: number }) {
  const positions = useMemo(() => {
    let seed = 99173;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
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
      <pointsMaterial size={0.035} color="#cad7ff" transparent opacity={0.52} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
