// https://threejs.org/examples/?q=gpgpu#webgl_gpgpu_water

const float PI = 3.141592653589793;
const vec2 cellSize = 1.0 / resolution.xy;

uniform float uViscosityConstant;
// uniform vec2 uMouseUv;
uniform vec3 uDropPositions[MAX_DROPS];
uniform float uDropSize;
uniform float uDropStrength;

void main() {
  vec2 uv = gl_FragCoord.xy * cellSize;
  
  // heightData.x == height from previous frame
  // heightData.y == height from penultimate frame
  // heightData.z, heightData.w not used
  vec4 heightData = texture2D(uHeightMap, uv);
  
  // Get neighbours
  vec4 north = texture2D(uHeightMap, uv + vec2(0.0, cellSize.y));
  vec4 south = texture2D(uHeightMap, uv + vec2(0.0, - cellSize.y));
  vec4 east = texture2D(uHeightMap, uv + vec2(cellSize.x, 0.0));
  vec4 west = texture2D(uHeightMap, uv + vec2(-cellSize.x, 0.0));
  
  // https://web.archive.org/web/20080618181901/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm
  float newHeight = (
    (north.x + south.x + east.x + west.x) * 0.5 - heightData.y
  ) * uViscosityConstant;
  
  // Mouse influence
  for (int i = 0; i < MAX_DROPS; i++) {
    float phase = clamp(
      length(uv - uDropPositions[i].xy) * PI / uDropSize,
      0.0,
      PI
    );
    heightData.x += (cos(phase) + 1.0) * uDropStrength * uDropPositions[i].z;
  }
  
  heightData.y = heightData.x;
  heightData.x = newHeight;
  
  gl_FragColor = heightData;
}
