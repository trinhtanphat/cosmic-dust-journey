import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { PostFxState } from './postfx';

const fringeShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - 0.5;
      vec2 offset = dir * amount * 0.012;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      float a = texture2D(tDiffuse, vUv).a;
      gl_FragColor = vec4(r, g, b, a);
    }
  `,
};

export default function PostProcessingRig({ state }: { state: PostFxState }) {
  const { gl, scene, camera, size } = useThree();
  const pipeline = useMemo(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.25, 0.7);
    const fringePass = new ShaderPass(fringeShader);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(fringePass);
    return { composer, bloomPass, fringePass };
  }, [camera, gl, scene]);

  useEffect(() => {
    pipeline.composer.setSize(size.width, size.height);
  }, [pipeline, size.height, size.width]);

  useEffect(() => () => pipeline.composer.dispose(), [pipeline]);

  useFrame(() => {
    const { composer, bloomPass, fringePass } = pipeline;
    gl.toneMappingExposure = state.enabled ? state.exposure : 1;
    bloomPass.enabled = state.enabled && state.bloomStrength > 0.001;
    bloomPass.strength = state.bloomStrength;
    bloomPass.radius = state.bloomRadius;
    bloomPass.threshold = state.bloomThreshold;
    fringePass.enabled = state.enabled && state.chromaticFringe > 0.001;
    fringePass.uniforms.amount.value = state.chromaticFringe;
    if (state.enabled) composer.render();
    else gl.render(scene, camera);
  }, 1);

  return null;
}
