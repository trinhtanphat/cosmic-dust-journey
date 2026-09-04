import { glslNoise } from './noise';

export const diskVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDisturbance;
  uniform float uWarp;
  uniform vec2 uPointer;
  uniform float uQualityScale;
  varying vec2 vUv;
  varying float vWave;
  varying float vRadius;
  ${glslNoise}

  void main() {
    vUv = uv;
    vec3 p = position;
    float angle = atan(p.y, p.x);
    float radius = length(p.xy);
    float pointerDistance = max(0.12, distance(p.xy / 5.2, uPointer));
    float localDisturbance = uDisturbance * exp(-pointerDistance * 1.8);
    float fine = qsValueNoise(vec3(angle * 1.7, radius * 0.8, uTime * 0.18)) - 0.5;
    float wave = sin(angle * 10.0 - uTime * 3.0 + radius * 2.0) * 0.08;
    wave += fine * 0.09 * uQualityScale;
    p.z += wave * (0.4 + localDisturbance) + sin(angle * 2.0 + uTime) * uWarp * 0.08;
    float squeeze = 1.0 + uWarp * 0.035 * sin(angle * 2.0);
    p.xy *= squeeze;
    vWave = wave;
    vRadius = radius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const diskFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uWarp;
  varying vec2 vUv;
  varying float vWave;
  varying float vRadius;
  void main() {
    float radial = abs(vUv.y - 0.5) * 2.0;
    float bands = 0.55 + 0.45 * sin(vUv.x * 42.0 - uTime * 2.8 + vWave * 18.0);
    float innerBoost = smoothstep(5.2, 1.25, vRadius);
    float lensBoost = 1.0 + uWarp * innerBoost * 0.55;
    float alpha = smoothstep(1.0, 0.15, radial) * (0.32 + bands * 0.68) * uOpacity * lensBoost;
    vec3 hot = vec3(1.0, 0.84, 0.55);
    vec3 warm = vec3(0.95, 0.18, 0.035);
    vec3 color = mix(hot, warm, radial * 0.88 + (1.0 - bands) * 0.22);
    color *= 1.0 + innerBoost * uWarp * 0.28;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;
