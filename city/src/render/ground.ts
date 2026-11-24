// The ground: tile tops in chunk meshes (rebuilt only for chunks with dirty tiles), the shared
// water sheet with its land mask, and the floating slab's stratified sides.
import * as THREE from 'three';
import { hash01 } from '../core/rng';
import type { GameState } from '../core/types';
import { Terrain, TileKind } from '../core/types';
import {
  CELL_BED,
  CELL_DEV,
  CELL_GRASS,
  CELL_GRAVEL,
  CELL_LOT,
  CELL_PARK,
  CELL_PLAZA,
  CELL_ROAD,
  CELL_SAND,
  CELL_WHITE,
  type GroundAtlas,
} from './atlas';
import { createWaterMaterial, type WaterUniforms } from './materials';
import { buildingGround, isOpenWater, lotFacing, roadMask } from './tiles';
import { BED_Y, DX, DZ, MeshBuilder, SLAB_BOTTOM, WATER_Y, linearRGB } from './util';

/** Tiles per ground chunk side. 64-tile maps get 4 chunks: few draw calls, cheap rebuilds. */
export const CHUNK = 32;

const C = {
  lipGrass: linearRGB('#5fae3e'),
  lipSand: linearRGB('#dcc287'),
  dirt: linearRGB('#a06f43'),
  dirtDark: linearRGB('#875c38'),
  dirtLight: linearRGB('#b38252'),
  stone: linearRGB('#a3a3aa'),
  stoneDark: linearRGB('#8a8b94'),
  quay: linearRGB('#a9a69d'),
  sandWall: linearRGB('#cdb27a'),
  waterSide: linearRGB('#4fb3e0'),
  waterSideDeep: linearRGB('#2f7fc0'),
  bottom: linearRGB('#4e4a52'),
};

export class GroundLayer {
  readonly group = new THREE.Group();
  private chunks: Array<THREE.Mesh | null> = [];
  private chunksPerSide = 0;
  private dirtyChunks = new Set<number>();
  private slab: THREE.Mesh | null = null;
  private slabDirty = true;
  private water: THREE.Mesh | null = null;
  private maskTex: THREE.DataTexture | null = null;
  private maskDirty = true;
  private hasWater = false;
  private readonly groundMat: THREE.MeshLambertMaterial;
  private readonly slabMat: THREE.MeshLambertMaterial;
  private readonly waterMat: THREE.MeshPhongMaterial;
  private state: GameState | null = null;

  constructor(
    private readonly atlas: GroundAtlas,
    private readonly waterU: WaterUniforms,
  ) {
    this.groundMat = new THREE.MeshLambertMaterial({ map: atlas.texture, vertexColors: true });
    this.slabMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.waterMat = createWaterMaterial(waterU);
    this.group.name = 'ground';
  }

  /** New city: drop every mesh and rebuild from scratch. */
  setState(state: GameState): void {
    this.state = state;
    for (const m of this.chunks) if (m) this.disposeMesh(m);
    this.chunks = [];
    this.dirtyChunks.clear();
    this.chunksPerSide = Math.ceil(state.size / CHUNK);
    const n = this.chunksPerSide * this.chunksPerSide;
    for (let c = 0; c < n; c++) {
      this.chunks.push(null);
      this.dirtyChunks.add(c);
    }
    if (this.slab) this.disposeMesh(this.slab);
    this.slab = null;
    this.slabDirty = true;
    if (this.water) this.disposeMesh(this.water);
    this.water = null;
    this.maskTex?.dispose();
    this.maskTex = null;
    this.maskDirty = true;
  }

  /** A tile's look changed: its chunk (and a neighbour's, for shore walls and road shapes) is stale. */
  markTile(i: number): void {
    const s = this.state;
    if (!s) return;
    const x = i % s.size;
    const z = (i / s.size) | 0;
    this.markChunkAt(x, z);
    // neighbours across a chunk border depend on this tile (road pieces, shore walls, lot facing)
    if (x % CHUNK === 0) this.markChunkAt(x - 1, z);
    if (x % CHUNK === CHUNK - 1) this.markChunkAt(x + 1, z);
    if (z % CHUNK === 0) this.markChunkAt(x, z - 1);
    if (z % CHUNK === CHUNK - 1) this.markChunkAt(x, z + 1);
    if (x === 0 || z === 0 || x === s.size - 1 || z === s.size - 1) this.slabDirty = true;
    this.maskDirty = true;
  }

