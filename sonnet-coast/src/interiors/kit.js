// Building blocks for the interiors: shared materials, painted textures, a room builder that bakes
// furniture into a handful of merged meshes (one per material), and the furniture itself.
// Room-local axes: x east, z south, y up from the floor; the way in is on the +z (south) wall.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Batch } from '../world/geom.js';
import { grain } from '../world/citylight.js';
import { makeCanvas, canvasToTexture, UI_FONT } from '../world/textures.js';
import { DETAIL_LAYER } from '../state.js';

// ---- materials (built once, shared by every room) ---------------------------------------------
let M = null;
export function mats() {
  if (M) return M;
  const vc = { vertexColors: true };
  M = {
    matte: grain(new THREE.MeshStandardMaterial({ ...vc, roughness: 0.86 }), 0.9, 0.3, 0.1),
    soft: grain(new THREE.MeshStandardMaterial({ ...vc, roughness: 0.95 }), 2.2, 0.6, 0.14),       // fabric, upholstery
    gloss: grain(new THREE.MeshStandardMaterial({ ...vc, roughness: 0.24, envMapIntensity: 1.1 }), 1.2, 0.08, 0.05),
    metal: new THREE.MeshStandardMaterial({ ...vc, roughness: 0.28, metalness: 0.92, envMapIntensity: 1.3 }),
    // lamps, signs, backlit shelves: vertex colour times 2.4 so they bloom
    glow: new THREE.MeshBasicMaterial({ ...vc, color: new THREE.Color(2.4, 2.4, 2.4), toneMapped: false }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0a0c0e, roughness: 0.04, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.4 }),
    leaf: grain(new THREE.MeshStandardMaterial({ ...vc, roughness: 0.62, side: THREE.DoubleSide }), 3, 0.5, 0.2),
  };
  return M;
}

// ---- painted textures ----------------------------------------------------------------------------
const cache = new Map();
function painted(key, w, h, paint, opts) {
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(w, h), g = c.getContext('2d');
  paint(g, w, h);
  const t = canvasToTexture(c, opts);
  cache.set(key, t);
  return t;
}
const rnd = (s) => () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);

