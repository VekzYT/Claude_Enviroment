// Voxel grids and the mesher that turns them into compact flat-shaded geometry.
//
// A VoxelGrid holds palette indices (0 = empty). meshGrid() culls every face hidden by a
// neighbour and merges same-colour coplanar faces into rectangles (greedy meshing), writing
// triangles into a MeshAcc. Glow voxels go to a separate list so the world can light them at night.
// A MeshAcc can absorb other accumulators with a transform, so a lot can include a parked car
// built at a finer voxel scale, and finally becomes non-indexed BufferGeometries.
import * as THREE from 'three';
import { PAL_B, PAL_G, PAL_GLOW, PAL_R, type Paint } from './palette';

/** Voxels per world unit (tile) for buildings, lots and trees. */
export const VPT = 16;

export class VoxelGrid {
  readonly data: Uint16Array;

  constructor(
    readonly nx: number,
    readonly ny: number,
    readonly nz: number,
  ) {
    this.data = new Uint16Array(nx * ny * nz);
  }

  inside(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < this.nx && y < this.ny && z < this.nz;
  }

  get(x: number, y: number, z: number): number {
    if (x < 0 || y < 0 || z < 0 || x >= this.nx || y >= this.ny || z >= this.nz) return 0;
    return this.data[(y * this.nz + z) * this.nx + x];
  }

  set(x: number, y: number, z: number, c: number): void {
    if (x < 0 || y < 0 || z < 0 || x >= this.nx || y >= this.ny || z >= this.nz) return;
    this.data[(y * this.nz + z) * this.nx + x] = c;
  }

  /** Write a paint at one voxel. */
  put(x: number, y: number, z: number, p: Paint): void {
    this.set(x, y, z, typeof p === 'number' ? p : p(x, y, z));
  }

  /** Fill the half-open box [x0,x1) × [y0,y1) × [z0,z1), clipped to the grid. Paint 0 erases. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, p: Paint): void {
    const ax = Math.max(0, Math.floor(Math.min(x0, x1)));
    const bx = Math.min(this.nx, Math.floor(Math.max(x0, x1)));
    const ay = Math.max(0, Math.floor(Math.min(y0, y1)));
    const by = Math.min(this.ny, Math.floor(Math.max(y0, y1)));
    const az = Math.max(0, Math.floor(Math.min(z0, z1)));
    const bz = Math.min(this.nz, Math.floor(Math.max(z0, z1)));
    const fixed = typeof p === 'number' ? p : -1;
    for (let y = ay; y < by; y++) {
      for (let z = az; z < bz; z++) {
        let i = (y * this.nz + z) * this.nx + ax;
        for (let x = ax; x < bx; x++, i++) this.data[i] = fixed >= 0 ? fixed : (p as (x: number, y: number, z: number) => number)(x, y, z);
      }
    }
  }

  /** Like box, but only repaints voxels that are already solid (cutting windows, trim, stains). */
  paintSolid(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, p: Paint): void {
    for (let y = Math.max(0, y0); y < Math.min(this.ny, y1); y++) {
      for (let z = Math.max(0, z0); z < Math.min(this.nz, z1); z++) {
        for (let x = Math.max(0, x0); x < Math.min(this.nx, x1); x++) {
          const i = (y * this.nz + z) * this.nx + x;
          if (this.data[i] !== 0) this.data[i] = typeof p === 'number' ? p : p(x, y, z);
        }
      }
    }
  }

  /** Like box, but only fills empty voxels (planting around existing things). */
  fillEmpty(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, p: Paint): void {
    for (let y = Math.max(0, y0); y < Math.min(this.ny, y1); y++) {
      for (let z = Math.max(0, z0); z < Math.min(this.nz, z1); z++) {
        for (let x = Math.max(0, x0); x < Math.min(this.nx, x1); x++) {
          const i = (y * this.nz + z) * this.nx + x;
          if (this.data[i] === 0) this.data[i] = typeof p === 'number' ? p : p(x, y, z);
        }
      }
    }
  }

  /** Highest solid voxel row + 1 (0 for an empty grid). */
  topY(): number {
    const layer = this.nx * this.nz;
    for (let y = this.ny - 1; y >= 0; y--) {
      const o = y * layer;
      for (let i = 0; i < layer; i++) if (this.data[o + i] !== 0) return y + 1;
    }
    return 0;
  }
}

/** Plain arrays of non-indexed triangles. */
interface TriList {
  pos: number[];
  nor: number[];
  col: number[];
}

function newList(): TriList {
  return { pos: [], nor: [], col: [] };
}

/** Collects triangles for a model's body and glow parts. */
export class MeshAcc {
  readonly body = newList();
  readonly glow = newList();

  get triangles(): number {
    return (this.body.pos.length + this.glow.pos.length) / 9;
  }