  /** Lot facing can change for tiles up to ROAD_REACH away; mark their chunks too. */
  markChunkAt(x: number, z: number): void {
    const s = this.state;
    if (!s || x < 0 || z < 0 || x >= s.size || z >= s.size) return;
    this.dirtyChunks.add(((z / CHUNK) | 0) * this.chunksPerSide + ((x / CHUNK) | 0));
  }

  /** Rebuild whatever is stale. Cheap when nothing changed. */
  update(): void {
    const s = this.state;
    if (!s) return;
    if (this.dirtyChunks.size) {
      for (const c of this.dirtyChunks) this.buildChunk(s, c);
      this.dirtyChunks.clear();
    }
    if (this.maskDirty) {
      this.buildMask(s);
      this.maskDirty = false;
    }
    if (this.slabDirty) {
      this.buildSlab(s);
      this.slabDirty = false;
    }
    if (!this.water) this.buildWater(s);
  }

  setShadows(on: boolean): void {
    for (const m of this.chunks) if (m) m.receiveShadow = on;
    if (this.slab) this.slab.receiveShadow = on;
    if (this.water) this.water.receiveShadow = on;
  }

  dispose(): void {
    for (const m of this.chunks) if (m) this.disposeMesh(m);
    if (this.slab) this.disposeMesh(this.slab);
    if (this.water) this.disposeMesh(this.water);
    this.maskTex?.dispose();
    this.groundMat.dispose();
    this.slabMat.dispose();
    this.waterMat.dispose();
  }

  private disposeMesh(m: THREE.Mesh): void {
    this.group.remove(m);
    m.geometry.dispose();
  }

  // ---------------------------------------------------------------- chunks

