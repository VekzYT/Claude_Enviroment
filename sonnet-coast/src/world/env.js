// Sky dome, sun/moon, fog and the day-night cycle.
import * as THREE from 'three';
import { G } from '../state.js';
import { clamp, lerp, smoothstep } from '../util/math.js';

const KEYS = [
  // hour, zenith, horizon, sun colour, sun intensity, hemi intensity
  [0, 0x040716, 0x10173a, 0x8fa8ff, 0.32, 0.30],
  [4.5, 0x060a20, 0x1a1f48, 0x8fa8ff, 0.30, 0.30],
  [5.8, 0x24336a, 0xff9466, 0xffa070, 0.9, 0.5],
  [7.2, 0x4590dc, 0xffdcb4, 0xfff0d8, 2.2, 0.8],
  [12, 0x2c7bd8, 0xa9d8f2, 0xffffff, 2.8, 0.9],
  [16.5, 0x356fc4, 0xffd3a0, 0xffe2b8, 2.5, 0.85],
  [18.6, 0x2c2f72, 0xff7b47, 0xff8c52, 1.6, 0.7],
  [19.8, 0x151540, 0x7a2f6e, 0xb070c0, 0.5, 0.42],
  [21.2, 0x050918, 0x141a40, 0x8fa8ff, 0.32, 0.30],
  [24, 0x040716, 0x10173a, 0x8fa8ff, 0.32, 0.30],
];
const cA = new THREE.Color(), cB = new THREE.Color();

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.hour = 18.3;
    this.rate = 24 / (22 * 60); // game hours per real second: a full day in 22 minutes
    this.night = 0;
    this.sunDir = new THREE.Vector3(0, 1, 0);
    this.lightDir = new THREE.Vector3(0, 1, 0);
    this.zenith = new THREE.Color();
    this.horizon = new THREE.Color();
    this.sunColor = new THREE.Color();
    this.nightMaterials = []; // {mat, key, day, night}
    this.waterUniforms = null;

    scene.fog = new THREE.Fog(0x8899aa, 320, 1500);

    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a4035, 1);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -120; sc.right = 120; sc.top = 120; sc.bottom = -120; sc.near = 10; sc.far = 600;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.6;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.skyUniforms = {
      uZenith: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3() },
      uSunColor: { value: new THREE.Color() },
      uNight: { value: 0 },
      uTime: { value: 0 },
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uZenith, uHorizon, uSunDir, uSunColor;
        uniform float uNight, uTime;
        varying vec3 vDir;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        void main() {
          vec3 d = normalize(vDir);
          float y = d.y;
          vec3 col = mix(uHorizon, uZenith, pow(clamp(y, 0.0, 1.0), 0.55));
          col = mix(col, uHorizon * 0.55, smoothstep(0.0, -0.25, y));
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 900.0) * 6.0 + pow(sd, 12.0) * 0.28 + pow(sd, 3.0) * 0.08) * (1.0 - uNight * 0.2);
          // moon
          float md = max(dot(d, -uSunDir), 0.0);
          col += vec3(0.75, 0.82, 1.0) * (smoothstep(0.9993, 0.9996, md) * 1.2 + pow(md, 60.0) * 0.12) * uNight;
          // stars
          vec3 sp = d * 240.0;
          vec3 g = floor(sp);
          float s = hash(g);
          float tw = 0.7 + 0.3 * sin(uTime * 2.0 + s * 80.0);
          float star = step(0.9962, s) * smoothstep(0.5, 0.12, length(fract(sp) - 0.5));
          col += vec3(0.9, 0.95, 1.0) * star * tw * uNight * uNight * smoothstep(0.02, 0.25, y) * 1.6;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    scene.add(this.sky);
    this.apply(0);
  }

  // Register a material property that should change between day and night.
  nightLerp(mat, key, day, night) { this.nightMaterials.push({ mat, key, day, night }); }

  setHour(h) { this.hour = ((h % 24) + 24) % 24; this.apply(0); }

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
    // Light comes from the moon at night.
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
    // Exposure and bloom follow the light: restrained by day, generous for neon at night.
    this.exposure = lerp(0.82, 1.12, this.night);
    this.bloomThreshold = lerp(1.25, 0.82, this.night);
    this.bloomStrength = lerp(0.3, 0.62, this.night);
    const u = this.skyUniforms;
    u.uZenith.value.copy(this.zenith);
    u.uHorizon.value.copy(this.horizon);
    u.uSunDir.value.copy(this.sunDir);
    u.uSunColor.value.copy(this.sunColor);
    u.uNight.value = this.night;
    u.uTime.value += dt;

    for (const m of this.nightMaterials) m.mat[m.key] = lerp(m.day, m.night, this.night);

    if (this.waterUniforms) {
      const w = this.waterUniforms;
      w.uTime.value += dt;
      w.uSunDir.value.copy(this.lightDir);
      w.uSunColor.value.copy(this.sunColor).multiplyScalar(0.25 + sunI * 0.3);
      w.uSkyColor.value.copy(this.zenith);
      w.uHorizon.value.copy(this.horizon);
      w.uAmbient.value = clamp(hemiI * 0.85, 0.2, 1.1);
    }
  }

  update(dt, focus) {
    this.hour = (this.hour + dt * this.rate) % 24;
    this.apply(dt);
    // Keep the dome and shadow frustum centred on the action.
    this.sky.position.copy(G.camera.position);
    const tx = Math.round(focus.x / 4) * 4, tz = Math.round(focus.z / 4) * 4;
    this.sun.target.position.set(tx, focus.y, tz);
    this.sun.position.set(tx + this.lightDir.x * 260, focus.y + this.lightDir.y * 260, tz + this.lightDir.z * 260);
  }

  clockText() {
    const hh = Math.floor(this.hour), mm = Math.floor((this.hour - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
}
