const vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));

uniform sampler2D uVelocityMap;
uniform sampler2D uPositionMap;
uniform sampler2D uHeightMap;
uniform vec2 uHeightMapSize;
uniform vec2 uPlaneSize;
uniform float uLineScale;

varying float vLight;
varying float vLinePercent;

#pragma glslify: getHeightData = require(./getHeightData)

void main() {
  vec2 uv = position.xy;
  float vertexIndex = position.z;
  
  vec4 positionData = texture2D(uPositionMap, uv);
  vec3 particlePosition = positionData.xyz;
  vec3 particleVelocity = texture2D(uVelocityMap, uv).xyz;
  vec3 vertexPosition = particlePosition - uLineScale * particleVelocity * vertexIndex;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
  
  vec4 heightData = getHeightData(particlePosition, uHeightMap, uHeightMapSize, uPlaneSize);
  vec3 normal = normalize(vec3(heightData.z, 1.0, heightData.w));
  vLight = 1.0 - max(dot(lightDirection, normal), 0.0);

  vLinePercent = vertexIndex;
}
