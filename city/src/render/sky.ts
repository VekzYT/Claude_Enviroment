// Sky backdrop, sun/moon light, hemisphere fill and fog, all driven by state.timeOfDay. Also fits
// the sun's shadow camera to the patch of map the camera can see, so shadows stay crisp.
import * as THREE from 'three';
import { nightAmount } from '../core/state';
import { clamp, smoothstep } from './util';

interface Key {
  t: number;
  zenith: string;
  horizon: string;
  below: string;
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  glass: string;
}

// Keyframes over the day (0 = midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset). The last one wraps.
const KEYS: Key[] = [
  { t: 0.0, zenith: '#0b1433', horizon: '#1f2d58', below: '#0e1733', sun: '#a8b8e8', sunI: 0.6, hemiSky: '#3a4a7c', hemiGround: '#151a2e', hemiI: 0.75, glass: '#161c30' },
  { t: 0.19, zenith: '#111d44', horizon: '#2b3a6a', below: '#141e42', sun: '#acbbe8', sunI: 0.55, hemiSky: '#3e4e80', hemiGround: '#161b32', hemiI: 0.75, glass: '#181e36' },
  { t: 0.24, zenith: '#3a5a9a', horizon: '#f2a98c', below: '#8f7fa6', sun: '#ffb27a', sunI: 0.9, hemiSky: '#a2a8d4', hemiGround: '#5e505e', hemiI: 0.9, glass: '#3a4a6e' },
  { t: 0.3, zenith: '#5ea8ea', horizon: '#ffd9b0', below: '#a9c9e9', sun: '#ffdcb0', sunI: 2.1, hemiSky: '#bcd6f2', hemiGround: '#7e7660', hemiI: 0.9, glass: '#4a6a90' },
  { t: 0.4, zenith: '#4aa6f2', horizon: '#d8f0ff', below: '#a6d4f5', sun: '#fff3df', sunI: 2.35, hemiSky: '#c4e0ff', hemiGround: '#7c7a5c', hemiI: 0.82, glass: '#4f7398' },
  { t: 0.6, zenith: '#4aa6f2', horizon: '#dcf1ff', below: '#a8d5f5', sun: '#fff0da', sunI: 2.35, hemiSky: '#c4e0ff', hemiGround: '#7c7a5c', hemiI: 0.82, glass: '#4f7398' },
  { t: 0.68, zenith: '#5a96e0', horizon: '#ffe0b0', below: '#b8c4e0', sun: '#ffd8a0', sunI: 2.25, hemiSky: '#c4d2ec', hemiGround: '#7c6c50', hemiI: 0.85, glass: '#566a8c' },
  { t: 0.735, zenith: '#6272bc', horizon: '#ffbb70', below: '#e0a596', sun: '#ffbf72', sunI: 2.0, hemiSky: '#eac6cc', hemiGround: '#8c6c58', hemiI: 1.15, glass: '#5a5878' },
  { t: 0.775, zenith: '#2c3778', horizon: '#d8747c', below: '#5c4a7a', sun: '#ff9a66', sunI: 0.75, hemiSky: '#7a6aa4', hemiGround: '#352840', hemiI: 0.85, glass: '#2a2c50' },
  { t: 0.83, zenith: '#0f1a40', horizon: '#263464', below: '#121b3c', sun: '#a8b8e8', sunI: 0.55, hemiSky: '#3a4a7c', hemiGround: '#151a2e', hemiI: 0.75, glass: '#161c30' },
  { t: 1.0, zenith: '#0b1433', horizon: '#1f2d58', below: '#0e1733', sun: '#a8b8e8', sunI: 0.6, hemiSky: '#3a4a7c', hemiGround: '#151a2e', hemiI: 0.75, glass: '#161c30' },
];

interface KeyC {
  t: number;
  zenith: THREE.Color;
  horizon: THREE.Color;
  below: THREE.Color;
  sun: THREE.Color;
  sunI: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiI: number;
  glass: THREE.Color;
}
const KEYC: KeyC[] = KEYS.map((k) => ({
  t: k.t,
  zenith: new THREE.Color(k.zenith),
  horizon: new THREE.Color(k.horizon),
  below: new THREE.Color(k.below),
  sun: new THREE.Color(k.sun),
  sunI: k.sunI,
  hemiSky: new THREE.Color(k.hemiSky),
  hemiGround: new THREE.Color(k.hemiGround),
  hemiI: k.hemiI,
  glass: new THREE.Color(k.glass),
}));

