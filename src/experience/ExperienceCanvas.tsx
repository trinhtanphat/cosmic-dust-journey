import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, type PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { chapters } from '../content/chapters';
import { interactionImpulse } from './interactions';
import { useExperienceStore } from './store';
import SceneDirector from '../scenes/SceneDirector';
import StarField from '../scenes/StarField';

function CameraRig() {
  const pointer = useExperienceStore((state) => state.pointer);
  const progress = useExperienceStore((state) => state.globalProgress);
  const reducedMotion = useExperienceStore((state) => state.quality.reducedMotion);
  useFrame(({ camera }, delta) => {
    const factor = reducedMotion ? 0.02 : Math.min(1, delta * 2.4);
    const targetX = pointer.x * (reducedMotion ? 0.05 : 0.42);
    const targetY = pointer.y * (reducedMotion ? 0.03 : 0.24) + Math.sin(progress * Math.PI * 5) * (reducedMotion ? 0 : 0.11);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, factor);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, factor);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 9 - progress * 0.7, factor * 0.4);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function ExperienceCanvas() {
  const quality = useExperienceStore((state) => state.quality);
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const localProgress = useExperienceStore((state) => state.localProgress);
  const setPointer = useExperienceStore((state) => state.setPointer);
  const setImpulse = useExperienceStore((state) => state.setImpulse);
  const scene = chapters[Math.max(0, chapterIndex)]?.scene ?? 'dust';

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    const pointer = { x, y };
    setPointer(pointer);
    const impulse = interactionImpulse(scene, 'move', localProgress);
    if (impulse.kind !== 'none') setImpulse({ ...impulse, at: Date.now() });
  };

  const click = () => {
    const impulse = interactionImpulse(scene, 'click', localProgress);
    if (impulse.kind !== 'none') setImpulse({ ...impulse, at: Date.now() });
  };

  return (
    <div className="experience-canvas" aria-hidden="true" onPointerMove={updatePointer} onClick={click}>
      <Canvas
        dpr={quality.dpr}
        camera={{ position: [0, 0, 9], fov: 46, near: 0.1, far: 120 }}
        gl={{ antialias: quality.tier !== 'low', alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020308']} />
        <fog attach="fog" args={['#020308', 14, 58]} />
        <Suspense fallback={null}>
          <StarField count={quality.tier === 'low' ? 500 : 1200} />
          <SceneDirector />
          <CameraRig />
        </Suspense>
      </Canvas>
    </div>
  );
}
