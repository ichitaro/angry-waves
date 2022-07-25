vec4 getHeightData(vec3 position, sampler2D heightMap, vec2 heightMapSize, vec2 planeSize) {
  vec2 uv = vec2(
    position.x / planeSize.x + 0.5,
    1.0 - (position.z / planeSize.y + 0.5)
  );
  vec4 data = texture2D(heightMap, uv);
  data.z *= heightMapSize.x / planeSize.x;
  data.w *= heightMapSize.y / planeSize.y;
  return data;
}

#pragma glslify: export(getHeightData)
