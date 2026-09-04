import { glslNoise } from './noise';

export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpread;
  uniform float uPointSize;
  uniform float uImpulse;
  uniform vec2 uPointer;
  uniform float uMode;
  uniform float uDensityMorph;
  uniform float uRadialMotion;
  uniform float uLayerDepth;
  attribute float aSeed;
  varying float vAlpha;
  ${glslNoise}

  void main() {
    vec3 p = position * uSpread;
    float drift = qsValueNoise(position * 4.0 + vec3(aSeed * 7.0, uTime * 0.05, -uTime * 0.03)) - 0.5;
    float wave = sin(uTime * 0.45 + aSeed * 18.0 + length(p) * 0.55);
    p += normalize(p + vec3(0.001)) * (wave * 0.07 + drift * 0.14);
    p += normalize(p + vec3(0.001)) * uRadialMotion * (0.35 + aSeed * 0.65);
    p.z += uLayerDepth;

    vec2 pp = p.xy * 0.12;
    vec2 delta = uPointer - pp;
    float pointerDistance = max(0.12, length(delta));
    vec2 direction = delta / pointerDistance;

    if (uMode < 0.5) {
      p += normalize(p + vec3(0.001)) * uImpulse * exp(-pointerDistance * 1.8) * 0.9;
    } else if (uMode < 1.5) {
      p.xy += direction * uImpulse * exp(-pointerDistance * 0.7) * 0.42;
    } else if (uMode < 2.5) {
      p += normalize(p + vec3(0.001)) * uImpulse * 0.24;
      p.xy += vec2(-direction.y, direction.x) * uImpulse * 0.08;
    } else if (uMode < 3.5) {
      p.xy -= direction * uImpulse * exp(-pointerDistance * 0.9) * 0.28;
    } else if (uMode < 4.5) {
      float cell = sin(aSeed * 31.0 + uTime * 1.8) * uImpulse * 0.16;
      p += normalize(p + vec3(0.001)) * cell;
    } else if (uMode < 5.5) {
      float ripple = sin(pointerDistance * 8.0 - uTime * 2.4) * exp(-pointerDistance * 0.8);
      p.xy += direction * ripple * uImpulse * 0.22;
    } else if (uMode < 6.5) {
      p += normalize(p + vec3(0.001)) * uImpulse * 0.04;
    } else if (uMode < 7.5) {
      float twist = uImpulse * exp(-pointerDistance * 1.2) * 0.55;
      float c = cos(twist);
      float s = sin(twist);
      p.xy = mat2(c, -s, s, c) * p.xy;
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize * (15.0 / max(1.0, -mvPosition.z));
    vAlpha = (0.3 + 0.7 * fract(aSeed * 13.731)) * clamp(uDensityMorph, 0.04, 1.0);
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform vec3 uTint;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float d = length(centered);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    glow *= glow;
    gl_FragColor = vec4(uTint, uOpacity * vAlpha * glow);
  }
`;
