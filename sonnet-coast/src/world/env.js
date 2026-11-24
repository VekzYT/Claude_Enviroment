// Sky dome with clouds, sun/moon, fog, image-based reflections and the day-night cycle.
import * as THREE from 'three';
import { G } from '../state.js';
import { clamp, lerp, smoothstep } from '../util/math.js';
import { cityUniforms } from './citylight.js';
import { forestMask, swampMask } from './terrain.js';
import { RECT } from './layout.js';

const KEYS = [
  // hour, zenith, horizon, sun colour, sun intensity, hemi intensity
  [0, 0x040716, 0x10173a, 0x8fa8ff, 0.34, 0.26],
  [4.5, 0x060a20, 0x1a1f48, 0x8fa8ff, 0.32, 0.26],
  [5.8, 0x24336a, 0xff9466, 0xffa070, 0.9, 0.4],
  [7.2, 0x4590dc, 0xffdcb4, 0xfff0d8, 2.3, 0.62],
  [12, 0x2c7bd8, 0xa9d8f2, 0xffffff, 2.9, 0.72],
  [16.5, 0x356fc4, 0xffd3a0, 0xffe2b8, 2.6, 0.66],
  [18.6, 0x2c2f72, 0xff7b47, 0xff8c52, 1.7, 0.52],
  [19.8, 0x151540, 0x7a2f6e, 0xb070c0, 0.5, 0.34],
  [21.2, 0x050918, 0x141a40, 0x8fa8ff, 0.34, 0.26],
  [24, 0x040716, 0x10173a, 0x8fa8ff, 0.34, 0.26],
];
const cA = new THREE.Color(), cB = new THREE.Color();

