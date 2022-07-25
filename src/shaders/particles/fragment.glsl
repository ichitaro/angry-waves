varying float vLight;
varying float vLinePercent;

void main() {
  float fade = 1.0 - vLinePercent * vLinePercent * vLinePercent * vLinePercent;
  float intensity = fade * vLight;
  gl_FragColor = vec4(intensity, intensity, intensity, 1.0);

  // # include <tonemapping_fragment>
  #include <encodings_fragment>
}
