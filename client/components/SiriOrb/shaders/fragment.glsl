uniform float uTime;
uniform float uAudioLevel;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uGlowColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);

  // Fresnel term: near-zero facing the camera, rising toward the silhouette.
  // This is what makes the rim glow instead of the whole sphere looking flat.
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

  // Three-way animated color blend, driven by surface displacement and
  // time rather than fixed UVs, so the gradient itself keeps flowing.
  float mixA = smoothstep(-0.2, 0.3, vDisplacement + sin(uTime * 0.3) * 0.15);
  float mixB = smoothstep(0.0, 0.5, vDisplacement * 1.5 + cos(uTime * 0.4) * 0.2);
  vec3 baseColor = mix(uColorA, uColorB, mixA);
  baseColor = mix(baseColor, uColorC, mixB * 0.6);

  // Rim glow gets brighter with both the fresnel falloff and live audio energy.
  vec3 glow = uGlowColor * fresnel * (1.1 + uAudioLevel * 1.8) * uIntensity;

  // Soft inner luminance so the core never looks like a flat, dead color.
  float core = smoothstep(1.0, -0.4, fresnel) * 0.25;
  vec3 color = baseColor + glow + uGlowColor * core * uAudioLevel;

  float alpha = clamp(0.5 + fresnel * 0.65 + uAudioLevel * 0.2, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