const SKY_FRAG = /* glsl */`
  uniform vec3 uZenith, uHorizon, uSunDir, uSunColor, uCityGlow;
  uniform float uNight, uTime, uCloud;
  varying vec3 vDir;
  float hash3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i), hash2(i + vec2(1, 0)), f.x), mix(hash2(i + vec2(0, 1)), hash2(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= 0.5; }
    return s;
  }
  void main() {
    vec3 d = normalize(vDir);
    float y = d.y;
    vec3 col = mix(uHorizon, uZenith, pow(clamp(y, 0.0, 1.0), 0.55));
    col = mix(col, uHorizon * 0.55, smoothstep(0.0, -0.25, y));
    float sd = max(dot(d, uSunDir), 0.0);
    vec3 sun = uSunColor * (pow(sd, 900.0) * 6.0 + pow(sd, 12.0) * 0.28 + pow(sd, 3.0) * 0.08) * (1.0 - uNight * 0.2);
    float md = max(dot(d, -uSunDir), 0.0);
    vec3 moon = vec3(0.75, 0.82, 1.0) * (smoothstep(0.9993, 0.9996, md) * 1.2 + pow(md, 60.0) * 0.12) * uNight;
    // stars
    vec3 sp = d * 240.0;
    float s = hash3(floor(sp));
    float tw = 0.7 + 0.3 * sin(uTime * 2.0 + s * 80.0);
    float star = step(0.9962, s) * smoothstep(0.5, 0.12, length(fract(sp) - 0.5));
    vec3 stars = vec3(0.9, 0.95, 1.0) * star * tw * uNight * uNight * smoothstep(0.02, 0.25, y) * 1.6;
    // clouds on a flat layer
    float cover = 0.0;
    vec3 cloudCol = vec3(0.0);
    if (y > 0.015) {
      vec2 uv = d.xz / (y + 0.12) * 1.15 + vec2(uTime * 0.006, uTime * 0.0025);
      float n = fbm(uv);
      float n2 = fbm(uv * 2.7 + 4.0);
      cover = smoothstep(0.62 - uCloud * 0.3, 0.9 - uCloud * 0.25, n + n2 * 0.25) * smoothstep(0.015, 0.14, y);
      float lit = clamp(0.5 + 0.9 * (fbm(uv + uSunDir.xz * 0.08) - n), 0.0, 1.0);
      vec3 dayCloud = mix(uHorizon * 0.75 + 0.1, vec3(1.0) * (0.55 + 0.6 * max(uSunDir.y, 0.0)) + uSunColor * 0.35, lit);
      dayCloud += uSunColor * pow(sd, 6.0) * 0.6;
      vec3 nightCloud = vec3(0.035, 0.045, 0.08) + uCityGlow * 0.5 * smoothstep(0.5, 0.05, y) + vec3(0.2, 0.24, 0.34) * pow(md, 10.0);
      cloudCol = mix(dayCloud, nightCloud, uNight);
    }
    col += stars * (1.0 - cover) + moon * (1.0 - cover * 0.8);
    col = mix(col, cloudCol, cover * 0.92);
    col += sun * (1.0 - cover * 0.7);
    // light dome over the city at night
    col += uCityGlow * smoothstep(0.32, -0.02, y) * 0.55;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export class Environment {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.hour = 18.3;
    this.rate = 24 / (24 * 60); // game hours per real second: a full day in 24 minutes
    this.night = 0;
    this.sunDir = new THREE.Vector3(0, 1, 0);
    this.lightDir = new THREE.Vector3(0, 1, 0);
    this.zenith = new THREE.Color();
    this.horizon = new THREE.Color();
    this.sunColor = new THREE.Color();
    this.nightMaterials = []; // {mat, key, day, night}
    this.waterUniforms = null;
    this.cityLights = true;   // false on the low preset
    this.exposure = 1; this.bloomThreshold = 1; this.bloomStrength = 0.4;
    this.cityK = 1;           // 1 in town, 0 out in the wilds (drives glow and mist)
    this.wet = 0;
    this._envHour = -99; this._envTimer = 0;

    scene.fog = new THREE.Fog(0x8899aa, 320, 1500);

    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a4035, 1);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -110; sc.right = 110; sc.top = 110; sc.bottom = -110; sc.near = 10; sc.far = 700;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.5;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.skyUniforms = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uSunColor: { value: new THREE.Color() },
      uCityGlow: { value: new THREE.Color() },
      uNight: { value: 0 },
      uTime: { value: 0 },
      uCloud: { value: 0.45 },
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: SKY_FRAG,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    scene.add(this.sky);

    // Reflection probe: the sky (plus a band of city glow at night) baked into scene.environment.
    this.envScene = new THREE.Scene();
    const envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 12), skyMat);
    this.envScene.add(envSky);
    this.glowBand = new THREE.Mesh(
      new THREE.CylinderGeometry(60, 60, 26, 24, 1, true),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 0, vertexColors: true, toneMapped: false, depthWrite: false }),
    );
    {
      // patchy warm / cyan / magenta lights around the horizon
      const g = this.glowBand.geometry, p = g.getAttribute('position'), col = new Float32Array(p.count * 3);
      const pal = [[1.0, 0.62, 0.3], [0.3, 0.9, 1.0], [1.0, 0.35, 0.8], [1.0, 0.8, 0.5]];
      for (let i = 0; i < p.count; i++) {
        const a = Math.atan2(p.getZ(i), p.getX(i));
        const c = pal[Math.abs(Math.round(a * 3.3)) % 4];
        const k = p.getY(i) > 0 ? 0.0 : 1.6;
        col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    this.glowBand.position.y = 9;
    this.envScene.add(this.glowBand);
    this.pmrem = renderer ? new THREE.PMREMGenerator(renderer) : null;
    this.envRT = null;
    this.apply(0);
  }

  // Register a material property that should change between day and night.
  nightLerp(mat, key, day, night) { this.nightMaterials.push({ mat, key, day, night }); }

  setHour(h) { this.hour = ((h % 24) + 24) % 24; this.apply(0); this.refreshEnvMap(); }

  apply(dt) {
    const h = this.hour;
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    this.zenith.copy(cA.setHex(a[1])).lerp(cB.setHex(b[1]), t);
    this.horizon.copy(cA.setHex(a[2])).lerp(cB.setHex(b[2]), t);
    this.sunColor.copy(cA.setHex(a[3])).lerp(cB.setHex(b[3]), t);
    const sunI = lerp(a[4], b[4], t), hemiI = lerp(a[5], b[5], t);

    const ang = ((h - 6) / 12) * Math.PI; // sunrise 6, sunset 18
    this.sunDir.set(Math.cos(ang) * 0.82, Math.sin(ang), -0.45).normalize();
    const elev = this.sunDir.y;
    this.night = smoothstep(0.12, -0.14, elev);
    if (elev > -0.05) this.lightDir.copy(this.sunDir);
    else this.lightDir.copy(this.sunDir).multiplyScalar(-1);
    if (this.lightDir.y < 0.18) { this.lightDir.y = 0.18; this.lightDir.normalize(); }

    this.sun.color.copy(this.sunColor);
    this.sun.intensity = sunI;
    this.hemi.intensity = hemiI;
    this.hemi.color.copy(this.zenith).lerp(this.horizon, 0.45).multiplyScalar(1.25).addScalar(0.08);
    this.hemi.groundColor.setRGB(0.26, 0.22, 0.18).lerp(this.horizon, 0.25);

    const fog = this.scene.fog;
    fog.color.copy(this.horizon).lerp(this.zenith, 0.35);
    // city haze glows a little at night
    if (this.night > 0) fog.color.lerp(cA.setRGB(0.16, 0.1, 0.17), this.night * this.cityK * 0.45);
    this.exposure = lerp(0.86, 1.08, this.night);
    this.bloomThreshold = lerp(1.2, 0.86, this.night);
    this.bloomStrength = lerp(0.28, 0.6, this.night);

    const u = this.skyUniforms;
    u.uZenith.value.copy(this.zenith);
    u.uHorizon.value.copy(this.horizon);
    u.uSunDir.value.copy(this.sunDir);
    u.uSunColor.value.copy(this.sunColor);
    u.uNight.value = this.night;
    u.uTime.value += dt;
    u.uCityGlow.value.setRGB(0.5, 0.26, 0.32).multiplyScalar(this.night * (0.35 + 0.65 * this.cityK));

    for (const m of this.nightMaterials) m.mat[m.key] = lerp(m.day, m.night, this.night);

    // analytic lamps and neon
    const on = this.cityLights ? 1 : 0;
    cityUniforms.uLampColor.value.setRGB(1.0, 0.76, 0.48).multiplyScalar(8.5 * this.night * on);
    cityUniforms.uNeonK.value = (0.06 + 0.94 * this.night) * on;
    cityUniforms.uWet.value = this.wet;
    cityUniforms.uFogHeight.value.set(1.5, lerp(0.018, 0.03, this.cityK), (1 - this.cityK) * this.night * 0.22, 0);
    this.scene.environmentIntensity = lerp(0.85, 0.55, this.night);
    this.glowBand.material.opacity = this.night * this.cityK;

    if (this.waterUniforms) {
      const w = this.waterUniforms;
      w.uTime.value += dt;
      w.uSunDir.value.copy(this.lightDir);
      w.uSunColor.value.copy(this.sunColor).multiplyScalar(0.25 + sunI * 0.3);
      w.uSkyColor.value.copy(this.zenith);
      w.uHorizon.value.copy(this.horizon);
      w.uAmbient.value = clamp(hemiI * 1.2, 0.2, 1.1);
    }
  }

  refreshEnvMap() {
    if (!this.pmrem) return;
    const rt = this.pmrem.fromScene(this.envScene, 0, 1, 500);
    if (this.envRT) this.envRT.dispose();
    this.envRT = rt;
    this.scene.environment = rt.texture;
    this._envHour = this.hour;
    this._envTimer = 0;
  }

  update(dt, focus) {
    this.hour = (this.hour + dt * this.rate) % 24;
    // how urban is it here?
    const r = RECT.city;
    const dx = Math.max(r.x0 - focus.x, 0, focus.x - r.x1), dz = Math.max(r.z0 - focus.z, 0, focus.z - r.z1);
    const target = smoothstep(420, 0, Math.hypot(dx, dz)) * (1 - 0.5 * Math.max(forestMask(focus.x, focus.z), swampMask(focus.x, focus.z)));
    this.cityK += (target - this.cityK) * Math.min(1, dt * 0.8);
    this.apply(dt);
    this.sky.position.copy(G.camera.position);
    const tx = Math.round(focus.x / 4) * 4, tz = Math.round(focus.z / 4) * 4;
    this.sun.target.position.set(tx, focus.y, tz);
    this.sun.position.set(tx + this.lightDir.x * 320, focus.y + this.lightDir.y * 320, tz + this.lightDir.z * 320);
    this._envTimer += dt;
    let dh = Math.abs(this.hour - this._envHour); if (dh > 12) dh = 24 - dh;
    if (dh > 0.12 && this._envTimer > 3) this.refreshEnvMap();
  }

  clockText() {
    const hh = Math.floor(this.hour), mm = Math.floor((this.hour - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
}
