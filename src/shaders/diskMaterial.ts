export const diskVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDisturbance;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 p = position;
    float angle = atan(p.y, p.x);
    float radius = length(p.xy);
    float wave = sin(angle * 10.0 - uTime * 3.0 + radius * 2.0) * 0.08;
    p.z += wave * (0.4 + uDisturbance);
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const diskFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    float radial = abs(vUv.y - 0.5) * 2.0;
    float bands = 0.55 + 0.45 * sin(vUv.x * 42.0 - uTime * 2.8 + vWave * 18.0);
    float alpha = smoothstep(1.0, 0.15, radial) * (0.32 + bands * 0.68) * uOpacity;
    vec3 hot = vec3(1.0, 0.82, 0.5);
    vec3 warm = vec3(0.95, 0.2, 0.04);
    vec3 color = mix(hot, warm, radial * 0.9 + (1.0 - bands) * 0.2);
    gl_FragColor = vec4(color, alpha);
  }
`;