const SKY_VERT = /* glsl */ `
uniform mat4 uProjInv;
uniform mat4 uCamWorld;
varying vec3 vDir;
void main() {
  vec4 v = uProjInv * vec4(position.xy, 1.0, 1.0);
  v.xyz /= v.w;
  vDir = (uCamWorld * vec4(v.xyz, 0.0)).xyz;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uBelow;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uSunVis;
uniform float uNight;
varying vec3 vDir;
float sHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  vec3 col;
  if (d.y >= 0.0) {
    col = mix(uHorizon, uZenith, pow(min(1.0, d.y * 1.6), 0.55));
    // a few stars high up at night
    vec3 cell = floor(d * 140.0);
    float st = step(0.997, sHash(cell)) * smoothstep(0.05, 0.3, d.y) * uNight;
    col += vec3(st * 0.9);
  } else {
    col = mix(uHorizon, uBelow, smoothstep(0.0, 0.55, -d.y));
  }
  // warm halo around the sun (or a cool one round the moon), strongest near the horizon
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunCol * (pow(sd, 10.0) * 0.32 + pow(sd, 220.0) * 0.9) * uSunVis;
  // no tone mapping here: fog colours are not tone mapped either, and they must match exactly
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export class SkyLayer {
  readonly sun = new THREE.DirectionalLight(0xffffff, 2.5);
  readonly hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8c8a66, 1.1);
  readonly fog = new THREE.Fog(0xcfe8ff, 60, 200);
  readonly backdrop: THREE.Mesh;
  /** Current colours, read by other layers (glass tint, fog). */
  readonly glass = new THREE.Color();
  readonly horizon = new THREE.Color();
  night = 0;
  /** Distance from the camera to the ground point it looks at (updated in prepare). */
  viewDistance = 40;

  private readonly uniforms = {
    uProjInv: { value: new THREE.Matrix4() },
    uCamWorld: { value: new THREE.Matrix4() },
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uBelow: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunCol: { value: new THREE.Color() },
    uSunVis: { value: 1 },
    uNight: { value: 0 },
  };
  /** Direction toward the light that casts shadows (sun by day, moon by night). */
  private readonly lightDir = new THREE.Vector3(0.3, 1, 0.5).normalize();
  private mapSize = 64;
  private lastTime = -1;

  // scratch objects for fitting, reused every frame
  private readonly corners: THREE.Vector3[] = Array.from({ length: 8 }, () => new THREE.Vector3());
  private readonly ray = new THREE.Vector3();
  private readonly tmp = new THREE.Vector3();
  private readonly lightView = new THREE.Matrix4();

  constructor() {
    const geo = new THREE.BufferGeometry();
    // one big triangle covers the screen
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.backdrop = new THREE.Mesh(geo, mat);
    this.backdrop.frustumCulled = false;
    this.backdrop.renderOrder = -1000;
    this.backdrop.name = 'sky';

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 2;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 200;
    this.sun.shadow.autoUpdate = true;
  }

  setMapSize(size: number): void {
    this.mapSize = size;
    this.lastTime = -1;
  }

  /** Colours, light directions and intensities for a time of day. */
  setTime(timeOfDay: number): void {
    const t = ((timeOfDay % 1) + 1) % 1;
    if (Math.abs(t - this.lastTime) < 1e-5) return;
    this.lastTime = t;
    let k = 0;
    while (k < KEYC.length - 2 && KEYC[k + 1].t <= t) k++;
    const a = KEYC[k];
    const b = KEYC[k + 1];
    const f = smoothstep(0, 1, (t - a.t) / Math.max(1e-6, b.t - a.t));
    const u = this.uniforms;
    u.uZenith.value.copy(a.zenith).lerp(b.zenith, f);
    u.uHorizon.value.copy(a.horizon).lerp(b.horizon, f);
    u.uBelow.value.copy(a.below).lerp(b.below, f);
    this.horizon.copy(u.uHorizon.value);
    this.sun.color.copy(a.sun).lerp(b.sun, f);
    this.hemi.color.copy(a.hemiSky).lerp(b.hemiSky, f);
    this.hemi.groundColor.copy(a.hemiGround).lerp(b.hemiGround, f);
    this.hemi.intensity = a.hemiI + (b.hemiI - a.hemiI) * f;
    this.glass.copy(a.glass).lerp(b.glass, f);
    this.night = nightAmount(t);
    u.uNight.value = this.night;

    // Stylised sun path: it swings from the south (morning) through the south-west to the west
    // (evening), so shadows fall north-east, where the default camera (looking north-west) sees
    // them beside buildings instead of hidden behind. Its height never drops below ~22° so evening
    // shadows stay readable instead of smearing across the map.
    const ang = (t - 0.25) * Math.PI * 2;
    const elev = Math.sin(ang);
    let intensity: number;
    if (elev > -0.05) {
      const day = clamp((t - 0.25) / 0.5, 0, 1);
      const az = THREE.MathUtils.degToRad(15 - 115 * day);
      const el = Math.max(THREE.MathUtils.degToRad(22), Math.asin(Math.min(1, Math.max(0, elev))) * 0.68);
      this.lightDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      intensity = a.sunI + (b.sunI - a.sunI) * f;
      // fade through the moment the light swaps from sun to moon
      intensity *= smoothstep(-0.05, 0.08, elev);
    } else {
      // moon: high in the south-west, cool and soft
      this.lightDir.set(-0.42, 0.82, 0.38).normalize();
      intensity = (a.sunI + (b.sunI - a.sunI) * f) * smoothstep(-0.05, -0.18, elev);
    }
    this.sun.intensity = intensity;
    u.uSunDir.value.copy(this.lightDir);
    u.uSunCol.value.copy(this.sun.color);
    u.uSunVis.value = elev > -0.05 ? clamp(1 - elev * 0.8, 0.25, 1) : 0.35;
    // fog matches the backdrop just below the horizon so the slab's far side melts into it
    this.fog.color.copy(u.uHorizon.value).lerp(u.uBelow.value, 0.4);
  }

  /** Before rendering: backdrop matrices, fog range and shadow camera bounds. */
  prepare(camera: THREE.PerspectiveCamera, shadows: boolean, shadowMapSize: number): void {
    const u = this.uniforms;
    u.uProjInv.value.copy(camera.projectionMatrixInverse);
    u.uCamWorld.value.copy(camera.matrixWorld);

    // how far the camera is from the ground point it looks at
    const cam = camera.position;
    camera.getWorldDirection(this.ray);
    const dist = this.ray.y < -0.05 ? cam.y / -this.ray.y : cam.y * 3;
    this.viewDistance = dist;
    this.fog.near = dist * 1.35;
    this.fog.far = dist * 3.6 + 40;

    if (shadows) this.fitShadow(camera, shadowMapSize);
  }

  private fitShadow(camera: THREE.PerspectiveCamera, mapSize: number): void {
    const n = this.mapSize;
    const light = this.sun;
    // fixed light rig around the map centre, so only the bounds change as the camera moves
    light.target.position.set(n / 2, 0, n / 2);
    light.position.copy(light.target.position).addScaledVector(this.lightDir, n);
    light.updateMatrixWorld();
    light.target.updateMatrixWorld();
    const sc = light.shadow.camera;
    sc.position.copy(light.position);
    sc.lookAt(light.target.position);
    sc.updateMatrixWorld();
    this.lightView.copy(sc.matrixWorldInverse);

    // where the view frustum's corner rays meet the ground, clamped to the map (plus a margin)
    const cam = camera.position;
    const maxReach = Math.max(30, cam.y * 4);
    const margin = 1.5;
    let k = 0;
    for (let cy = -1; cy <= 1; cy += 2) {
      for (let cx = -1; cx <= 1; cx += 2) {
        this.ray.set(cx, cy, 0.5).unproject(camera).sub(cam).normalize();
        let d = maxReach;
        if (this.ray.y < -1e-3) d = Math.min(maxReach, cam.y / -this.ray.y);
        const p = this.tmp.copy(cam).addScaledVector(this.ray, d);
        p.x = clamp(p.x, -margin, n + margin);
        p.z = clamp(p.z, -margin, n + margin);
        p.y = 0;
        this.corners[k++].copy(p);
        // and the same spot raised, for tall buildings that are visible above the ground point
        this.corners[k++].set(p.x, 6, p.z);
      }
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let k = 0; k < this.corners.length; k++) {
      const c = this.corners[k].applyMatrix4(this.lightView);
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
      if (c.z < minZ) minZ = c.z;
      if (c.z > maxZ) maxZ = c.z;
    }
    // A square window whose size moves in 4-unit steps, snapped to whole texels: while panning
    // the texel size stays put, so shadow edges don't crawl.
    const pad = 1;
    const size = Math.ceil((Math.max(maxX - minX, maxY - minY) + pad * 2) / 4) * 4;
    const texel = size / mapSize;
    const cxL = (minX + maxX) / 2;
    const cyL = (minY + maxY) / 2;
    const sx = Math.floor((cxL - size / 2) / texel) * texel;
    const sy = Math.floor((cyL - size / 2) / texel) * texel;
    sc.left = sx;
    sc.right = sx + size;
    sc.bottom = sy;
    sc.top = sy + size;
    // camera looks down −z in its own space: visible points have negative z
    sc.near = Math.max(0.1, -maxZ - 30);
    sc.far = -minZ + 10;
    sc.updateProjectionMatrix();
    // soften relative to how much ground each texel covers
    light.shadow.normalBias = clamp(texel * 0.6, 0.01, 0.06);
  }

  dispose(): void {
    this.backdrop.geometry.dispose();
    (this.backdrop.material as THREE.Material).dispose();
    this.sun.shadow.map?.dispose();
  }
}
