// Small shared helpers for the world renderer: heights, directions, matrix writers and a
// geometry builder that keeps triangle winding consistent with the normal it is given.
import * as THREE from 'three';

/** World heights (1 unit = 1 tile). Land tops sit at y = 0. */
export const WATER_Y = -0.12;
export const BED_Y = -0.42;
export const SLAB_BOTTOM = -2.6;

/** Directions: 0 = north (−z), 1 = east (+x), 2 = south (+z), 3 = west (−x). Mask bit = 1 << dir. */
export const DX = [0, 1, 0, -1] as const;
export const DZ = [-1, 0, 1, 0] as const;
export const OPP = [2, 3, 0, 1] as const;

/** Lots look for a road in this order; index is the `rot` that faces it (rot 0 faces +z). */
export const FACE_DX = [0, 1, 0, -1] as const;
export const FACE_DZ = [1, 0, -1, 0] as const;

/**
 * Write a transform (translate · rotateY(angle) · scale) straight into a column-major matrix array.
 * Used in hot paths so no Matrix4/Quaternion objects are created per frame.
 */
export function writeYRot(
  a: Float32Array | number[],
  o: number,
  x: number,
  y: number,
  z: number,
  angle: number,
  sxz: number,
  sy: number,
): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  a[o] = c * sxz;
  a[o + 1] = 0;
  a[o + 2] = -s * sxz;
  a[o + 3] = 0;
  a[o + 4] = 0;
  a[o + 5] = sy;
  a[o + 6] = 0;
  a[o + 7] = 0;
  a[o + 8] = s * sxz;
  a[o + 9] = 0;
  a[o + 10] = c * sxz;
  a[o + 11] = 0;
  a[o + 12] = x;
  a[o + 13] = y;
  a[o + 14] = z;
  a[o + 15] = 1;
}

/** Same as writeYRot but with independent x and z scale (for stretched decals like headlight pools). */
export function writeYRotXZ(
  a: Float32Array,
  o: number,
  x: number,
  y: number,
  z: number,
  angle: number,
  sx: number,
  sy: number,
  sz: number,
): void {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  a[o] = c * sx;
  a[o + 1] = 0;
  a[o + 2] = -s * sx;
  a[o + 3] = 0;
  a[o + 4] = 0;
  a[o + 5] = sy;
  a[o + 6] = 0;
  a[o + 7] = 0;
  a[o + 8] = s * sz;
  a[o + 9] = 0;
  a[o + 10] = c * sz;
  a[o + 11] = 0;
  a[o + 12] = x;
  a[o + 13] = y;
  a[o + 14] = z;
  a[o + 15] = 1;
}

