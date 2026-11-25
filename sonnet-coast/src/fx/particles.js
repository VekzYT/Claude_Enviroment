// Lightweight CPU particles (two point clouds: additive and alpha-blended), skid marks,
// and one reusable flash light for explosions and muzzle flashes.
import * as THREE from 'three';
import { makeGlowTexture } from '../world/textures.js';
import { rand } from '../util/rng.js';
import { G } from '../state.js';

// What a sliding tyre throws up, by surface: colour, alpha, start/end size, life, rise, gravity, drag.
const TYRE = {
  asphalt: [0.9, 0.9, 0.92, 0.46, 1.3, 3.8, 2.6, 0.85, -0.2, 1.3],
  concrete: [0.92, 0.91, 0.9, 0.46, 1.3, 3.8, 2.6, 0.85, -0.2, 1.3],
  dirt: [0.56, 0.45, 0.32, 0.6, 1.4, 5.0, 1.8, 1.0, 0.15, 1.6],
  sand: [0.8, 0.7, 0.52, 0.58, 1.4, 4.8, 1.7, 1.1, 0.2, 1.6],
  grass: [0.42, 0.42, 0.28, 0.3, 0.9, 3.6, 1.2, 0.9, 0.4, 1.8],
  mud: [0.3, 0.24, 0.16, 0.5, 0.6, 2.2, 1.0, 2.6, 9, 0.8],
};

