import './style.css'
import * as THREE from 'three'
import Experience, { isDebug } from './utils/Experience'
import assets from './utils/assets'
import Water from './scene/Water'
import { addEffects } from './scene/effects'

const webgl = new Experience({
  renderer: {
    canvas: document.querySelector('canvas.webgl') as HTMLCanvasElement,
  },
  orbitControls: true,
  stats: isDebug,
  gui: true,
  postprocessing: true,
})

if (webgl.gui) {
  webgl.gui.close()
}

assets.loadQueued().then(() => {
  /**
   * Renderer
   */
  webgl.renderer.outputEncoding = THREE.sRGBEncoding
  webgl.renderer.toneMapping = THREE.NoToneMapping
  // webgl.renderer.toneMappingExposure = 1.0

  /**
   * Camera
   */
  webgl.camera.fov = 45
  webgl.camera.near = 1
  webgl.camera.far = 1200
  webgl.camera.updateProjectionMatrix()
  webgl.camera.position
    .set(489.651, 234.751, 200.454)
    .normalize()
    .multiplyScalar(600)
  webgl.orbitControls!.target.y = -20
  webgl.orbitControls!.minDistance = 150
  webgl.orbitControls!.maxDistance = 850
  webgl.orbitControls!.minPolarAngle = 0
  webgl.orbitControls!.maxPolarAngle = Math.PI / 2 - 0.2
  webgl.orbitControls!.enablePan = false
  webgl.orbitControls!.enableDamping = true

  /**
   * Objects
   */
  webgl.scene.add(new Water())
  addEffects()

  /**
   * Toggle animation
   */
  window.addEventListener('keyup', (event) => {
    if (event.key === ' ') {
      webgl.isAnimationActive = !webgl.isAnimationActive
    }
  })

  /**
   * Start render loop
   */
  setTimeout(() => {
    webgl.start()
  }, 500)
})
