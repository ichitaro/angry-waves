import * as THREE from 'three'

import Experience from '../utils/Experience'
import createHeightMapComputer from './heightMapComputer'
import createParticlesComputer from './particlesComputer'
import particlesVertexShader from '../shaders/particles/vertex.glsl'
import particlesFragmentShader from '../shaders/particles/fragment.glsl'

type HeightMapComputer = ReturnType<typeof createHeightMapComputer>
type ParticlesComputer = ReturnType<typeof createParticlesComputer>

export default class Water extends THREE.Group {
  webgl = new Experience()

  heightMapComputer: HeightMapComputer
  particlesComputer: ParticlesComputer
  lineSegmentsUniforms: ReturnType<typeof createLineSegments>['uniforms']

  didPointerMove = false
  meshRay: THREE.Object3D
  raycaster = new THREE.Raycaster()

  dropPositionTo = new THREE.Vector2(0.5, 0.5)
  dropPositionFrom = this.dropPositionTo.clone()
  dropPosition = this.dropPositionTo.clone()
  dropVelocity = new THREE.Vector2()
  hasIntersection = false
  allowInteraction = false

  constructor() {
    super()

    const heightMapComputer = createHeightMapComputer({
      size: new THREE.Vector2(160, 160),
    })

    const particlesComputer = createParticlesComputer({
      size: new THREE.Vector2(512, 512),
      heightMapSize: heightMapComputer.size,
      planeSize: new THREE.Vector2(580, 580),
    })

    const { lineSegments, uniforms: lineSegmentsUniforms } = createLineSegments(
      heightMapComputer,
      particlesComputer
    )

    const meshRay = (() => {
      const geometry = new THREE.PlaneGeometry(
        particlesComputer.planeSize.x,
        particlesComputer.planeSize.y
      )
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          visible: false,
        })
      )
      mesh.rotation.x = -Math.PI / 2
      mesh.matrixAutoUpdate = false
      mesh.updateMatrix()
      return mesh
    })()

    this.add(lineSegments, meshRay)

    this.lineSegmentsUniforms = lineSegmentsUniforms
    this.heightMapComputer = heightMapComputer
    this.particlesComputer = particlesComputer
    this.meshRay = meshRay

    this.setInitialDrops()
  }

  setInitialDrops() {
    for (let i = 0; i < this.heightMapComputer.maxDrops; i++) {
      this.dropPosition.set(0.5, 0.5)
      this.heightMapComputer.addDrop(this.dropPosition, 0.7)
    }
    this.webgl.events.tick.once(() => {
      this.allowInteraction = true
    })
  }

  onPointerMove() {
    this.didPointerMove = true
  }

  onTick(dt: number) {
    this.applyMouseInfluence(dt)
    this.heightMapComputer.update(dt)

    this.particlesComputer.setHeightMap(
      this.heightMapComputer.getCurrentHeightMap()
    )
    this.particlesComputer.update(dt)

    this.lineSegmentsUniforms.uVelocityMap.value =
      this.particlesComputer.getCurrentVelocityMap()
    this.lineSegmentsUniforms.uPositionMap.value =
      this.particlesComputer.getCurrentPositionMap()
    this.lineSegmentsUniforms.uHeightMap.value =
      this.heightMapComputer.getCurrentHeightMap()
  }

  applyMouseInfluence(dt: number) {
    if (this.didPointerMove) {
      this.raycaster.setFromCamera(this.webgl.pointer, this.webgl.camera)
      const intersects = this.raycaster.intersectObject(this.meshRay)
      const isIntersecting = intersects.length > 0
      if (isIntersecting) {
        const uv = intersects[0].uv!
        this.dropPositionTo.copy(uv)
        if (!this.hasIntersection) {
          this.dropPositionFrom.copy(uv)
        }
      }
      this.hasIntersection = isIntersecting
    }

    if (this.allowInteraction) {
      this.heightMapComputer.clearDrops()

      if (
        this.hasIntersection &&
        (this.didPointerMove || this.webgl.pointer.isDragging)
      ) {
        this.dropPosition.copy(this.dropPositionTo)
        for (let i = 0; i < this.heightMapComputer.maxDrops; i++) {
          this.dropVelocity.subVectors(this.dropPositionFrom, this.dropPosition)
          const dist = this.dropVelocity.length()
          if (dist < 0.001 && this.didPointerMove) break

          this.dropVelocity.normalize()
          const speed = Math.min(0.01, dist)
          this.dropVelocity.multiplyScalar(speed)
          this.dropPosition.add(this.dropVelocity)
          this.heightMapComputer.addDrop(
            this.dropPosition,
            0.3 + Math.pow(dist, 0.5) * 3
          )
        }

        this.dropPositionFrom.copy(this.dropPositionTo)
      }
    }

    this.didPointerMove = false
  }
}

function createLineSegments(
  heightMapComputer: HeightMapComputer,
  particlesComputer: ParticlesComputer
) {
  const {
    numParticles,
    size: { x: sizeX },
  } = particlesComputer
  const geometry = (() => {
    const refs = new Float32Array(numParticles * 2 * 3)
    for (let i = 0; i < numParticles; ++i) {
      const refX = (i % sizeX) / (sizeX - 1)
      const refY = ~~(i / sizeX) / (sizeX - 1)
      refs[6 * i + 0] = refX
      refs[6 * i + 1] = refY
      refs[6 * i + 2] = 0
      refs[6 * i + 3] = refX
      refs[6 * i + 4] = refY
      refs[6 * i + 5] = 1
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(refs, 3))
    return geom
  })()

  const uniforms = {
    uVelocityMap: { value: null as THREE.Texture | null },
    uPositionMap: { value: null as THREE.Texture | null },
    uHeightMap: { value: null as THREE.Texture | null },
    uHeightMapSize: {
      value: heightMapComputer.size,
    },
    uPlaneSize: {
      value: particlesComputer.planeSize,
    },
    uLineScale: {
      value: 3,
    },
  }
  const { gui } = new Experience()
  if (gui) {
    gui
      .add(uniforms.uLineScale, 'value')
      .min(0.1)
      .max(10)
      .step(0.0001)
      .name('lineScale')
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms,
  })

  const lineSegments = new THREE.LineSegments(geometry, material)

  return {
    lineSegments,
    uniforms,
  }
}
