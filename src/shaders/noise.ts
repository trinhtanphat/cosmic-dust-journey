export const glslNoise = /* glsl */ `
  float qsHash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float qsValueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = qsHash31(i + vec3(0,0,0));
    float n100 = qsHash31(i + vec3(1,0,0));
    float n010 = qsHash31(i + vec3(0,1,0));
    float n110 = qsHash31(i + vec3(1,1,0));
    float n001 = qsHash31(i + vec3(0,0,1));
    float n101 = qsHash31(i + vec3(1,0,1));
    float n011 = qsHash31(i + vec3(0,1,1));
    float n111 = qsHash31(i + vec3(1,1,1));
    float x00 = mix(n000, n100, f.x);
    float x10 = mix(n010, n110, f.x);
    float x01 = mix(n001, n101, f.x);
    float x11 = mix(n011, n111, f.x);
    return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
  }

  float qsFbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += qsValueNoise(p) * amp;
      p = p * 2.03 + vec3(7.1, 3.7, 5.9);
      amp *= 0.5;
    }
    return sum;
  }
`;
