export const starVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const starFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uCoreColor;
  uniform vec3 uEdgeColor;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  void main() {
    float facing = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    float turbulence = sin(vPosition.x * 8.0 + uTime * 1.2)
      * sin(vPosition.y * 9.0 - uTime * 0.8)
      * sin(vPosition.z * 7.0 + uTime * 0.5);
    turbulence += (hash(floor((vPosition + uTime * 0.02) * 18.0)) - 0.5) * 0.7;
    float hot = smoothstep(-0.7, 0.8, turbulence);
    vec3 color = mix(uEdgeColor, uCoreColor, facing * 0.65 + hot * 0.35);
    color *= 0.72 + uIntensity * (0.22 + hot * 0.08);
    gl_FragColor = vec4(color, uOpacity);
  }
`;
