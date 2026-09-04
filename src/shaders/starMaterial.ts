import { glslNoise } from './noise';

export const starVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTurbulence;
  uniform float uQualityScale;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vSurfaceNoise;
  ${glslNoise}

  void main() {
    vNormal = normalize(normalMatrix * normal);
    float noise = qsFbm(position * (2.2 + uQualityScale * 1.4) + uTime * 0.08);
    float displacement = (noise - 0.5) * 0.08 * uTurbulence;
    vec3 p = position + normal * displacement;
    vPosition = p;
    vSurfaceNoise = noise;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const starFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uCoreColor;
  uniform vec3 uEdgeColor;
  uniform float uOpacity;
  uniform float uTurbulence;
  uniform float uFlash;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vSurfaceNoise;
  ${glslNoise}

  void main() {
    float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    float cells = qsFbm(vPosition * 4.8 + vec3(uTime * 0.09, -uTime * 0.05, uTime * 0.04));
    float granulation = mix(vSurfaceNoise, cells, 0.55) * max(0.08, uTurbulence);
    float hot = smoothstep(0.25, 0.82, granulation);
    vec3 color = mix(uEdgeColor, uCoreColor, clamp(facing * 0.62 + hot * 0.45, 0.0, 1.0));
    color *= 0.72 + uIntensity * (0.20 + hot * 0.09) + uFlash * 0.85;
    gl_FragColor = vec4(color, uOpacity);
  }
`;
