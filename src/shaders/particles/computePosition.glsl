#include <common>

uniform float uTime;
uniform float uDelta;
uniform float uDieSpeed;
uniform sampler2D uHeightMap;
uniform vec2 uHeightMapSize;
uniform vec2 uPlaneSize;

#pragma glslify: getHeightData = require(./getHeightData)

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 positionData = texture2D(uPositionMap, uv);
  vec3 position = positionData.xyz;
  float life = positionData.w - uDieSpeed * uDelta;
  
  vec4 velocityData = texture2D(uVelocityMap, uv);
  vec3 velocity = velocityData.xyz;
  float height = getHeightData(position, uHeightMap, uHeightMapSize, uPlaneSize).x;
  vec2 wall = 0.5 * uPlaneSize - 0.02;
  
  position += velocity * uDelta;
  position.xz = clamp(position.xz, -wall, wall);
  position.y = max(height, velocityData.w);
  
  float seed1 = mod(uTime, 1000.0);
  vec2 seed2 = uv + position.xz / uPlaneSize;
  vec3 resetPosition = vec3(
    uPlaneSize.x * (rand(fract(seed2 + vec2(seed1, 0.0))) - 0.5),
    0.0,
    uPlaneSize.y * (rand(fract(seed2 + vec2(0.0, seed1))) - 0.5)
  );
  float resetLife = 0.5 + rand(fract(seed2.yx + vec2(seed1, seed1)));
  
  float isAlive = step(0.0, life);
  position = mix(resetPosition, position, isAlive);
  life = mix(resetLife, life, isAlive);
  
  gl_FragColor = vec4(position, life);
}