  private buildChunk(s: GameState, c: number): void {
    const cps = this.chunksPerSide;
    const cx0 = (c % cps) * CHUNK;
    const cz0 = ((c / cps) | 0) * CHUNK;
    const cx1 = Math.min(s.size, cx0 + CHUNK);
    const cz1 = Math.min(s.size, cz0 + CHUNK);
    const b = new MeshBuilder();
    const t = s.tiles;
    const uv = new Float32Array(8);
    const white = this.atlas.rect(CELL_WHITE);
    const wu = (white[0] + white[2]) / 2;
    const wv = (white[1] + white[3]) / 2;
    const wuv = [wu, wv, wu, wv, wu, wv, wu, wv];

    for (let z = cz0; z < cz1; z++) {
      for (let x = cx0; x < cx1; x++) {
        const i = z * s.size + x;
        const kind = t.kind[i];
        const terrain = t.terrain[i];
        const open = terrain === Terrain.Water && kind === TileKind.Empty;
        let cell = CELL_GRASS;
        let rot = 0;
        let r = 1, g = 1, bl = 1;
        if (kind === TileKind.Road) {
          cell = CELL_ROAD + roadMask(s, x, z);
          const j = 0.97 + hash01(x, z, 3) * 0.05;
          r = g = bl = j;
        } else if (kind === TileKind.Zone && t.zone[i] >= 1 && t.zone[i] <= 3) {
          cell = (t.level[i] > 0 ? CELL_DEV : CELL_LOT) + t.zone[i] - 1;
          rot = lotFacing(s, x, z);
        } else if (kind === TileKind.Building) {
          const bld = t.bld[i] >= 0 ? s.buildings[t.bld[i]] : null;
          const style = bld ? buildingGround(bld.type) : 'plaza';
          cell = style === 'park' ? CELL_PARK : style === 'gravel' ? CELL_GRAVEL : CELL_PLAZA;
        } else if (open) {
          cell = CELL_BED;
          rot = (hash01(x, z, 8) * 4) | 0;
        } else if (terrain === Terrain.Sand) {
          cell = CELL_SAND;
          rot = (hash01(x, z, 9) * 4) | 0;
          const j = 0.97 + hash01(x, z, 4) * 0.06;
          r = g = bl = j;
        } else {
          cell = CELL_GRASS + ((hash01(x, z, 1) * 4) | 0);
          rot = (hash01(x, z, 2) * 4) | 0;
          // per-tile jitter: brightness plus a slight warm/cool shift so the meadow reads as blocks
          const j = hash01(x, z, 5) - 0.5;
          const h = hash01(x, z, 6) - 0.5;
          r = 1 + j * 0.12 + h * 0.08;
          g = 1 + j * 0.1;
          bl = 1 + j * 0.08 - h * 0.1;
          // trees shade the grass under them a little
          if (t.trees[i] > 0) {
            r *= 0.9;
            g *= 0.93;
            bl *= 0.9;
          }
        }
        const y = open ? BED_Y : 0;
        this.cellUV(cell, rot, uv);
        b.quad(x, y, z, x + 1, y, z, x + 1, y, z + 1, x, y, z + 1, 0, 1, 0, r, g, bl, uv);

        if (!open) {
          // vertical banks wherever this raised tile meets open water
          for (let d = 0; d < 4; d++) {
            const nx = x + DX[d];
            const nz = z + DZ[d];
            if (nx < 0 || nz < 0 || nx >= s.size || nz >= s.size) continue;
            if (!isOpenWater(s, nz * s.size + nx)) continue;
            this.bank(b, x, z, d, terrain, kind, wuv);
          }
        }
      }
    }

    const geo = b.build(true, false);
    const old = this.chunks[c];
    if (old) this.disposeMesh(old);
    const mesh = new THREE.Mesh(geo, this.groundMat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.matrixAutoUpdate = false;
    mesh.name = `ground-chunk-${c}`;
    this.chunks[c] = mesh;
    this.group.add(mesh);
  }

  /** One bank face on side d of tile (x, z), from y = 0 down to the lake bed. */
  private bank(b: MeshBuilder, x: number, z: number, d: number, terrain: number, kind: number, wuv: number[]): void {
    // the edge segment on side d
    let ax: number, az: number, bx: number, bz: number;
    if (d === 0) (ax = x), (az = z), (bx = x + 1), (bz = z);
    else if (d === 1) (ax = x + 1), (az = z), (bx = x + 1), (bz = z + 1);
    else if (d === 2) (ax = x + 1), (az = z + 1), (bx = x), (bz = z + 1);
    else (ax = x), (az = z + 1), (bx = x), (bz = z);
    const nx = DX[d];
    const nz = DZ[d];
    const built = terrain === Terrain.Water && kind !== TileKind.Empty;
    const sand = terrain === Terrain.Sand;
    const lip = built ? C.quay : sand ? C.lipSand : C.lipGrass;
    const wall = built ? C.quay : sand ? C.sandWall : C.dirt;
    const lipY = built ? -0.04 : -0.07;
    b.quad(ax, 0, az, bx, 0, bz, bx, lipY, bz, ax, lipY, az, nx, 0, nz, lip[0], lip[1], lip[2], wuv);
    const j = 0.92 + hash01(x * 4 + d, z, 12) * 0.12;
    b.quad(ax, lipY, az, bx, lipY, bz, bx, BED_Y, bz, ax, BED_Y, az, nx, 0, nz, wall[0] * j, wall[1] * j, wall[2] * j, wuv);
  }

  /** UVs for the four tile corners (NW, NE, SE, SW) of an atlas cell turned by rot quarter turns. */
  private cellUV(cell: number, rot: number, out: Float32Array): void {
    const [u0, v0, u1, v1] = this.atlas.rect(cell);
    const du = u1 - u0;
    const dv = v1 - v0;
    // corner offsets from the tile centre: NW, NE, SE, SW
    const cx = [-0.5, 0.5, 0.5, -0.5];
    const cz = [-0.5, -0.5, 0.5, 0.5];
    for (let k = 0; k < 4; k++) {
      // the texel shown at world-local p comes from canonical q = R^-rot(p), R: (x, z) → (z, −x)
      let qx = cx[k];
      let qz = cz[k];
      for (let r = 0; r < rot; r++) {
        const tx = -qz;
        qz = qx;
        qx = tx;
      }
      out[k * 2] = u0 + (qx + 0.5) * du;
      out[k * 2 + 1] = v0 + (qz + 0.5) * dv;
    }
  }

  // ---------------------------------------------------------------- water

  private buildMask(s: GameState): void {
    const n = s.size;
    if (!this.maskTex || this.maskTex.image.width !== n) {
      this.maskTex?.dispose();
      const data = new Uint8Array(n * n * 4);
      const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false;
      tex.flipY = false;
      this.maskTex = tex;
      this.waterU.uMask.value = tex;
      this.waterU.uSize.value = n;
    }
    const data = this.maskTex.image.data as Uint8Array;
    let water = 0;
    for (let i = 0; i < n * n; i++) {
      const open = isOpenWater(s, i);
      if (open) water++;
      const v = open ? 0 : 255;
      data[i * 4] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    this.maskTex.needsUpdate = true;
    // a map without open water skips the water sheet entirely
    this.hasWater = water > 0;
    if (this.water) this.water.visible = this.hasWater;
  }

  private buildWater(s: GameState): void {
    const n = s.size;
    const geo = new THREE.PlaneGeometry(n, n, 1, 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(n / 2, WATER_Y, n / 2);
    const mesh = new THREE.Mesh(geo, this.waterMat);
    mesh.receiveShadow = true;
    mesh.renderOrder = 1;
    mesh.name = 'water';
    mesh.matrixAutoUpdate = false;
    mesh.visible = this.hasWater;
    this.water = mesh;
    this.group.add(mesh);
  }

  // ---------------------------------------------------------------- slab

  private buildSlab(s: GameState): void {
    const n = s.size;
    const b = new MeshBuilder();
    const ROW = 0.25;
    const LIP = -0.1;
    // each side: direction along the edge and the outward normal
    for (let side = 0; side < 4; side++) {
      for (let k = 0; k < n; k++) {
        // tile at the edge and the world segment [a, b] of its outer face
        let tx: number, tz: number, ax: number, az: number, bx: number, bz: number, nx: number, nz: number;
        if (side === 0) (tx = k), (tz = 0), (ax = k), (az = 0), (bx = k + 1), (bz = 0), (nx = 0), (nz = -1);
        else if (side === 1) (tx = n - 1), (tz = k), (ax = n), (az = k), (bx = n), (bz = k + 1), (nx = 1), (nz = 0);
        else if (side === 2) (tx = k), (tz = n - 1), (ax = k), (az = n), (bx = k + 1), (bz = n), (nx = 0), (nz = 1);
        else (tx = 0), (tz = k), (ax = 0), (az = k), (bx = 0), (bz = k + 1), (nx = -1), (nz = 0);
        const i = tz * n + tx;
        const open = isOpenWater(s, i);
        const terrain = s.tiles.terrain[i];
        const built = terrain === Terrain.Water && !open;
        let top = 0;
        if (open) {
          // the lake ends at the slab edge like a glass tank
          const ws = C.waterSide;
          const wd = C.waterSideDeep;
          const mid = (WATER_Y + BED_Y) / 2;
          b.quad(ax, WATER_Y, az, bx, WATER_Y, bz, bx, mid, bz, ax, mid, az, nx, 0, nz, ws[0], ws[1], ws[2]);
          b.quad(ax, mid, az, bx, mid, bz, bx, BED_Y, bz, ax, BED_Y, az, nx, 0, nz, wd[0], wd[1], wd[2]);
          top = BED_Y;
        } else {
          const lip = built ? C.quay : terrain === Terrain.Sand ? C.lipSand : C.lipGrass;
          b.quad(ax, 0, az, bx, 0, bz, bx, LIP, bz, ax, LIP, az, nx, 0, nz, lip[0], lip[1], lip[2]);
          top = LIP;
        }
        // strata: dirt rows, then stone; the boundary wanders by a row per column
        const stoneRow = 3 + (hash01(k, side, 21) < 0.33 ? -1 : hash01(k, side, 22) < 0.5 ? 0 : 1);
        for (let row = 0; ; row++) {
          const y0 = LIP - row * ROW;
          const y1 = Math.max(SLAB_BOTTOM, y0 - ROW);
          if (y0 <= SLAB_BOTTOM) break;
          const yt = Math.min(y0, top);
          if (yt <= y1) continue;
          // two blocks per tile along the edge, each with its own shade
          for (let half = 0; half < 2; half++) {
            const f0 = half * 0.5;
            const f1 = f0 + 0.5;
            const px0 = ax + (bx - ax) * f0, pz0 = az + (bz - az) * f0;
            const px1 = ax + (bx - ax) * f1, pz1 = az + (bz - az) * f1;
            const hj = hash01(k * 2 + half, row, 30 + side);
            let col: number[];
            if (row < stoneRow) col = hj < 0.2 ? C.dirtDark : hj > 0.85 ? C.dirtLight : C.dirt;
            else col = hj < 0.3 ? C.stoneDark : C.stone;
            // deeper rows are a touch darker, like a cliff in its own shadow
            const depth = 1 - Math.min(0.25, row * 0.025);
            const j = (0.94 + hj * 0.1) * depth;
            b.quad(px0, yt, pz0, px1, yt, pz1, px1, y1, pz1, px0, y1, pz0, nx, 0, nz, col[0] * j, col[1] * j, col[2] * j);
          }
        }
      }
    }
    const bc = C.bottom;
    b.quad(0, SLAB_BOTTOM, 0, n, SLAB_BOTTOM, 0, n, SLAB_BOTTOM, n, 0, SLAB_BOTTOM, n, 0, -1, 0, bc[0], bc[1], bc[2]);

    const geo = b.build(false, false);
    if (this.slab) this.disposeMesh(this.slab);
    const mesh = new THREE.Mesh(geo, this.slabMat);
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    mesh.name = 'slab';
    this.slab = mesh;
    this.group.add(mesh);
  }
}
