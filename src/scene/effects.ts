import * as THREE from 'three'
import {
  EffectPass,
  BloomEffect,
  VignetteEffect,
  KernelSize,
} from 'postprocessing'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

export function addEffects() {
  const webgl = new Experience()
  const { composer, camera, gui } = webgl
  if (!composer) return

  const bloomEffect = new BloomEffect({
    luminanceThreshold: 0.73,
    intensity: 0.75,
    kernelSize: KernelSize.VERY_SMALL,
  })
  const bloomPass = new EffectPass(camera, bloomEffect)
  // bloomPass.enabled = false
  composer.addPass(bloomPass)
  composer.addPass(new EffectPass(camera, new VignetteEffect()))

  if (gui) {
    const folder = gui.addFolder('Bloom')
    folder.add(bloomPass, 'enabled')
    folder
      .add(bloomEffect.luminanceMaterial, 'threshold')
      .min(0)
      .max(1)
      .step(0.0001)
    folder.add(bloomEffect, 'intensity').min(0).max(2).step(0.0001)
  }
}