  /**
   * Add `other` rotated by `quarter` quarter turns around y (counter-clockwise seen from above,
   * matching three's rotation.y), scaled by `s`, then moved by (tx, ty, tz).
   */
  append(other: MeshAcc, tx = 0, ty = 0, tz = 0, quarter = 0, s = 1): void {
    const a = (((quarter % 4) + 4) % 4) * (Math.PI / 2);
    const c = Math.round(Math.cos(a));
    const sn = Math.round(Math.sin(a));
    for (const [src, dst] of [
      [other.body, this.body],
      [other.glow, this.glow],
    ] as Array<[TriList, TriList]>) {
      for (let i = 0; i < src.pos.length; i += 3) {
        const x = src.pos[i] * s;
        const y = src.pos[i + 1] * s;
        const z = src.pos[i + 2] * s;
        dst.pos.push(c * x + sn * z + tx, y + ty, -sn * x + c * z + tz);
        const nx = src.nor[i];
        const nz = src.nor[i + 2];
        dst.nor.push(c * nx + sn * nz, src.nor[i + 1], -sn * nx + c * nz);
        dst.col.push(src.col[i], src.col[i + 1], src.col[i + 2]);
      }
    }
  }

  /** Bake into geometries. Body always exists (possibly empty); glow is null when there is none. */
  toGeometries(): { body: THREE.BufferGeometry; glow: THREE.BufferGeometry | null } {
    return { body: toGeometry(this.body), glow: this.glow.pos.length ? toGeometry(this.glow) : null };
  }
}

function toGeometry(t: TriList): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(t.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(t.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(t.col, 3));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/**
 * Greedy-mesh a grid into `acc`. Voxel (x, y, z) covers [x, x+1] in grid units; the world position
 * of grid point p is (p − origin) × scale.
 */
export function meshGrid(g: VoxelGrid, acc: MeshAcc, scale: number, ox: number, oy: number, oz: number): void {
  const dims = [g.nx, g.ny, g.nz];
  const strides = [1, g.nx * g.nz, g.nx];
  const org = [ox, oy, oz];
  const data = g.data;
  const p = [0, 0, 0];
  const quad = new Array<number>(12);
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3;
    const v = (d + 2) % 3;
    const du = dims[u];
    const dv = dims[v];
    const dd = dims[d];
    const sd = strides[d];
    const su = strides[u];
    const sv = strides[v];
    const mask = new Int32Array(du * dv);
    for (let sl = 0; sl <= dd; sl++) {
      // faces on the plane between slice sl−1 (a) and slice sl (b)
      let n = 0;
      let any = false;
      for (let j = 0; j < dv; j++) {
        for (let i = 0; i < du; i++, n++) {
          const base = i * su + j * sv;
          const a = sl > 0 ? data[base + (sl - 1) * sd] : 0;
          const b = sl < dd ? data[base + sl * sd] : 0;
          const m = a !== 0 && b === 0 ? a : b !== 0 && a === 0 ? -b : 0;
          mask[n] = m;
          if (m !== 0) any = true;
        }
      }
      if (!any) continue;
      n = 0;
      for (let j = 0; j < dv; j++) {
        for (let i = 0; i < du; ) {
          const c = mask[n];
          if (c === 0) {
            i++;
            n++;
            continue;
          }
          let w = 1;
          while (i + w < du && mask[n + w] === c) w++;
          let h = 1;
          grow: while (j + h < dv) {
            const row = n + h * du;
            for (let k = 0; k < w; k++) if (mask[row + k] !== c) break grow;
            h++;
          }
          for (let l = 0; l < h; l++) mask.fill(0, n + l * du, n + l * du + w);
          // corners p0..p3 counter-clockwise seen from +d (u × v = d for cyclic axes)
          const corners = [
            [i, j],
            [i + w, j],
            [i + w, j + h],
            [i, j + h],
          ];
          for (let k = 0; k < 4; k++) {
            p[d] = sl;
            p[u] = corners[k][0];
            p[v] = corners[k][1];
            quad[k * 3] = (p[0] - org[0]) * scale;
            quad[k * 3 + 1] = (p[1] - org[1]) * scale;
            quad[k * 3 + 2] = (p[2] - org[2]) * scale;
          }
          const ci = c > 0 ? c : -c;
          const list = PAL_GLOW[ci] ? acc.glow : acc.body;
          const order = c > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
          const nx = d === 0 ? Math.sign(c) : 0;
          const ny = d === 1 ? Math.sign(c) : 0;
          const nz = d === 2 ? Math.sign(c) : 0;
          for (const k of order) {
            list.pos.push(quad[k * 3], quad[k * 3 + 1], quad[k * 3 + 2]);
            list.nor.push(nx, ny, nz);
            list.col.push(PAL_R[ci], PAL_G[ci], PAL_B[ci]);
          }
          i += w;
          n += w;
        }
      }
    }
  }
}

/** Mesh a footprint-sized grid (w×h tiles at VPT voxels per tile) centred on the origin, base at y = 0. */
export function meshLot(g: VoxelGrid, acc: MeshAcc = new MeshAcc()): MeshAcc {
  meshGrid(g, acc, 1 / VPT, g.nx / 2, 0, g.nz / 2);
  return acc;
}
