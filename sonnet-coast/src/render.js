// Renderer, post-processing (bloom) and quality presets.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { G } from './state.js';

export const QUALITY = {
  low: { pixelRatio: 0.75, shadows: false, bloom: false, far: 1300, fogFar: 1100 },
  medium: { pixelRatio: 1, shadows: false, bloom: true, far: 1900, fogFar: 1600 },
  high: { pixelRatio: 1.5, shadows: true, bloom: true, far: 2600, fogFar: 2100 },
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 1, 0.3, 2600);
  camera.position.set(-250, 30, 60);
  scene.add(camera);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.5, 0.92);
  const output = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(output);

  G.renderer = renderer; G.scene = scene; G.camera = camera;
  const R = { renderer, scene, camera, composer, bloom, useComposer: true };

  R.applyQuality = () => {
    const q = QUALITY[G.settings.quality] || QUALITY.medium;
    const pr = Math.min(window.devicePixelRatio || 1, 2) * q.pixelRatio;
    renderer.setPixelRatio(Math.max(0.5, Math.min(pr, 2)));
    renderer.shadowMap.enabled = q.shadows;
    if (G.env) G.env.sun.castShadow = q.shadows;
    camera.far = q.far;
    if (scene.fog) { scene.fog.far = q.fogFar; scene.fog.near = q.fogFar * 0.28; }
    R.useComposer = q.bloom;
    R.resize();
    scene.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { m.needsUpdate = true; }); } });
  };
  R.resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  R.render = () => {
    if (G.env) {
      renderer.toneMappingExposure = G.env.exposure;
      bloom.threshold = G.env.bloomThreshold;
      bloom.strength = G.env.bloomStrength;
    }
    if (R.useComposer) composer.render();
    else renderer.render(scene, camera);
  };
  window.addEventListener('resize', R.resize);
  return R;
}