/** Linear-space RGB of an sRGB hex colour (vertex colours are read as linear by three). */
export function linearRGB(hex: number | string, out: number[] = [0, 0, 0]): number[] {
  const c = new THREE.Color(hex);
  out[0] = c.r;
  out[1] = c.g;
  out[2] = c.b;
  return out;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Accumulates quads and boxes into plain arrays, then produces an indexed BufferGeometry with
 * position, normal, uv, color and (optionally) aGlow. Allocation happens only when rebuilding.
 */
export class MeshBuilder {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  col: number[] = [];
  glow: number[] = [];
  idx: number[] = [];
  private n = 0;

  get vertexCount(): number {
    return this.n;
  }

  /**
   * One quad a-b-c-d (in order around the edge). The triangle winding is flipped automatically
   * so its front face matches the normal (nx, ny, nz).
   */
  quad(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    dx: number, dy: number, dz: number,
    nx: number, ny: number, nz: number,
    r: number, g: number, b: number,
    uvs?: ArrayLike<number>,
    glow = 0,
  ): void {
    const base = this.n;
    this.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz);
    for (let k = 0; k < 4; k++) {
      this.nor.push(nx, ny, nz);
      this.col.push(r, g, b);
      this.glow.push(glow);
    }
    if (uvs) for (let k = 0; k < 8; k++) this.uv.push(uvs[k]);
    else this.uv.push(0, 0, 0, 0, 0, 0, 0, 0);
    // cross((b - a), (c - a)) · n decides the winding
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const crx = uy * vz - uz * vy;
    const cry = uz * vx - ux * vz;
    const crz = ux * vy - uy * vx;
    if (crx * nx + cry * ny + crz * nz >= 0) {
      this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    } else {
      this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
    this.n += 4;
  }

  /** Axis-aligned box from (x0,y0,z0) to (x1,y1,z1). `bottom` adds the downward face. */
  box(
    x0: number, y0: number, z0: number,
    x1: number, y1: number, z1: number,
    r: number, g: number, b: number,
    glow = 0,
    bottom = false,
  ): void {
    // top
    this.quad(x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1, 0, 1, 0, r, g, b, undefined, glow);
    // sides get a touch of shading baked in so tiny props read even without strong light
    const s = 0.92;
    this.quad(x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1, 0, 0, 1, r * s, g * s, b * s, undefined, glow);
    this.quad(x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, 0, 0, -1, r * s, g * s, b * s, undefined, glow);
    this.quad(x1, y0, z0, x1, y0, z1, x1, y1, z1, x1, y1, z0, 1, 0, 0, r * s, g * s, b * s, undefined, glow);
    this.quad(x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y1, z0, -1, 0, 0, r * s, g * s, b * s, undefined, glow);
    if (bottom) this.quad(x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z1, 0, -1, 0, r * 0.7, g * 0.7, b * 0.7, undefined, glow);
  }

  build(withUv = true, withGlow = false): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    if (withUv) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (withGlow) g.setAttribute('aGlow', new THREE.Float32BufferAttribute(this.glow, 1));
    const n = this.n;
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/** Dispose a mesh's geometry (not its material, which is usually shared). */
export function disposeGeometryOf(obj: THREE.Object3D | null): void {
  if (!obj) return;
  const m = obj as THREE.Mesh;
  if (m.geometry) m.geometry.dispose();
}

/**
 * A flat band tracing a rounded rectangle: the footprint [x0,x1]×[z0,z1] grown by `grow`, corners
 * rounded with radius `grow` (which is what "within r tiles of the footprint" looks like), drawn
 * `width` wide on the outside. Optional translucent fill inside. Vertex colour carries alpha in .a.
 */
export function roundedRectRing(
  x0: number, z0: number, x1: number, z1: number,
  grow: number, width: number, y: number,
  out: { pos: number[]; col: number[]; idx: number[] },
  rgba: [number, number, number, number],
  fillAlpha = 0,
): void {
  const pts: number[] = [];
  const r = Math.max(0.001, grow);
  const seg = Math.max(3, Math.min(16, Math.ceil(r * 3)));
  // corner centres, going around: (x1,z1) → (x0,z1) → (x0,z0) → (x1,z0)
  const cs = [
    [x1, z1, 0],
    [x0, z1, Math.PI / 2],
    [x0, z0, Math.PI],
    [x1, z0, Math.PI * 1.5],
  ];
  for (const [cx, cz, a0] of cs) {
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (k / seg) * (Math.PI / 2);
      pts.push(cx + Math.cos(a) * r, cz + Math.sin(a) * r, Math.cos(a), Math.sin(a));
    }
  }
  const n = pts.length / 4;
  const base = out.pos.length / 3;
  const [cr, cg, cb, ca] = rgba;
  for (let k = 0; k < n; k++) {
    const px = pts[k * 4], pz = pts[k * 4 + 1], nx = pts[k * 4 + 2], nz = pts[k * 4 + 3];
    out.pos.push(px, y, pz, px + nx * width, y, pz + nz * width);
    out.col.push(cr, cg, cb, ca, cr, cg, cb, ca * 0.55);
  }
  for (let k = 0; k < n; k++) {
    const a = base + k * 2;
    const b = base + ((k + 1) % n) * 2;
    // the ring lies flat; winding chosen to face up
    out.idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  if (fillAlpha > 0) {
    const cBase = out.pos.length / 3;
    out.pos.push((x0 + x1) / 2, y, (z0 + z1) / 2);
    out.col.push(cr, cg, cb, fillAlpha);
    for (let k = 0; k < n; k++) {
      out.pos.push(pts[k * 4], y, pts[k * 4 + 1]);
      out.col.push(cr, cg, cb, fillAlpha);
    }
    for (let k = 0; k < n; k++) {
      out.idx.push(cBase, cBase + 1 + ((k + 1) % n), cBase + 1 + k);
    }
  }
}

export function ringGeometry(data: { pos: number[]; col: number[]; idx: number[] }): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(data.col, 4));
  g.setIndex(data.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(data.idx, 1) : new THREE.Uint16BufferAttribute(data.idx, 1));
  g.computeBoundingSphere();
  return g;
}
