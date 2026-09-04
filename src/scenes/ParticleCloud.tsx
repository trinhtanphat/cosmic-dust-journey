import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { InteractionKind } from '../experience/interactions';
import { particleFragmentShader, particleVertexShader } from '../shaders/particleMaterial';

interface ParticleCloudProps {
  count: number;
  spread: number;
  tint: string;
  opacity: number;
  pointSize?: number;
  pointer: { x: number; y: number };
  impulse: { kind: InteractionKind; strength: number; at: number };
  seed?: number;
  rotationSpeed?: number;
  densityMorph?: number;
  radialMotion?: number;
  layerDepth?: number;
  phase?: number;
}

const modeFor = (kind: InteractionKind) => ({
  shockwave: 0,
  gravity: 1,
  ignition: 2,
  radiation: 3,
  convection: 4,
  'gas-ripple': 5,
  'dwarf-glow': 6,
  'disk-disturbance': 7,
  none: 8,
}[kind]);

function randomFactory(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const normalizedPhase = (phase: number | undefined) =>
  phase === undefined ? undefined : Math.min(1, Math.max(0, Number.isFinite(phase) ? phase : 0));

export default function ParticleCloud({
  count,
  spread,
  tint,
  opacity,
  pointSize = 7,
  pointer,
  impulse,
  seed = 1776,
  rotationSpeed = 0.025,
  densityMorph = 1,
  radialMotion = 0,
  layerDepth = 0,
  phase,
}: ParticleCloudProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const random = randomFactory(seed);
    const safeCount = Math.max(1, Math.floor(count));
    const positions = new Float32Array(safeCount * 3);
    const seeds = new Float32Array(safeCount);
    for (let i = 0; i < safeCount; i += 1) {
      const radius = Math.cbrt(random());
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      seeds[i] = random();
    }
    const value = new THREE.BufferGeometry();
    value.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    value.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return value;
  }, [count, seed]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpread: { value: spread },
    uPointSize: { value: pointSize },
    uImpulse: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uMode: { value: 8 },
    uTint: { value: new THREE.Color(tint) },
    uOpacity: { value: opacity },
    uDensityMorph: { value: densityMorph },
    uRadialMotion: { value: radialMotion },
    uLayerDepth: { value: layerDepth },
  }), [densityMorph, layerDepth, opacity, pointSize, radialMotion, spread, tint]);

  useFrame(({ clock }, delta) => {
    if (!material.current) return;
    const authoredPhase = normalizedPhase(phase);
    const ageSeconds = Math.max(0, (Date.now() - impulse.at) / 1000);
    material.current.uniforms.uTime.value = authoredPhase === undefined ? clock.elapsedTime : authoredPhase * 4;
    material.current.uniforms.uSpread.value = spread;
    material.current.uniforms.uOpacity.value = opacity;
    material.current.uniforms.uDensityMorph.value = densityMorph;
    material.current.uniforms.uRadialMotion.value = radialMotion;
    material.current.uniforms.uLayerDepth.value = layerDepth;
    material.current.uniforms.uImpulse.value = impulse.strength * Math.exp(-ageSeconds * 1.9);
    material.current.uniforms.uMode.value = modeFor(impulse.kind);
    material.current.uniforms.uPointer.value.set(pointer.x, pointer.y);
    if (points.current) {
      if (authoredPhase === undefined) points.current.rotation.y += delta * rotationSpeed;
      else points.current.rotation.y = authoredPhase * rotationSpeed * 4;
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
      />
    </points>
  );
}
