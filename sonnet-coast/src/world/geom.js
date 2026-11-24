// Helpers for baking lots of primitives into a few merged, vertex-coloured meshes.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

export function colorize(geo, color) {
  _c.set(color);
  const n = geo.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = _c.r; arr[i * 3 + 1] = _c.g; arr[i * 3 + 2] = _c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

export class Batch {
  constructor() { this.geos = []; }
  get empty() { return this.geos.length === 0; }
  // Adds a geometry (consumed) with transform and flat colour.
  add(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    if (geo.index) { const g = geo.toNonIndexed(); geo.dispose(); geo = g; }
    _e.set(rx, ry, rz, 'YXZ');
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
    geo.applyMatrix4(_m);
    colorize(geo, color);
    if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
    this.geos.push(geo);
    return this;
  }
  // Box centred at x,z with its base at y.
  box(sx, sy, sz, x, y, z, color, ry = 0, rx = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(sx, sy, sz), color, x, y + sy / 2, z, rx, ry, rz);
  }
  // Box centred on all axes (for tilted parts).
  cbox(sx, sy, sz, x, y, z, color, ry = 0, rx = 0, rz = 0) {
    return this.add(new THREE.BoxGeometry(sx, sy, sz), color, x, y, z, rx, ry, rz);
  }
  cyl(rTop, rBot, h, x, y, z, color, segs = 8, rx = 0, ry = 0, rz = 0) {
    return this.add(new THREE.CylinderGeometry(rTop, rBot, h, segs), color, x, y + (rx || rz ? 0 : h / 2), z, rx, ry, rz);
  }
  cone(r, h, x, y, z, color, segs = 7) {
    return this.add(new THREE.ConeGeometry(r, h, segs), color, x, y + h / 2, z);
  }
  sphere(r, x, y, z, color, sx = 1, sy = 1, sz = 1, detail = 1) {
    return this.add(new THREE.IcosahedronGeometry(r, detail), color, x, y, z, 0, 0, 0, sx, sy, sz);
  }
  merged() {
    if (!this.geos.length) return new THREE.BufferGeometry();
    const g = mergeGeometries(this.geos, false);
    for (const x of this.geos) x.dispose();
    this.geos = [];
    return g;
  }
  mesh(material, { shadow = true, receive = true } = {}) {
    const m = new THREE.Mesh(this.merged(), material);
    m.castShadow = shadow; m.receiveShadow = receive;
    return m;
  }
}

// Building walls with UVs scaled to real metres so a window tile is always the same size.
export class FacadeBatch {
  constructor(tile = 28) { this.tile = tile; this.pos = []; this.nor = []; this.uv = []; this.col = []; }
  wallBox(x0, y0, z0, x1, y1, z1, color, uOff = 0) {
    const T = this.tile;
    const face = (pts, n, w) => {
      const us = [0, w / T, w / T, 0], vs = [y0 / T, y0 / T, y1 / T, y1 / T];
      for (const k of [0, 1, 2, 0, 2, 3]) {
        const p = pts[k];
        this.pos.push(p[0], p[1], p[2]);
        this.nor.push(n[0], n[1], n[2]);
        this.uv.push(us[k] + uOff, vs[k]);
        this.col.push(color[0], color[1], color[2]);
      }
    };
    face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], z1 - z0);
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], z1 - z0);
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], x1 - x0);
    face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], x1 - x0);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}

// Collects instances per world chunk so each chunk can be frustum-culled on its own, and
// hidden entirely once it is further away than `maxDist`.
const allChunked = [];
export class ChunkedInstances {
  constructor(geometry, material, { chunk = 300, shadow = false, colors = false, maxDist = 1200 } = {}) {
    this.geometry = geometry; this.material = material; this.chunk = chunk;
    this.shadow = shadow; this.colors = colors; this.maxDist = maxDist;
    this.buckets = new Map();
    this.meshes = [];
    this.forceHidden = false;
    allChunked.push(this);
  }
  add(matrix, color = null) {
    const e = matrix.elements;
    const k = `${Math.floor(e[12] / this.chunk)},${Math.floor(e[14] / this.chunk)}`;
    let b = this.buckets.get(k);
    if (!b) { b = { mats: [], cols: [] }; this.buckets.set(k, b); }
    b.mats.push(matrix.clone());
    if (this.colors) b.cols.push(color ? color.clone() : new THREE.Color(1, 1, 1));
    return { bucket: b, index: b.mats.length - 1 };
  }
  build(parent) {
    for (const [key, b] of this.buckets) {
      const mesh = new THREE.InstancedMesh(this.geometry, this.material, b.mats.length);
      for (let i = 0; i < b.mats.length; i++) {
        mesh.setMatrixAt(i, b.mats[i]);
        if (this.colors) mesh.setColorAt(i, b.cols[i]);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = this.shadow;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      const [cx, cz] = key.split(',').map(Number);
      mesh.userData.cx = (cx + 0.5) * this.chunk; mesh.userData.cz = (cz + 0.5) * this.chunk;
      b.mesh = mesh;
      b.mats = null;
      parent.add(mesh);
      this.meshes.push(mesh);
    }
    return this;
  }
}
// Call a few times a second: hides instance chunks beyond their draw distance.
export function cullChunks(x, z, scale = 1) {
  for (const ci of allChunked) {
    const lim = ci.maxDist * scale + ci.chunk * 0.71;
    const lim2 = lim * lim;
    for (const m of ci.meshes) {
      const dx = m.userData.cx - x, dz = m.userData.cz - z;
      m.visible = !ci.forceHidden && dx * dx + dz * dz < lim2;
    }
  }
}

export const tmpMatrix = (() => {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  return (x, y, z, ry = 0, scale = 1, sy = scale, rx = 0, rz = 0) => {
    e.set(rx, ry, rz, 'YXZ');
    q.setFromEuler(e);
    return m.compose(p.set(x, y, z), q, s.set(scale, sy, scale));
  };
})();
