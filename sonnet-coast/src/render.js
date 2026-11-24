// Renderer, post-processing (MSAA, bloom, grade) and quality presets.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { G } from './state.js';

export const QUALITY = {
  // maxRatio caps the device pixel ratio; scale shrinks the internal resolution below native
  low: { maxRatio: 1, scale: 0.8, shadows: false, post: false, samples: 0, far: 1400, fogFar: 1150, cityLights: false, shadowMap: 1024 },
  medium: { maxRatio: 1.25, scale: 1, shadows: true, post: true, samples: 2, far: 2000, fogFar: 1700, cityLights: true, shadowMap: 1536 },
  high: { maxRatio: 1.75, scale: 1, shadows: true, post: true, samples: 4, far: 2700, fogFar: 2200, cityLights: true, shadowMap: 2048 },
};

// Final grade: speed blur, chromatic fringe, split-tone, vignette. Runs in linear HDR.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uSpeed: { value: 0 }, uCA: { value: 0.6 }, uVignette: { value: 0.42 },
    uSat: { value: 1.08 }, uFlash: { value: new THREE.Vector4(0, 0, 0, 0) }, uDesat: { value: 0 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uSpeed, uCA, uVignette, uSat, uDesat; uniform vec4 uFlash;
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      float ca = uCA * r2 * 0.012;
      vec3 col;
      col.r = texture2D(tDiffuse, 0.5 + c * (1.0 + ca)).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, 0.5 + c * (1.0 - ca)).b;
      if (uSpeed > 0.01) {
        float amt = uSpeed * 0.07 * smoothstep(0.01, 0.35, r2);
        vec3 acc = col;
        for (int i = 1; i <= 5; i++) acc += texture2D(tDiffuse, 0.5 + c * (1.0 - amt * float(i) / 5.0)).rgb;
        col = acc / 6.0;
      }
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, uSat * (1.0 - uDesat));
      col *= mix(vec3(0.93, 1.0, 1.07), vec3(1.05, 1.0, 0.95), smoothstep(0.0, 1.1, l));
      col *= 1.0 - uVignette * smoothstep(0.12, 0.8, r2 * 1.7);
      col = mix(col, uFlash.rgb, uFlash.a * smoothstep(0.0, 0.5, r2 * 1.6 + uFlash.a * 0.3));
      gl_FragColor = vec4(col, 1.0);
    }`,
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

  G.renderer = renderer; G.scene = scene; G.camera = camera;
  const R = { renderer, scene, camera, composer: null, bloom: null, grade: null, usePost: true, samples: -1 };

  const buildComposer = (samples) => {
    if (R.composer) { R.composer.dispose(); }
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples });
    const composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    R.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.5, 0.55, 0.9);
    composer.addPass(R.bloom);
    R.grade = new ShaderPass(GradeShader);
    composer.addPass(R.grade);
    composer.addPass(new OutputPass());
    R.composer = composer;
    R.samples = samples;
  };

  R.applyQuality = () => {
    const q = QUALITY[G.settings.quality] || QUALITY.medium;
    R.q = q;
    renderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio || 1, q.maxRatio) * q.scale));
    renderer.shadowMap.enabled = q.shadows;
    if (G.env) {
      G.env.sun.castShadow = q.shadows;
      G.env.cityLights = q.cityLights;
      if (G.env.sun.shadow.mapSize.x !== q.shadowMap) {
        G.env.sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
        if (G.env.sun.shadow.map) { G.env.sun.shadow.map.dispose(); G.env.sun.shadow.map = null; }
      }
    }
    camera.far = q.far;
    if (scene.fog) { scene.fog.far = q.fogFar; scene.fog.near = q.fogFar * 0.22; }
    R.usePost = q.post;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (q.post && R.samples !== q.samples) buildComposer(q.samples);
    R.resize();
    scene.traverse((o) => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m) => { m.needsUpdate = true; }); } });
  };
  R.resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    if (R.composer) { R.composer.setPixelRatio(renderer.getPixelRatio()); R.composer.setSize(w, h); }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  R.render = () => {
    if (G.env) renderer.toneMappingExposure = G.env.exposure;
    if (R.usePost && R.composer) {
      if (G.env) { R.bloom.threshold = G.env.bloomThreshold; R.bloom.strength = G.env.bloomStrength; }
      R.composer.render();
    } else renderer.render(scene, camera);
  };
  window.addEventListener('resize', R.resize);
  return R;
}
