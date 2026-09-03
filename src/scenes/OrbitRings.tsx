import * as THREE from 'three';

export default function OrbitRings({ opacity = 0.16, swallowed = 0 }: { opacity?: number; swallowed?: number }) {
  return (
    <group rotation={[1.32, 0, 0.08]}>
      {[2.2, 3.4, 4.7, 6.1].map((radius, index) => {
        const visible = index / 4 >= swallowed;
        return visible ? (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.008, 8, 128]} />
            <meshBasicMaterial color="#9fb9d5" transparent opacity={opacity * (1 - index * 0.12)} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ) : null;
      })}
    </group>
  );
}