// Oak planks, ~2 m of floor per tile.
export function woodTex(tone = 'oak') {
  return painted('wood:' + tone, 512, 512, (g, w, h) => {
    const r = rnd(tone.length * 97 + 5);
    const base = tone === 'walnut' ? [92, 62, 42] : tone === 'ash' ? [196, 172, 136] : [170, 124, 82];
    const rows = 8, ph = h / rows;
    for (let j = 0; j < rows; j++) {
      let x = -r() * 200;
      while (x < w) {
        const len = 160 + r() * 220, k = 0.84 + r() * 0.3;
        g.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
        g.fillRect(x, j * ph, len, ph);
        // grain streaks
        for (let s = 0; s < 14; s++) {
          const y = j * ph + r() * ph, a = 0.05 + r() * 0.09;
          g.fillStyle = `rgba(${r() < 0.5 ? '40,24,12' : '255,240,210'},${a})`;
          g.fillRect(x, y, len, 1 + r() * 1.5);
        }
        g.fillStyle = 'rgba(30,18,10,0.55)'; g.fillRect(x, j * ph, 2, ph);
        x += len;
      }
      g.fillStyle = 'rgba(30,18,10,0.5)'; g.fillRect(0, j * ph, w, 2);
    }
  });
}
// Square tiles with grout: checker (two colours) or one colour with slight variation.
export function tileTex(key, a, b, n = 8, grout = '#cfcac0') {
  return painted('tile:' + key, 512, 512, (g, w, h) => {
    const r = rnd(key.length * 31 + 7), s = w / n;
    g.fillStyle = grout; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const c = new THREE.Color(b && (i + j) % 2 ? b : a).offsetHSL(0, 0, (r() - 0.5) * 0.04);
      g.fillStyle = `#${c.getHexString()}`;
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(i * s + 2, j * s + 2, s - 4, 3);
    }
  });
}
// Brick-bond glazed wall tiles (2:1).
export function subwayTex(key, color, grout = '#bdb7ad') {
  return painted('sub:' + key, 512, 512, (g, w, h) => {
    const r = rnd(9), cols = 4, rows = 16, tw = w / cols, th = h / rows;
    g.fillStyle = grout; g.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols + 1; i++) {
      const x = i * tw + (j % 2) * tw / 2, c = new THREE.Color(color).offsetHSL(0, 0, (r() - 0.5) * 0.05);
      g.fillStyle = `#${c.getHexString()}`; g.fillRect(x + 2, j * th + 2, tw - 4, th - 4);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 3, j * th + 3, tw - 6, 3);
    }
  });
}
// Speckled stone (terrazzo).
export function terrazzoTex(key, base, chips, size = 7) {
  return painted('tz:' + key, 512, 512, (g, w, h) => {
    const r = rnd(key.length * 13 + 3);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600 * 7 / size; i++) {
      const x = r() * w, y = r() * h, s = 0.8 + r() * r() * size;
      g.fillStyle = chips[Math.floor(r() * chips.length)];
      g.globalAlpha = 0.5 + r() * 0.5;
      g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.5), r() * 3, 0, 6.3); g.fill();
    }
    g.globalAlpha = 1;
    // large slabs
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  });
}
// A sign or board painted with text lines: [{ t, size, color, y, weight, align, x }]
export function labelTex(key, w, h, bg, lines) {
  return painted('lbl:' + key, w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    for (const L of lines) {
      g.font = `${L.weight || 800} ${L.size}px ${UI_FONT}`;
      g.fillStyle = L.color; g.textAlign = L.align || 'center'; g.textBaseline = 'middle';
      if (L.spacing) g.letterSpacing = `${L.spacing}px`;
      // a line too long for the label is squeezed to fit rather than cut off at the edges
      const room = w * 0.94;
      g.fillText(L.t, L.x ?? w / 2, L.y, g.measureText(L.t).width > room ? room : undefined);
      g.letterSpacing = '0px';
    }
  }, { repeat: false });
}
// Abstract art print in the house palette.
export function artTex(seed) {
  return painted('art:' + seed, 256, 320, (g, w, h) => {
    const r = rnd(seed * 7919 + 1);
    const pal = ['#d97757', '#f0e8d8', '#2a9d8f', '#dca236', '#3d3d3a', '#a898cf', '#e07a5f', '#9fb39a'];
    g.fillStyle = pal[1]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = pal[Math.floor(r() * pal.length)];
      const k = r();
      if (k < 0.4) { g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 80, 0, 6.3); g.fill(); }
      else if (k < 0.7) g.fillRect(r() * w * 0.7, r() * h * 0.7, 30 + r() * 120, 20 + r() * 150);
      else { g.beginPath(); g.moveTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.lineTo(r() * w, r() * h); g.fill(); }
    }
  }, { repeat: false });
}
// What a window onto the street looks like from inside at a glance: soft out-of-focus facades,
// awnings and lights. The material colour dims it after dark (see Room.update).
export function streetTex() {
  return painted('street', 512, 256, (g, w, h) => {
    const r = rnd(41);
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#cfe3f2'); sky.addColorStop(0.55, '#eef0ec'); sky.addColorStop(1, '#b9b3a8');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.filter = 'blur(6px)';
    for (let i = 0; i < 9; i++) {
      const x = i * 60 + r() * 30, bw = 50 + r() * 50, top = h * (0.05 + r() * 0.25);
      g.fillStyle = ['#e8e2d6', '#d9cdb8', '#c9d4dc', '#e2d3c4', '#bfc6cc'][i % 5];
      g.fillRect(x, top, bw, h);
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(90,110,130,0.35)'; g.fillRect(x + 6 + (k % 3) * 15, top + 14 + Math.floor(k / 3) * 26, 9, 14); }
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(255,${200 + r() * 40 | 0},150,0.5)`; g.beginPath(); g.arc(r() * w, h * (0.55 + r() * 0.2), 4 + r() * 8, 0, 6.3); g.fill(); }
    g.fillStyle = 'rgba(60,62,66,0.55)'; g.fillRect(0, h * 0.82, w, h * 0.18);
    g.filter = 'none';
  }, { repeat: false });
}

// ---- geometry helpers ----------------------------------------------------------------------------
// Contact shading baked into vertex colours: darker towards the floor and into the room's corners.
function bakeAO(geo, W, D, H) {
  const p = geo.getAttribute('position'), c = geo.getAttribute('color'), n = geo.getAttribute('normal');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const edge = Math.min(x + W / 2, W / 2 - x, z + D / 2, D / 2 - z);
    let k = 1 - 0.3 * Math.exp(-Math.max(0, y) / 0.32) * (Math.abs(n.getY(i)) < 0.5 ? 1 : 0.35);
    k *= 1 - 0.22 * Math.exp(-Math.max(0, edge) / 0.6) * (y < 0.05 || y > H - 0.05 ? 1 : 0.4);
    if (y > H - 0.6) k *= 1 - 0.18 * (1 - (H - y) / 0.6) * Math.exp(-Math.max(0, edge) / 1.2);
    c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
  }
}

export class Room {
  // W x D floor, H high. opts: { floor: texture, floorRepeat, floorKind: 'gloss'|'matte', wall, ceiling, trim }
  constructor(W, D, H, opts = {}) {
    this.W = W; this.D = D; this.H = H; this.opts = opts;
    this.b = { matte: new Batch(), soft: new Batch(), gloss: new Batch(), metal: new Batch(), glow: new Batch(), glass: new Batch(), leaf: new Batch() };
    this.extra = [];         // textured meshes
    this.boxes = [];         // colliders, local [x0, z0, x1, z1, y0, y1]
    this.lamps = [];         // local lamps
    this.seats = {};         // named spots for people
    this.own = {};           // extra batches with the room's own material: name -> material (see batch())
    this.group = new THREE.Group();
    this.shell();
  }
  // A batch drawn with a material of this room's own (one it animates, say).
  batch(name, material) { this.b[name] = new Batch(); this.own[name] = material; return this; }
  // ---- primitives (local coordinates, y = base) -----------------------------------------------
  box(k, sx, sy, sz, x, y, z, color, ry = 0) { this.b[k].box(sx, sy, sz, x, y, z, color, ry); return this; }
  rbox(k, sx, sy, sz, x, y, z, color, r = 0.05, ry = 0, seg = 2) {
    this.b[k].add(new RoundedBoxGeometry(sx, sy, sz, seg, Math.min(r, sx / 2 - 0.001, sy / 2 - 0.001, sz / 2 - 0.001)), color, x, y + sy / 2, z, 0, ry, 0);
    return this;
  }
  cyl(k, rt, rb, h, x, y, z, color, seg = 16) { this.b[k].cyl(rt, rb, h, x, y, z, color, seg); return this; }
  sphere(k, r, x, y, z, color, sx = 1, sy = 1, sz = 1, detail = 1) { this.b[k].sphere(r, x, y, z, color, sx, sy, sz, detail); return this; }
  add(k, geo, color, x, y, z, rx = 0, ry = 0, rz = 0) { this.b[k].add(geo, color, x, y, z, rx, ry, rz); return this; }
  solid(x0, z0, x1, z1, y0 = 0, y1 = 1) { this.boxes.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y0, y1]); return this; }
  lamp(x, y, z, color, power, range, dir = null, cone = 0.5) { this.lamps.push({ x, y, z, color, power, range, dir, cone }); return this; }
  // A textured quad facing +z (before ry), centred at x, y, z.
  quad(tex, w, h, x, y, z, ry = 0, { basic = false, rough = 0.6, color = 0xffffff, repeat = null } = {}) {
    const geo = new THREE.PlaneGeometry(w, h);
    if (repeat) { const uv = geo.getAttribute('uv'); for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * repeat[0], uv.getY(i) * repeat[1]); }
    const mat = basic ? new THREE.MeshBasicMaterial({ map: tex, color }) : new THREE.MeshStandardMaterial({ map: tex, roughness: rough, color });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    this.extra.push(m);
    return m;
  }

  // Floor, walls and ceiling facing in, with skirting and a cornice.
  shell() {
    const { W, D, H, opts } = this;
    const wall = opts.wall ?? 0xe9e3d8, ceil = opts.ceiling ?? 0xf3efe8, trim = opts.trim ?? 0xd8d0c2;
    // the floor is its own mesh so it can carry a texture; it is subdivided for the baked shading
    const fg = opts.round ? new THREE.CircleGeometry(W / 2, 72, 0, Math.PI * 2) : new THREE.PlaneGeometry(W, D, Math.ceil(W * 2), Math.ceil(D * 2));
    fg.rotateX(-Math.PI / 2);
    const rep = opts.floorRepeat || 2;
    const uv = fg.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * W / rep, uv.getY(i) * D / rep);
    const cols = new Float32Array(fg.getAttribute('position').count * 3).fill(1);
    fg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    bakeAO(fg, W, D, H);
    const fm = new THREE.MeshStandardMaterial({ map: opts.floor || null, color: opts.floorColor ?? 0xffffff, vertexColors: true, roughness: opts.floorRough ?? 0.32, envMapIntensity: 1.2 });
    const floor = new THREE.Mesh(fg, fm);
    floor.receiveShadow = true;
    this.extra.push(floor);
    const plane = (w, h, x, y, z, ry, color, k = 'matte', rx = 0) => {
      const g = new THREE.PlaneGeometry(w, h, Math.ceil(w), Math.ceil(h * 2));
      this.b[k].add(g, color, x, y, z, rx, ry, 0);
    };
    if (!opts.round) {
      plane(W, H, 0, H / 2, -D / 2, 0, opts.backWall ?? wall);
      plane(W, H, 0, H / 2, D / 2, Math.PI, opts.frontWall ?? wall);
      plane(D, H, -W / 2, H / 2, 0, Math.PI / 2, opts.leftWall ?? wall);
      plane(D, H, W / 2, H / 2, 0, -Math.PI / 2, opts.rightWall ?? wall);
      // skirting and cornice all round
      for (const [w, x, z, ry] of [[W, 0, -D / 2, 0], [W, 0, D / 2, 0], [D, -W / 2, 0, Math.PI / 2], [D, W / 2, 0, Math.PI / 2]]) {
        this.box('matte', w, 0.12, 0.03, x, 0, z, trim, ry);
        this.box('matte', w, 0.08, 0.06, x, H - 0.08, z, trim, ry);
      }
    }
    if (!opts.noCeiling) plane(W, D, 0, H, 0, 0, ceil, 'matte', Math.PI / 2);
    if (opts.round) return;
    // walls keep the player in and the camera from looking out
    const t = 0.6;
    this.solid(-W / 2 - t, -D / 2 - t, W / 2 + t, -D / 2, 0, H + 1);
    this.solid(-W / 2 - t, D / 2, W / 2 + t, D / 2 + t, 0, H + 1);
    this.solid(-W / 2 - t, -D / 2, -W / 2, D / 2, 0, H + 1);
    this.solid(W / 2, -D / 2, W / 2 + t, D / 2, 0, H + 1);
    this.solid(-W / 2 - t, -D / 2 - t, W / 2 + t, D / 2 + t, H, H + 2);
  }

  // The way out: a door in a frame on the front wall, with a softly lit exit sign over it.
  exitDoor(x, color = 0x3a3d42, w = 1.3) {
    const z = this.D / 2 - 0.02;
    this.box('metal', w + 0.24, 2.42, 0.08, x, 0, z, 0x2a2c30);
    this.box('gloss', w, 2.3, 0.05, x, 0, z - 0.04, color);
    this.box('glass', w - 0.3, 1.5, 0.02, x, 0.6, z - 0.07, 0xffffff);
    this.cyl('metal', 0.016, 0.016, 0.8, x - w / 2 + 0.16, 0.82, z - 0.11, 0xb9bec4, 8);
    this.box('glow', 0.42, 0.14, 0.03, x, 2.55, z - 0.03, 0x7dffb0);
    this.door = { x, z: z - 0.9 };
    return this;
  }
  // A window onto the street on the front wall: frame, glass and the view behind, plus blinds.
  streetWindow(x, w, h = 1.9, y = 0.7, blinds = true) {
    const z = this.D / 2 - 0.01;
    const view = this.quad(streetTex(), w, h, x, y + h / 2, z - 0.005, Math.PI, { basic: true });
    this.views = this.views || [];
    this.views.push(view.material);
    this.box('metal', w + 0.12, 0.08, 0.14, x, y - 0.08, z - 0.06, 0x2a2c30);
    this.box('metal', w + 0.12, 0.08, 0.14, x, y + h, z - 0.06, 0x2a2c30);
    for (let k = 0; k <= Math.round(w / 1.4); k++) this.box('metal', 0.06, h, 0.1, x - w / 2 + (w * k) / Math.round(w / 1.4), y, z - 0.05, 0x2a2c30);
    this.box('glass', w, h, 0.02, x, y, z - 0.05, 0xffffff);
    if (blinds) for (let k = 0; k < 9; k++) this.box('matte', w - 0.06, 0.012, 0.06, x, y + h - 0.05 - k * 0.085, z - 0.15, 0xefe9de);
    return this;
  }

  // ---- finish: bake, merge, place --------------------------------------------------------------
  build(origin) {
    const m = mats(), W = this.W, D = this.D, H = this.H;
    for (const k of Object.keys(this.b)) {
      if (this.b[k].empty) continue;
      const geo = this.b[k].merged();
      const own = this.own[k];
      if (k !== 'glow' && k !== 'glass' && !own) bakeAO(geo, W, D, H);
      const mesh = new THREE.Mesh(geo, own || m[k]);
      mesh.receiveShadow = true;
      if (k === 'leaf' || k === 'glass') mesh.layers.set(DETAIL_LAYER);
      if (k === 'glass') mesh.renderOrder = 3;
      this.group.add(mesh);
    }
    for (const e of this.extra) this.group.add(e);
    this.group.position.set(origin.x, origin.y, origin.z);
    this.group.visible = false;
    this.group.traverse((o) => { o.updateMatrix(); o.matrixAutoUpdate = o === this.group || !!o.userData.live; });
    this.group.updateMatrixWorld(true);
    this.origin = origin;
    return this;
  }
  world(x, z) { return { x: this.origin.x + x, z: this.origin.z + z }; }
}

// ---- furniture (all on a Room r, local coordinates) -----------------------------------------------
export function chair(r, x, z, ry, seat = 0x2f3034, frame = 0x1f2023) {
  const s = Math.sin(ry), c = Math.cos(ry);
  for (const [a, b] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) r.cyl('metal', 0.014, 0.012, 0.45, x + a * c + b * s, 0, z - a * s + b * c, frame, 6);
  r.rbox('soft', 0.44, 0.06, 0.42, x, 0.44, z, seat, 0.025, ry);
  r.rbox('soft', 0.42, 0.4, 0.04, x - s * 0.21, 0.5, z - c * 0.21, seat, 0.02, ry);
}
export function stool(r, x, z, seat = 0x8a5a3c, h = 0.76) {
  r.cyl('metal', 0.03, 0.03, h - 0.04, x, 0, z, 0x2a2b2f, 10);
  r.cyl('metal', 0.18, 0.2, 0.025, x, 0, z, 0x2a2b2f, 16);
  r.add('metal', new THREE.TorusGeometry(0.16, 0.012, 5, 18), 0x9a9ea4, x, 0.3, z, Math.PI / 2, 0, 0);
  r.add('soft', new RoundedBoxGeometry(0.38, 0.07, 0.38, 2, 0.03), seat, x, h, z);
}
export function roundTable(r, x, z, rad = 0.36, top = 0xe8e0d0, h = 0.74, legCol = 0x1f2023) {
  r.cyl('metal', 0.035, 0.035, h - 0.03, x, 0, z, legCol, 10);
  r.cyl('metal', 0.24, 0.26, 0.02, x, 0, z, legCol, 18);
  r.cyl('gloss', rad, rad, 0.035, x, h - 0.035, z, top, 28);
  r.solid(x - rad * 0.8, z - rad * 0.8, x + rad * 0.8, z + rad * 0.8, 0, h);
}
export function rectTable(r, x, z, w, d, top = 0x9a7550, h = 0.74, ry = 0) {
  r.rbox('gloss', w, 0.04, d, x, h - 0.04, z, top, 0.012, ry);
  const s = Math.sin(ry), c = Math.cos(ry);
  for (const [a, b] of [[-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06], [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06]]) r.box('matte', 0.05, h - 0.04, 0.05, x + a * c + b * s, 0, z - a * s + b * c, 0x2a2420, ry);
  r.solid(x - (Math.abs(c) * w + Math.abs(s) * d) / 2, z - (Math.abs(s) * w + Math.abs(c) * d) / 2, x + (Math.abs(c) * w + Math.abs(s) * d) / 2, z + (Math.abs(s) * w + Math.abs(c) * d) / 2, 0, h);
}
// Upholstered booth: seat and tall back, buttoned, facing ry (the way a sitter looks).
export function booth(r, x, z, w, ry, col = 0x6b7a5c, base = 0x3a2e26) {
  const s = Math.sin(ry), c = Math.cos(ry);
  const bx = x - s * 0.3, bz = z - c * 0.3;
  r.rbox('matte', w, 0.4, 0.62, x - s * 0.02, 0, z - c * 0.02, base, 0.02, ry);
  r.rbox('soft', w - 0.04, 0.12, 0.56, x, 0.38, z, col, 0.05, ry);
  r.rbox('soft', w - 0.04, 0.72, 0.16, bx, 0.46, bz, col, 0.06, ry);
  // channel tufting on the back
  const n = Math.max(2, Math.round(w / 0.32));
  for (let i = 1; i < n; i++) { const o = -w / 2 + (w * i) / n; r.box('soft', 0.015, 0.6, 0.01, bx + c * o + s * 0.085, 0.52, bz - s * o + c * 0.085, new THREE.Color(col).multiplyScalar(0.7).getHex(), ry); }
  r.solid(x - (Math.abs(c) * w + Math.abs(s) * 0.7) / 2, z - (Math.abs(s) * w + Math.abs(c) * 0.7) / 2, x + (Math.abs(c) * w + Math.abs(s) * 0.7) / 2, z + (Math.abs(s) * w + Math.abs(c) * 0.7) / 2, 0, 0.5);
}
export function sofa(r, x, z, w, ry, col = 0xd9cdb8, legs = 0x2a2420) {
  const s = Math.sin(ry), c = Math.cos(ry);
  r.rbox('soft', w, 0.22, 0.86, x, 0.12, z, col, 0.08, ry);
  r.rbox('soft', w - 0.3, 0.14, 0.62, x + s * 0.06, 0.32, z + c * 0.06, new THREE.Color(col).offsetHSL(0, 0, 0.03).getHex(), 0.06, ry);
  r.rbox('soft', w, 0.44, 0.2, x - s * 0.33, 0.3, z - c * 0.33, col, 0.08, ry);
  for (const o of [-1, 1]) r.rbox('soft', 0.18, 0.3, 0.86, x + c * o * (w / 2 - 0.09), 0.3, z - s * o * (w / 2 - 0.09), col, 0.07, ry);
  for (const [a, b] of [[-w / 2 + 0.1, -0.35], [w / 2 - 0.1, -0.35], [-w / 2 + 0.1, 0.35], [w / 2 - 0.1, 0.35]]) r.cyl('metal', 0.02, 0.015, 0.12, x + a * c + b * s, 0, z - a * s + b * c, legs, 6);
  r.solid(x - (Math.abs(c) * w + Math.abs(s) * 0.9) / 2, z - (Math.abs(s) * w + Math.abs(c) * 0.9) / 2, x + (Math.abs(c) * w + Math.abs(s) * 0.9) / 2, z + (Math.abs(s) * w + Math.abs(c) * 0.9) / 2, 0, 0.6);
}
// A potted plant: tapered pot, soil, a crown of leaves (fronds for 'palm', a ball for 'bush').
export function plant(r, x, z, h = 1.3, kind = 'bush', pot = 0xd8cfc0) {
  const pr = 0.16 + h * 0.06;
  r.cyl('matte', pr, pr * 0.78, pr * 1.9, x, 0, z, pot, 18);
  r.cyl('matte', pr * 0.92, pr * 0.92, 0.02, x, pr * 1.86, z, 0x3a2a1e, 14);
  const top = pr * 1.9;
  const greens = [0x3f7a3c, 0x4a8a3c, 0x2f6a3a, 0x5a9a48];
  if (kind === 'palm') {
    r.cyl('matte', 0.025, 0.035, h * 0.6, x, top, z, 0x6b5a3e, 6);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + i * 0.3, len = h * (0.42 + (i % 3) * 0.08);
      const g = new THREE.PlaneGeometry(0.2, len, 1, 3);
      const p = g.getAttribute('position');
      for (let k = 0; k < p.count; k++) { const t = (p.getY(k) + len / 2) / len; p.setZ(k, -t * t * len * 0.45); p.setX(k, p.getX(k) * (1 - t * 0.6)); }
      g.translate(0, len / 2, 0);
      r.add('leaf', g, greens[i % 4], x, top + h * 0.55, z, -1.0 + (i % 2) * 0.25, a, 0);
    }
  } else if (kind === 'tree') {
    r.cyl('matte', 0.035, 0.05, h * 0.55, x, top, z, 0x5a4632, 7);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4, rr = 0.25 + (i % 3) * 0.1;
      r.sphere('leaf', 0.32 + (i % 2) * 0.08, x + Math.cos(a) * rr, top + h * (0.55 + (i % 4) * 0.1), z + Math.sin(a) * rr, greens[i % 4], 1, 0.8, 1, 2);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1;
      r.sphere('leaf', h * 0.22, x + Math.cos(a) * h * 0.12, top + h * (0.18 + (i % 3) * 0.08), z + Math.sin(a) * h * 0.12, greens[i % 4], 1, 0.85, 1, 1);
    }
  }
  r.solid(x - pr, z - pr, x + pr, z + pr, 0, top + 0.1);
}
// Pendant: cord, shade, glowing bulb under it, and the lamp it casts.
export function pendant(r, x, z, drop = 0.9, shade = 0x22252a, light = 0xffd9a8, power = 6, range = 6, shape = 'dome') {
  const y = r.H - drop;
  r.cyl('metal', 0.006, 0.006, drop - 0.12, x, y + 0.12, z, 0x18191b, 4);
  if (shape === 'dome') r.add('metal', new THREE.SphereGeometry(0.2, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), shade, x, y, z);
  else r.cyl('metal', 0.08, 0.16, 0.26, x, y - 0.1, z, shade, 18);
  r.sphere('glow', 0.06, x, y - 0.02, z, light);
  r.lamp(x, y - 0.15, z, light, power, range);
}
// Framed print on a wall: wall = 'back' | 'left' | 'right'.
export function art(r, seed, x, y, z, w, h, ry) {
  const s = Math.sin(ry), c = Math.cos(ry);
  r.box('matte', w + 0.08, h + 0.08, 0.03, x, y - h / 2 - 0.04, z, 0x1f1f22, ry);
  r.quad(artTex(seed), w, h, x + s * 0.02, y, z + c * 0.02, ry, { rough: 0.8 });
}
// Shelf with bottles or products in rows; backlit bottles glow a little.
export function bottleShelf(r, x, z, w, ry, rows = 3, y0 = 1.05, lit = true) {
  const s = Math.sin(ry), c = Math.cos(ry);
  const cols = [0x6b3a1e, 0x2e5a3a, 0xc9a24a, 0x7a2e3a, 0xd8d2c4, 0x3a4a6a, 0xa86a2a];
  let k = 0;
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * 0.42;
    r.box('gloss', w, 0.025, 0.24, x, y, z, 0x2a2420, ry);
    if (lit) r.box('glow', w - 0.05, 0.012, 0.02, x - s * 0.1, y + 0.03, z - c * 0.1, 0xffc98a, ry);
    const n = Math.floor(w / 0.13);
    for (let i = 0; i < n; i++) {
      if ((i * 7 + j * 3) % 9 === 0) continue;
      const o = -w / 2 + 0.08 + i * (w - 0.16) / (n - 1), hb = 0.2 + ((i * 5 + j) % 4) * 0.04;
      const px = x + c * o, pz = z - s * o, col = cols[(k++) % cols.length];
      r.cyl('gloss', 0.035, 0.038, hb, px, y + 0.025, pz, col, 8);
      r.cyl('gloss', 0.012, 0.03, 0.08, px, y + 0.025 + hb, pz, col, 6);
    }
  }
}
