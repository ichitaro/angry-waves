const vec2 cellSize = 1.0 / resolution.xy;

uniform float uHeightScale;

void main() {
  vec2 uv = gl_FragCoord.xy * cellSize;
  vec2 normal = vec2(
    (
      uHeightScale * texture2D(uHeightMap, uv + vec2(- cellSize.x, 0)).x -
      uHeightScale * texture2D(uHeightMap, uv + vec2(cellSize.x, 0)).x
    ),
    - (
      uHeightScale * texture2D(uHeightMap, uv + vec2(0, - cellSize.y)).x -
      uHeightScale * texture2D(uHeightMap, uv + vec2(0, cellSize.y)).x
    )
  );
  
  gl_FragColor = vec4(uHeightScale * texture2D(uHeightMap, uv).xy, normal);
  
  // gl_FragColor.x -> height
  // gl_FragColor.y -> previous height
  // gl_FragColor.z -> normal.x
  // gl_FragColor.w -> normal.y
}
