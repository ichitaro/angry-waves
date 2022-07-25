import * as THREE from 'three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer'
import Experience from '../utils/Experience'
import heightMapFragmentShader from '../shaders/heightMap/computeHeight.glsl'
import normalMapFragmentShader from '../shaders/heightMap/computeNormal.glsl'

type Options = {
  size: THREE.Vector2
  viscosityConstant?: number
  mouseSize?: number
  mouseStrength?: number
}

export default function createHeightMapComputer({ size }: Options) {
  const { renderer, gui } = new Experience()
  const gpuCompute = new GPUComputationRenderer(size.x, size.y, renderer)
  if (!renderer.capabilities.isWebGL2) {
    gpuCompute.setDataType(THREE.HalfFloatType)
  }

  const heightMap = gpuCompute.createTexture()

  const normalMap = gpuCompute.createTexture()

  const heightMapVariable = gpuCompute.addVariable(
    'uHeightMap',
    heightMapFragmentShader,
    heightMap
  )
  const normalMapVariable = gpuCompute.addVariable(
    'uNormalMap',
    normalMapFragmentShader,
    normalMap
  )
  gpuCompute.setVariableDependencies(heightMapVariable, [heightMapVariable])
  gpuCompute.setVariableDependencies(normalMapVariable, [heightMapVariable])

  const maxDrops = 8
  const dropPositions = Array.from({ length: maxDrops }).map(
    () => new THREE.Vector3()
  )
  let numDrops = 0

  heightMapVariable.material.defines.MAX_DROPS = maxDrops.toFixed(0)
  heightMapVariable.material.uniforms.uViscosityConstant = {
    value: 0.99,
  }
  heightMapVariable.material.uniforms.uDropPositions = {
    value: dropPositions,
  }
  heightMapVariable.material.uniforms.uDropSize = { value: 0.07 }
  heightMapVariable.material.uniforms.uDropStrength = { value: 0.65 }

  normalMapVariable.material.uniforms.uHeightScale = {
    value: 1.0,
  }

  if (gui) {
    const folder = gui.addFolder('Height map')
    folder
      .add(heightMapVariable.material.uniforms.uViscosityConstant, 'value')
      .min(0.95)
      .max(0.999)
      .step(0.0001)
      .name('viscosityConstant')
    folder
      .add(heightMapVariable.material.uniforms.uDropSize, 'value')
      .min(0.02)
      .max(0.12)
      .step(0.0001)
      .name('dropSize')
    folder
      .add(heightMapVariable.material.uniforms.uDropStrength, 'value')
      .min(0.0)
      .max(5)
      .step(0.0001)
      .name('dropStrength')
    folder
      .add(normalMapVariable.material.uniforms.uHeightScale, 'value')
      .min(0)
      .max(5)
      .step(0.0001)
      .name('heightScale')
  }

  const error = gpuCompute.init()
  if (error !== null) {
    console.error(error)
  }

  return {
    size,
    maxDrops,
    update,
    getCurrentHeightMap,
    clearDrops,
    addDrop,
  }

  function clearDrops() {
    numDrops = 0
    for (const position of dropPositions) {
      position.z = 0
    }
  }

  function addDrop(uv: THREE.Vector2, strength = 1) {
    const index = numDrops % dropPositions.length
    dropPositions[index].set(uv.x, uv.y, strength)
    numDrops++
  }

  function update(dt: number) {
    gpuCompute.compute()
  }

  function getCurrentHeightMap() {
    return gpuCompute.getCurrentRenderTarget(normalMapVariable).texture
  }
}
