import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer'
import Experience from '../utils/Experience'
import particlesVelocityShader from '../shaders/particles/computeVelocity.glsl'
import particlesPositionShader from '../shaders/particles/computePosition.glsl'

type Options = {
  size: THREE.Vector2
  heightMapSize: THREE.Vector2
  planeSize: THREE.Vector2
}

export default function createParticlesComputer({
  size,
  heightMapSize,
  planeSize,
}: Options) {
  const { renderer, gui } = new Experience()
  const numParticles = size.x * size.y
  const gpuCompute = new GPUComputationRenderer(size.x, size.y, renderer)
  if (!renderer.capabilities.isWebGL2) {
    gpuCompute.setDataType(THREE.HalfFloatType)
  }
  const velocityMap = gpuCompute.createTexture()
  const positionMap = gpuCompute.createTexture()
  ;(function fillTextures() {
    const velocityArray = velocityMap.image.data
    velocityArray.fill(0)

    const positionArray = positionMap.image.data
    for (let i = 0; i < numParticles; i++) {
      const i4 = i * 4
      positionArray[i4 + 0] = (Math.random() - 0.5) * planeSize.x
      positionArray[i4 + 1] = 0
      positionArray[i4 + 2] = (Math.random() - 0.5) * planeSize.y
      positionArray[i4 + 3] = i / (numParticles - 1)
    }
  })()
  const velocityVariable = gpuCompute.addVariable(
    'uVelocityMap',
    particlesVelocityShader,
    velocityMap
  )
  const positionVariable = gpuCompute.addVariable(
    'uPositionMap',
    particlesPositionShader,
    positionMap
  )

  gpuCompute.setVariableDependencies(velocityVariable, [
    positionVariable,
    velocityVariable,
  ])
  gpuCompute.setVariableDependencies(positionVariable, [
    positionVariable,
    velocityVariable,
  ])

  const uTime = {
    value: 0.0,
  }
  const uDelta = {
    value: 0.0,
  }
  const uDieSpeed = {
    value: 0.00125,
  }
  const uDieFadeOut = {
    value: 0.01,
  }
  const uHeightMap = {
    value: null as THREE.Texture | null,
  }
  const uHeightMapSize = {
    value: heightMapSize,
  }
  const uPlaneSize = {
    value: planeSize,
  }
  const uForceScale = {
    value: 0.4,
  }
  const uForceLimit = {
    value: 1.3,
  }
  const uDamping = {
    value: 0.96,
  }
  const uBounceDecay = {
    value: 1,
  }
  const uFlyScale = {
    value: 1.3,
  }
  const uFlyLimit = {
    value: 10.0,
  }
  const uFlyGravity = {
    value: -2.0,
  }

  velocityVariable.material.uniforms.uTime = uTime
  velocityVariable.material.uniforms.uDelta = uDelta
  velocityVariable.material.uniforms.uDieSpeed = uDieSpeed
  velocityVariable.material.uniforms.uDieFadeOut = uDieFadeOut
  velocityVariable.material.uniforms.uHeightMap = uHeightMap
  velocityVariable.material.uniforms.uHeightMapSize = uHeightMapSize
  velocityVariable.material.uniforms.uPlaneSize = uPlaneSize
  velocityVariable.material.uniforms.uForceScale = uForceScale
  velocityVariable.material.uniforms.uForceLimit = uForceLimit
  velocityVariable.material.uniforms.uDamping = uDamping
  velocityVariable.material.uniforms.uBounceDecay = uBounceDecay
  velocityVariable.material.uniforms.uFlyScale = uFlyScale
  velocityVariable.material.uniforms.uFlyLimit = uFlyLimit
  velocityVariable.material.uniforms.uFlyGravity = uFlyGravity

  positionVariable.material.uniforms.uTime = uTime
  positionVariable.material.uniforms.uDelta = uDelta
  positionVariable.material.uniforms.uDieSpeed = uDieSpeed
  positionVariable.material.uniforms.uHeightMap = uHeightMap
  positionVariable.material.uniforms.uHeightMapSize = uHeightMapSize
  positionVariable.material.uniforms.uPlaneSize = uPlaneSize

  if (gui) {
    const folder = gui.addFolder('Particles')
    folder
      .add(uDieSpeed, 'value')
      .min(0.0002)
      .max(0.01)
      .step(0.00005)
      .name('dieSpeed')
    folder
      .add(uDieFadeOut, 'value')
      .min(0.01)
      .max(0.4)
      .step(0.0001)
      .name('dieFadeOut')
    folder
      .add(uForceScale, 'value')
      .min(0)
      .max(1)
      .step(0.0001)
      .name('forceScale')
    folder
      .add(uForceLimit, 'value')
      .min(0)
      .max(10)
      .step(0.0001)
      .name('forceLimit')
    folder.add(uDamping, 'value').min(0.5).max(1).step(0.0001).name('damping')
    folder
      .add(uBounceDecay, 'value')
      .min(0)
      .max(1)
      .step(0.0001)
      .name('bounceDecay')
    folder.add(uFlyScale, 'value').min(0).max(4).step(0.0001).name('flyScale')
    folder.add(uFlyLimit, 'value').min(0).max(30).step(0.0001).name('flyLimit')
    folder
      .add(uFlyGravity, 'value')
      .min(-10)
      .max(0)
      .step(0.0001)
      .name('flyGravity')
  }

  const error = gpuCompute.init()
  if (error !== null) {
    console.error(error)
  }

  return {
    numParticles,
    size,
    planeSize,
    setHeightMap,
    update,
    getCurrentVelocityMap,
    getCurrentPositionMap,
  }

  function setHeightMap(texture: THREE.Texture) {
    uHeightMap.value = texture
  }

  function update(dt: number) {
    uTime.value += dt
    uDelta.value = 60 * dt

    gpuCompute.compute()
  }

  function getCurrentVelocityMap() {
    return gpuCompute.getCurrentRenderTarget(velocityVariable).texture
  }

  function getCurrentPositionMap() {
    return gpuCompute.getCurrentRenderTarget(positionVariable).texture
  }
}