const VERT = /* glsl */`
  attribute float aSize; attribute vec4 aColor;
  varying vec4 vColor;
  uniform float uScale;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(-mv.z, 0.5);
    #ifdef PULL
      // a sprite is depth-tested at one depth, so the ground cut a low puff along a hard line; test it at the
      // front of its ball instead (same spot on screen, size from the real depth)
      float d = length(mv.xyz);
      mv.xyz *= (d - min(min(aSize * 0.55, 4.0), max(d - 0.6, 0.0))) / max(d, 1e-3);
    #endif
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */`
  uniform sampler2D uMap; varying vec4 vColor;
  void main() {
    float a = texture2D(uMap, gl_PointCoord).a;
    gl_FragColor = vec4(vColor.rgb, vColor.a * a);
    #ifdef PREMULT
      gl_FragColor.rgb *= gl_FragColor.a;
    #endif
  }`;

// A soft, slightly lumpy puff for smoke, dust and spray (white, shape in the alpha channel).
function makePuffTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), h = size / 2;
  const blob = (x, y, r, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${a})`);
    gr.addColorStop(0.45, `rgba(255,255,255,${a * 0.6})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
  };
  blob(h, h, h, 0.75);
  for (let i = 0; i < 7; i++) { const a = i * 0.9, d = h * 0.32; blob(h + Math.cos(a) * d, h + Math.sin(a) * d, h * 0.55, 0.22); }
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

class Cloud {
  constructor(scene, cap, additive, tex) {
    this.cap = cap; this.n = 0;
    this.p = new Float32Array(cap * 3); this.c = new Float32Array(cap * 4); this.s = new Float32Array(cap);
    this.v = new Float32Array(cap * 3);
    this.life = new Float32Array(cap); this.max = new Float32Array(cap);
    this.s0 = new Float32Array(cap); this.s1 = new Float32Array(cap);
    this.col = new Float32Array(cap * 4);
    this.grav = new Float32Array(cap); this.drag = new Float32Array(cap);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.c, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.s, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: tex }, uScale: { value: 600 } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, defines: additive ? {} : { PULL: 1 },
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 6 : 5;
    g.setDrawRange(0, 0);
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, life, s0, s1, r, g, b, a, grav = 0, drag = 0) {
    let i = this.n;
    if (i >= this.cap) { i = Math.floor(Math.random() * this.cap); } else this.n++;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.life[i] = life; this.max[i] = life; this.s0[i] = s0; this.s1[i] = s1;
    this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a;
    this.grav[i] = grav; this.drag[i] = drag;
  }
  update(dt) {
    let n = this.n;
    for (let i = 0; i < n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        // swap-remove
        n--;
        if (i !== n) {
          for (let k = 0; k < 3; k++) { this.p[i * 3 + k] = this.p[n * 3 + k]; this.v[i * 3 + k] = this.v[n * 3 + k]; }
          for (let k = 0; k < 4; k++) this.col[i * 4 + k] = this.col[n * 4 + k];
          this.life[i] = this.life[n]; this.max[i] = this.max[n]; this.s0[i] = this.s0[n]; this.s1[i] = this.s1[n];
          this.grav[i] = this.grav[n]; this.drag[i] = this.drag[n];
          i--;
        }
        continue;
      }
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.v[i * 3] *= d; this.v[i * 3 + 1] = this.v[i * 3 + 1] * d - this.grav[i] * dt; this.v[i * 3 + 2] *= d;
      this.p[i * 3] += this.v[i * 3] * dt; this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt; this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      const t = 1 - this.life[i] / this.max[i];
      this.s[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * t;
      const fade = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      this.c[i * 4] = this.col[i * 4]; this.c[i * 4 + 1] = this.col[i * 4 + 1]; this.c[i * 4 + 2] = this.col[i * 4 + 2];
      this.c[i * 4 + 3] = this.col[i * 4 + 3] * fade;
    }
    this.n = n;
    const g = this.points.geometry;
    g.setDrawRange(0, n);
    g.attributes.position.needsUpdate = true; g.attributes.aColor.needsUpdate = true; g.attributes.aSize.needsUpdate = true;
  }
}

const SKID_MAX = 2400;

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.add = new Cloud(scene, 1400, true, makeGlowTexture());
    this.alpha = new Cloud(scene, 1600, false, makePuffTexture());
    this.flashLight = new THREE.PointLight(0xffaa66, 0, 60, 1.6);
    this.flashLight.position.set(0, -100, 0);
    scene.add(this.flashLight);
    this.flashT = 0; this.flashDur = 0.1; this.flashI = 0;
    this.shake = 0;

    // skid marks: ring buffer of quads
    this.skidPos = new Float32Array(SKID_MAX * 4 * 3);
    this.skidAlpha = new Float32Array(SKID_MAX * 4);
    const idx = [];
    for (let i = 0; i < SKID_MAX; i++) idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(this.skidPos, 3).setUsage(THREE.DynamicDrawUsage));
    sg.setAttribute('aAlpha', new THREE.BufferAttribute(this.skidAlpha, 1).setUsage(THREE.DynamicDrawUsage));
    sg.setIndex(idx);
    sg.setDrawRange(0, 0);
    this.skidMesh = new THREE.Mesh(sg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -10, side: THREE.DoubleSide,
      vertexShader: 'attribute float aAlpha; varying float vA; void main(){ vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(0.02, 0.02, 0.025, vA); }',
    }));
    this.skidMesh.frustumCulled = false;
    this.skidMesh.renderOrder = 3;
    scene.add(this.skidMesh);
    this.skidHead = 0; this.skidUsed = 0;
    // quads written since the renderer last uploaded them (several updates can run between two renders)
    this.skidLo = SKID_MAX; this.skidHi = -1; this.skidUploads = 0;
    const uploaded = () => { if (++this.skidUploads === 2) { this.skidUploads = 0; this.skidLo = SKID_MAX; this.skidHi = -1; } };
    sg.attributes.position.onUpload(uploaded);
    sg.attributes.aAlpha.onUpload(uploaded);
    this.dim = 1;                               // unlit smoke darkens at night
    this.skidLast = new Map(); // key -> {x,y,z,lx,lz,rx,rz,t}
    this.time = 0;
  }

  // ---- emitters ---------------------------------------------------------
  smoke(x, y, z, { dark = 0.25, size = 2.2, life = 1.6, up = 1.6, spread = 0.6, alpha = 0.5 } = {}) {
    this.alpha.emit(x, y, z, rand(-spread, spread), up * rand(0.7, 1.3), rand(-spread, spread), life * rand(0.7, 1.2), size * 0.45, size * 2.2, dark, dark, dark * 1.05, alpha, -0.3, 0.6);
  }
  // Thick, slow tyre smoke (or dust, or spray) from a sliding wheel; k (0..1) sets how hard it slides.
  tyreSmoke(x, y, z, vx, vz, surface, k = 1) {
    if (surface === 'water') return this.spray(x, 0.1, z, vx, vz, 1);
    const c = TYRE[surface] || TYRE.asphalt, dim = this.dim, f = 0.6 + 0.4 * k;
    this.alpha.emit(x + rand(-0.25, 0.25), y, z + rand(-0.25, 0.25), vx + rand(-0.9, 0.9), c[7] * rand(0.5, 1.3), vz + rand(-0.9, 0.9),
      c[6] * rand(0.75, 1.25), c[4] * f, c[5] * f, c[0] * dim, c[1] * dim, c[2] * dim, c[3] * f, c[8], c[9]);
  }
  dust(x, y, z, r = 0.55, g = 0.45, b = 0.32, size = 2.4) {
    this.alpha.emit(x, y, z, rand(-1, 1), rand(0.4, 1.4), rand(-1, 1), rand(0.6, 1.3), size * 0.4, size * 2, r, g, b, 0.38, 0, 1.2);
  }
  spray(x, y, z, vx, vz, n = 3) {
    for (let i = 0; i < n; i++) this.alpha.emit(x + rand(-0.4, 0.4), y, z + rand(-0.4, 0.4), vx + rand(-2, 2), rand(2, 5), vz + rand(-2, 2), rand(0.4, 0.8), 0.6, 1.8, 0.85, 0.93, 0.96, 0.5, 9, 0.5);
  }
  fire(x, y, z, size = 1.4) {
    this.add.emit(x + rand(-0.3, 0.3), y, z + rand(-0.3, 0.3), rand(-0.4, 0.4), rand(1.5, 3.2), rand(-0.4, 0.4), rand(0.35, 0.7), size * 1.4, size * 0.3, 1.0, rand(0.35, 0.6), 0.1, 0.8, -1, 0.5);
  }
  sparks(x, y, z, n = 8, dx = 0, dz = 0, color = [1.0, 0.75, 0.35]) {
    for (let i = 0; i < n; i++) {
      this.add.emit(x, y, z, dx * rand(2, 8) + rand(-4, 4), rand(1, 7), dz * rand(2, 8) + rand(-4, 4), rand(0.25, 0.7), 0.5, 0.1, color[0], color[1], color[2], 1, 16, 0.4);
    }
  }
  zap(x, y, z, n = 14, radius = 1) {
    for (let i = 0; i < n; i++) this.add.emit(x + rand(-radius, radius), y + rand(-0.5, 1), z + rand(-radius, radius), rand(-5, 5), rand(-1, 6), rand(-5, 5), rand(0.15, 0.45), 0.9, 0.1, 0.4, 0.95, 1.0, 1, 4, 1);
  }
  nitro(x, y, z, vx, vz) {
    this.add.emit(x, y, z, vx + rand(-0.6, 0.6), rand(-0.2, 0.5), vz + rand(-0.6, 0.6), rand(0.08, 0.18), 0.5, 0.12, 0.3, 0.7, 1.0, 0.55, 0, 2);
  }
  glowPuff(x, y, z, r, g, b, size = 2, life = 0.5) {
    this.add.emit(x, y, z, 0, 0.3, 0, life, size, size * 2.4, r, g, b, 0.8, 0, 0);
  }
  explosion(x, y, z, scale = 1) {
    this.add.emit(x, y + 1, z, 0, 0, 0, 0.22, 26 * scale, 40 * scale, 1.0, 0.85, 0.6, 1, 0, 0);
    for (let i = 0; i < 26; i++) {
      const a = rand(0, 6.283), s = rand(2, 11) * scale;
      this.add.emit(x, y + 0.8, z, Math.cos(a) * s, rand(2, 11) * scale, Math.sin(a) * s, rand(0.5, 1.1), 7 * scale, 1.5, 1.0, rand(0.3, 0.6), 0.08, 0.95, 5, 1.6);
    }
    for (let i = 0; i < 20; i++) {
      const a = rand(0, 6.283), s = rand(1, 6) * scale;
      this.alpha.emit(x, y + 1, z, Math.cos(a) * s, rand(2, 7) * scale, Math.sin(a) * s, rand(1.6, 3.4), 3 * scale, 12 * scale, 0.09, 0.08, 0.08, 0.7, -0.6, 0.9);
    }
    this.sparks(x, y + 1, z, 40);
    this.flash(x, y + 2.5, z, 0xffa860, 900 * scale, 0.45);
    this.shake = Math.max(this.shake, 1);
  }
  splash(x, z, scale = 1) {
    for (let i = 0; i < 16; i++) {
      const a = rand(0, 6.283), s = rand(1, 5) * scale;
      this.alpha.emit(x, 0.1, z, Math.cos(a) * s, rand(3, 8) * scale, Math.sin(a) * s, rand(0.5, 1.0), 0.8, 2.6 * scale, 0.86, 0.94, 0.97, 0.6, 12, 0.4);
    }
  }
  flash(x, y, z, color, intensity, dur = 0.12) {
    this.flashLight.position.set(x, y, z);
    this.flashLight.color.set(color);
    this.flashI = intensity; this.flashDur = dur; this.flashT = dur;
  }
  addShake(v) { this.shake = Math.min(1.4, Math.max(this.shake, v)); }

  // Lay a strip of rubber. key identifies the wheel; call every frame while it slides.
  skid(key, x, y, z, dirX, dirZ, width = 0.26, alpha = 0.55) {
    const last = this.skidLast.get(key);
    const px = -dirZ * width / 2, pz = dirX * width / 2;
    const cur = { x, y, z, lx: x - px, lz: z - pz, rx: x + px, rz: z + pz, t: this.time };
    if (last && this.time - last.t < 0.12) {
      const d2 = (x - last.x) ** 2 + (z - last.z) ** 2;
      if (d2 < 0.2) return;
      if (d2 < 36) {
        const i = this.skidHead;
        this.skidHead = (i + 1) % SKID_MAX;
        const p = this.skidPos, o = i * 12;
        p[o] = last.lx; p[o + 1] = last.y + 0.045; p[o + 2] = last.lz;
        p[o + 3] = last.rx; p[o + 4] = last.y + 0.045; p[o + 5] = last.rz;
        p[o + 6] = cur.lx; p[o + 7] = y + 0.045; p[o + 8] = cur.lz;
        p[o + 9] = cur.rx; p[o + 10] = y + 0.045; p[o + 11] = cur.rz;
        for (let k = 0; k < 4; k++) this.skidAlpha[i * 4 + k] = alpha;
        if (i >= this.skidUsed) { this.skidUsed = i + 1; this.skidMesh.geometry.setDrawRange(0, this.skidUsed * 6); }
        if (i < this.skidLo) this.skidLo = i;
        if (i > this.skidHi) this.skidHi = i;
      }
    }
    this.skidLast.set(key, cur);
  }

  update(dt) {
    this.time += dt;
    this.add.update(dt);
    this.alpha.update(dt);
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.flashLight.intensity = this.flashI * Math.max(0, this.flashT / this.flashDur);
    } else this.flashLight.intensity = 0;
    this.shake = Math.max(0, this.shake - dt * 2.2);
    if (this.skidHi >= 0) {
      // upload only the stretch of the ring buffer that changed
      const a = this.skidMesh.geometry.attributes, lo = this.skidLo, n = this.skidHi - lo + 1;
      a.position.clearUpdateRanges(); a.position.addUpdateRange(lo * 12, n * 12); a.position.needsUpdate = true;
      a.aAlpha.clearUpdateRanges(); a.aAlpha.addUpdateRange(lo * 4, n * 4); a.aAlpha.needsUpdate = true;
      this.skidUploads = 0;
    }
    if (G.env) this.dim = 1 - 0.72 * G.env.night;
    if (this.skidLast.size > 200) this.skidLast.clear();
  }
  setScale(pxHeight) { const s = pxHeight * 0.9; this.add.mat.uniforms.uScale.value = s; this.alpha.mat.uniforms.uScale.value = s; }
}
