export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpread;
  uniform float uPointSize;
  uniform float uImpulse;
  uniform vec2 uPointer;
  uniform float uMode;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position * uSpread;
    float wave = sin(uTime * 0.45 + aSeed * 18.0 + length(p) * 0.55);
    p += normalize(p + vec3(0.001)) * wave * 0.09;

    vec2 pp = p.xy * 0.12;
    float pointerDistance = max(0.08, distance(pp, uPointer));
    if (uMode < 0.5) {
      p += normalize(p + vec3(0.001)) * uImpulse * exp(-pointerDistance * 1.8) * 0.9;
    } else if (uMode < 1.5) {
      p.xy += (uPointer - pp) * (uImpulse / pointerDistance) * 0.22;
    } else if (uMode < 2.5) {
      p.xy -= (uPointer - pp) * (uImpulse / pointerDistance) * 0.16;
    } else {
      float twist = uImpulse * exp(-pointerDistance * 2.0) * 0.45;
      float c = cos(twist);
      float s = sin(twist);
      p.xy = mat2(c, -s, s, c) * p.xy;
    }

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize * (15.0 / max(1.0, -mvPosition.z));
    vAlpha = 0.3 + 0.7 * fract(aSeed * 13.731);
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
