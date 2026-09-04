import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { chapters } from '../content/chapters';
import { observeRuntimeFrame } from '../observability/frame';
import { useObservability } from '../observability/react';
import SceneDirector from '../scenes/SceneDirector';
import StarField from '../scenes/StarField';
import type { CameraPose } from './cameraTrack';
import { sampleGlobalCameraSpline } from './cameraSpline';
import { resolveCinematicState } from './cinematicState';
import { interactionImpulse } from './interactions';
import PostProcessingRig from './PostProcessingRig';
import { createRuntimeQualityState } from './runtimeQuality';
import { useExperienceStore } from './store';
import WebGLRecoveryBoundary from './WebGLRecoveryBoundary';

function FrameQualityProbe() {
  const setAdaptiveLevel = useExperienceStore((state) => state.setAdaptiveLevel);
  const observability = useObservability();
  const runtime = useRef(createRuntimeQualityState());
  useFrame((_, delta) => {
    const previous = runtime.current;
    const next = observeRuntimeFrame(previous, delta * 1000, observability);
    runtime.current = next;
    if (next.level !== previous.level) setAdaptiveLevel(next.level);
  });
  return null;
}

function CameraRig({ pose, reducedMotion }: { pose: CameraPose; reducedMotion: boolean }) {
  const lookTarget = useRef(new THREE.Vector3(...pose.target));
  useFrame(({ camera }, delta) => {
    const factor = Math.min(1, delta * (reducedMotion ? 3.2 : 5.2));
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pose.position[0], factor);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pose.position[1], factor);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, pose.position[2], factor);
    lookTarget.current.lerp(new THREE.Vector3(...pose.target), factor);
    camera.lookAt(lookTarget.current);
    const perspective = camera as THREE.PerspectiveCamera;
    const nextFov = THREE.MathUtils.lerp(perspective.fov, pose.fov, factor);
    if (Math.abs(perspective.fov - nextFov) > 0.001) {
      perspective.fov = nextFov;
      perspective.updateProjectionMatrix();
    }
  });
  return null;
}

export default function ExperienceCanvas({
  onContextLost = () => undefined,
  onContextRestored = () => undefined,
}: {
  onContextLost?: () => void;
  onContextRestored?: () => void;
} = {}) {
  const quality = useExperienceStore((state) => state.quality);
  const chapterIndex = useExperienceStore((state) => state.chapterIndex);
  const adaptiveLevel = useExperienceStore((state) => state.adaptiveLevel);
  const localProgress = useExperienceStore((state) => state.localProgress);
  const pointer = useExperienceStore((state) => state.pointer);
  const setPointer = useExperienceStore((state) => state.setPointer);
  const setImpulse = useExperienceStore((state) => state.setImpulse);
  const chapter = chapters[Math.max(0, chapterIndex)] ?? chapters[0];
  const scene = chapter?.scene ?? 'dust';
  const cinematicState = resolveCinematicState({
    chapterId: chapter?.id ?? 'overture',
    scene,
    localProgress,
    pointer,
    quality,
    adaptiveLevel,
  });
  const cameraPose = sampleGlobalCameraSpline({
    chapterIndex,
    localProgress,
    pointer,
    reducedMotion: quality.reducedMotion,
  });
  const qualityScale = Math.max(0.35, Math.min(1, cinematicState.budget.particleBudget / 64000));

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    const nextPointer = { x, y };
    setPointer(nextPointer);
    const impulse = interactionImpulse(scene, 'move', localProgress, cinematicState.profile.interactionMax);
    if (impulse.kind !== 'none') setImpulse({ ...impulse, at: Date.now() });
  };

  const click = () => {
    const impulse = interactionImpulse(scene, 'click', localProgress, cinematicState.profile.interactionMax);
    if (impulse.kind !== 'none') setImpulse({ ...impulse, at: Date.now() });
  };

  return (
    <div className="experience-canvas" aria-hidden="true" onPointerMove={updatePointer} onClick={click}>
      <Canvas
        dpr={cinematicState.budget.dpr}
        camera={{ position: [0, 0, 9], fov: 46, near: 0.1, far: 120 }}
        gl={{ antialias: cinematicState.budget.shaderComplexity === 'full', alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020308']} />
        <fog attach="fog" args={['#020308', 14, 58]} />
        <WebGLRecoveryBoundary onContextLost={onContextLost} onContextRestored={onContextRestored} />
        <Suspense fallback={null}>
          <StarField
            count={cinematicState.budget.secondaryLayers ? (quality.tier === 'low' ? 500 : 1200) : 320}
            qualityScale={qualityScale}
          />
          <FrameQualityProbe />
          <SceneDirector cinematicState={cinematicState} />
          <CameraRig pose={cameraPose} reducedMotion={quality.reducedMotion} />
          <PostProcessingRig state={cinematicState.postFx} />
        </Suspense>
      </Canvas>
    </div>
  );
}
