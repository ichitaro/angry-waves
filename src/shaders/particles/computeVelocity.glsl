uniform float uTime;
uniform float uDelta;
uniform float uDieSpeed;
uniform float uDieFadeOut;
uniform sampler2D uHeightMap;
uniform vec2 uHeightMapSize;
uniform vec2 uPlaneSize;
uniform float uForceScale;
uniform float uForceLimit;
uniform float uDamping;
uniform float uBounceDecay;
uniform float uFlyScale;
uniform float uFlyLimit;
uniform float uFlyGravity;

#pragma glslify: getHeightData = require(./getHeightData)

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  vec4 positionData = texture2D(uPositionMap, uv);
  vec3 position = positionData.xyz;
  float life = positionData.w - uDieSpeed * uDelta;
  
  vec4 velocityData = texture2D(uVelocityMap, uv);
  vec3 velocity = velocityData.xyz;
  
  vec4 heightData = getHeightData(position, uHeightMap, uHeightMapSize, uPlaneSize);
  float height = heightData.x;
  float prevHeight = heightData.y;
  vec2 normal = heightData.zw;
  
  vec3 force = vec3(normal.x, 0.00001, normal.y);
  float forceLength = min(length(force), uForceLimit);
  velocity += uForceScale * normalize(force) * forceLength * uDelta;
  velocity *= pow(uDamping, uDelta);
  
  position.xz += velocity.xz;
  vec2 didBounce = step(0.5 * uPlaneSize, abs(position.xz));
  velocity.x *= mix(1.0, - uBounceDecay, didBounce.x);
  velocity.z *= mix(1.0, - uBounceDecay, didBounce.y);
  
  float isAlive = step(0.0, life);
  float fly = isAlive * velocityData.w;
  fly += (uFlyScale * clamp(height - prevHeight, 0.0, uFlyLimit) + uFlyGravity) * uDelta;
  fly = max(fly, 0.0);
  
  velocity.y = max(height, fly) - max(prevHeight, velocityData.w);

  velocity *= clamp(life, 0.0, uDieFadeOut) / uDieFadeOut;
  
  gl_FragColor = vec4(velocity, fly);
}
