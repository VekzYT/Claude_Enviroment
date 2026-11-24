// Drawing helpers on voxel grids: roofs, round things, foliage, windows and the small props that
// make lots feel lived in (fences, AC units, water tanks, antennas, benches, lamps, crates).
// Grid convention: x east, y up, z toward the front (+z faces the road). All boxes are half-open.
import { hash01 } from '../../../core/rng';
import { col, courses, glow, mat, windowColor, LAMP, type Paint, type WindowStyle } from './palette';
import type { VoxelGrid } from './voxel';

// ---------------------------------------------------------------- shared colours

export const C = {
  white: '#f4f1ea',
  cream: '#f3e6c8',
  concrete: '#c9c6bd',
  concreteDark: '#9e9b93',
  asphalt: '#4a4d55',
  metal: '#b8bec6',
  metalDark: '#7d848e',
  steel: '#8f99a6',
  darkMetal: '#545b66',
  wood: '#a8754a',
  woodDark: '#7a5233',
  trunk: '#8a5f3c',
  leaf: '#5db84a',
  leafDark: '#3f9a3f',
  leafLight: '#86d35a',
  pine: '#2f8a55',
  pineDark: '#22704a',
  hedge: '#4aa647',
  grass: '#78c850',
  soil: '#8c6a48',
  water: '#4fb3e8',
  door: '#7a4e32',
  doorBlue: '#3e5e8c',
  frame: '#f7f4ee',
  brick: '#c46a4a',
  brickDark: '#a65740',
  glass: '#5d86ad',
  black: '#2c2f36',
  red: '#e0504a',
  yellow: '#f5c542',
  orange: '#f08a3c',
  blue: '#3d7be0',
  teal: '#2fb3a6',
  pink: '#f39ab8',
  purple: '#9a7ad8',
  green: '#4cbf6a',
} as const;

// ---------------------------------------------------------------- roofs

export interface RoofOpts {
  /** Voxels the roof sticks out past the walls on every side. */
  overhang?: number;
  /** Rows per step inward: 1 = 45°, 2 = steep. */
  rise?: number;
  /** Paint for the top-most row (ridge cap). */
  ridge?: Paint;
}

/**
 * A stepped gable roof over [x0,x1) × [z0,z1), starting at row y. `axis` is the ridge direction.
 * The triangular gable ends are filled with `wall`. Returns the row above the ridge.
 */
export function gableRoof(
  g: VoxelGrid,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  axis: 'x' | 'z',
  roof: Paint,
  wall: Paint,
  o: RoofOpts = {},
): number {
  const oh = o.overhang ?? 1;
  const rise = o.rise ?? 1;
  // a = across the slope, b = along the ridge
  const a0 = axis === 'x' ? z0 : x0;
  const a1 = axis === 'x' ? z1 : x1;
  const b0 = axis === 'x' ? x0 : z0;
  const b1 = axis === 'x' ? x1 : z1;
  const put = (aa0: number, aa1: number, yy: number, bb0: number, bb1: number, p: Paint) => {
    if (axis === 'x') g.box(bb0, yy, aa0, bb1, yy + 1, aa1, p);
    else g.box(aa0, yy, bb0, aa1, yy + 1, bb1, p);
  };
  let k = 0;
  for (; ; k++) {
    const s = Math.floor(k / rise);
    const lo = a0 - oh + s;
    const hi = a1 + oh - 1 - s;
    if (lo > hi) break;
    const yy = y + k;
    const top = lo + 1 > hi - 1 && o.ridge !== undefined;
    const rp = top ? (o.ridge as Paint) : roof;
    // inner gable wall between the two roof rows, inside the walls' footprint
    const ia = Math.max(a0, lo + 1);
    const ib = Math.min(a1, hi);
    if (ib > ia) put(ia, ib, yy, b0, b1, wall);
    put(lo, lo + 1, yy, b0 - oh, b1 + oh, rp);
    put(hi, hi + 1, yy, b0 - oh, b1 + oh, rp);
  }
  return y + k;
}

/** A stepped hip roof (slopes on all four sides). Returns the row above the top. */
export function hipRoof(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number, roof: Paint, o: RoofOpts = {}): number {
  const oh = o.overhang ?? 1;
  const rise = o.rise ?? 1;
  let k = 0;
  for (; ; k++) {
    const s = Math.floor(k / rise);
    const ax = x0 - oh + s;
    const bx = x1 + oh - s;
    const az = z0 - oh + s;
    const bz = z1 + oh - s;
    if (ax >= bx || az >= bz) break;
    const last = ax + 2 >= bx || az + 2 >= bz;
    g.box(ax, y + k, az, bx, y + k + 1, bz, last && o.ridge !== undefined ? o.ridge : roof);
  }
  return y + k;
}

/** A one-voxel rim around a flat roof at row y (and the roof slab itself if `slab`). */
export function parapet(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number, p: Paint, h = 1): void {
  g.box(x0, y, z0, x1, y + h, z0 + 1, p);
  g.box(x0, y, z1 - 1, x1, y + h, z1, p);
  g.box(x0, y, z0, x0 + 1, y + h, z1, p);
  g.box(x1 - 1, y, z0, x1, y + h, z1, p);
}

// ---------------------------------------------------------------- round shapes

/** Vertical cylinder centred at (cx, cz) in grid units (use integers for even widths, .5 for odd). */
export function cylinder(g: VoxelGrid, cx: number, cz: number, r: number, y0: number, y1: number, p: Paint): void {
  const r2 = r * r;
  for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const dx = x + 0.5 - cx;
      const dz = z + 0.5 - cz;
      if (dx * dx + dz * dz <= r2) g.box(x, y0, z, x + 1, y1, z + 1, p);
    }
  }
}

/** Horizontal cylinder along x or z (pipes, tanks lying down). Centre (c1, cy) across the axis. */
export function hcylinder(g: VoxelGrid, axis: 'x' | 'z', c: number, cy: number, r: number, a0: number, a1: number, p: Paint): void {
  const r2 = r * r;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let t = Math.floor(c - r - 1); t <= Math.ceil(c + r + 1); t++) {
      const dy = y + 0.5 - cy;
      const dt = t + 0.5 - c;
      if (dy * dy + dt * dt > r2) continue;
      if (axis === 'x') g.box(a0, y, t, a1, y + 1, t + 1, p);
      else g.box(t, y, a0, t + 1, y + 1, a1, p);
    }
  }
}

/** Solid ellipsoid centred at (cx, cy, cz). `onlyAbove` keeps the part with y ≥ cy (domes). */
export function ellipsoid(
  g: VoxelGrid,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  p: Paint,
  onlyAbove = false,
): void {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    if (onlyAbove && y + 0.5 < cy) continue;
    for (let z = Math.floor(cz - rz - 1); z <= Math.ceil(cz + rz + 1); z++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        const dz = (z + 0.5 - cz) / rz;
        if (dx * dx + dy * dy + dz * dz <= 1) g.put(x, y, z, p);
      }
    }
  }
}

// ---------------------------------------------------------------- windows and doors

export interface WinOpts {
  /** Row where the first floor starts. */
  y0: number;
  floors: number;
  floorH: number;
  /** Rows from the floor's base to the bottom of the window. */
  sill: number;
  h: number;
  w: number;
  /** Distance between the starts of neighbouring windows. */
  pitch: number;
  /** Minimum plain wall left at each corner. */
  margin?: number;
  style: WindowStyle;
  seed: number;
  /** Faces to dress: 1 = front (+z), 2 = east (+x), 4 = back (−z), 8 = west (−x). Default all. */
  faces?: number;
  /** Return true to leave a window out (door, sign, balcony slot). `a` is the window start along the face. */
  skip?: (face: number, a: number, floor: number) => boolean;
  litShare?: number;
  /** Recess the glass one voxel into the wall (deeper look, more triangles). */
  inset?: boolean;
}

/** Windows on the outer walls of the block [x0,x1) × [z0,z1). Only existing wall voxels are replaced. */
export function windows(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, o: WinOpts): void {
  const faces = o.faces ?? 15;
  const margin = o.margin ?? 1;
  for (let f = 0; f < 4; f++) {
    if (!(faces & (1 << f))) continue;
    const along0 = f === 0 || f === 2 ? x0 : z0;
    const along1 = f === 0 || f === 2 ? x1 : z1;
    const len = along1 - along0;
    const n = Math.floor((len - 2 * margin - o.w) / o.pitch) + 1;
    if (n <= 0) continue;
    const span = (n - 1) * o.pitch + o.w;
    const start = along0 + Math.floor((len - span) / 2);
    for (let fl = 0; fl < o.floors; fl++) {
      const yb = o.y0 + fl * o.floorH + o.sill;
      for (let c = 0; c < n; c++) {
        const a = start + c * o.pitch;
        if (o.skip && o.skip(f, a, fl)) continue;
        const paint = windowColor(o.style, hash01(o.seed * 977 + f * 131 + c, fl, a), o.litShare);
        pane(g, f, a, a + o.w, yb, yb + o.h, f === 0 ? z1 - 1 : f === 1 ? x1 - 1 : f === 2 ? z0 : x0, paint, !!o.inset);
      }
    }
  }
}

/**
 * One rectangle of glass (or a door) on face f of a wall whose outer voxel layer is at `layer`
 * (z for faces 0/2, x for faces 1/3), spanning [a0,a1) along the face and rows [y0,y1).
 */
export function pane(g: VoxelGrid, f: number, a0: number, a1: number, y0: number, y1: number, layer: number, p: Paint, inset = false): void {
  const inward = f === 0 || f === 1 ? -1 : 1;
  for (let y = y0; y < y1; y++) {
    for (let a = a0; a < a1; a++) {
      const x = f === 0 || f === 2 ? a : layer;
      const z = f === 0 || f === 2 ? layer : a;
      if (g.get(x, y, z) === 0) continue;
      if (inset) {
        g.set(x, y, z, 0);
        if (f === 0 || f === 2) g.put(x, y, z + inward, p);
        else g.put(x + inward, y, z, p);
      } else g.put(x, y, z, p);
    }
  }
}

/** Ribbon windows: continuous glass bands around a block, split into panes with their own light. */
export function ribbons(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y0: number, floors: number, floorH: number, h: number, style: WindowStyle, seed: number, paneW = 2, sill = 1): void {
  windows(g, x0, z0, x1, z1, { y0, floors, floorH, sill, h, w: paneW, pitch: paneW, margin: 0, style, seed });
}

// ---------------------------------------------------------------- props

/**
 * A rounded leafy crown centred on voxel column (x, z): square layers with the corners cut, a
 * darker underside and a sunlit top. Cheap after greedy meshing (a few dozen quads).
 */
export function crown(g: VoxelGrid, x: number, z: number, y0: number, r: number, h: number, hex: string, seed: number): void {
  // each tree gets a slightly different green so groves do not look stamped
  const j = 0.96 + hash01(seed, 71) * 0.08;
  const under = col(hex, 0.82 * j);
  const base = col(hex, j);
  const top = col(hex, 1.1);
  for (let k = 0; k < h; k++) {
    const edge = k === 0 || k === h - 1;
    const rr = edge ? r - 1 : r;
    if (rr < 0) continue;
    const p = k === 0 ? under : k === h - 1 ? top : base;
    // only the wide middle layers get their corners cut: rounder look, few extra faces
    const cut = !edge && rr > 1;
    for (let dz = -rr; dz <= rr; dz++) {
      for (let dx = -rr; dx <= rr; dx++) {
        if (cut && Math.abs(dx) === rr && Math.abs(dz) === rr) continue;
        g.set(x + dx, y0 + k, z + dz, p);
      }
    }
  }
  // a little tuft on top
  if (r >= 2) g.box(x, y0 + h, z, x + 1, y0 + h + 1, z + 1, top);
}

/** A garden tree: trunk and a rounded crown. (x, z) is the trunk voxel; y is the ground row. */
export function smallTree(g: VoxelGrid, x: number, z: number, y: number, seed: number, size = 2, leafHex: string = C.leaf): void {
  const trunkH = size + 1;
  g.box(x, y, z, x + 1, y + trunkH, z + 1, col(C.trunk));
  crown(g, x, z, y + trunkH, size, size + 2, leafHex, seed);
}

/**
 * A conifer: a trunk and stacked tiers, each tier a wide skirt (darker, it is in its own shade)
 * topped by a narrower layer, shrinking toward a pointed tip. `h` is the total height in voxels.
 */
export function smallPine(g: VoxelGrid, x: number, z: number, y: number, seed: number, h = 9, hex: string = C.pine): void {
  const j = 0.96 + hash01(seed, 73) * 0.08;
  const skirt = col(hex, 0.84 * j);
  const mid = col(hex, j);
  const top = col(hex, 1.1);
  g.box(x, y, z, x + 1, y + 2, z + 1, col(C.trunk));
  // tiers of (radius, layers); fewer and smaller tiers for short trees
  const tiers: Array<[number, number]> = h >= 10 ? [[3, 2], [2, 2], [2, 2], [1, 2]] : h >= 8 ? [[2, 2], [2, 2], [1, 2]] : [[2, 2], [1, 2]];
  let yy = y + 2;
  for (const [r, n] of tiers) {
    for (let k = 0; k < n; k++) {
      const rr = Math.max(0, r - k);
      const p = k === 0 ? skirt : mid;
      for (let dz = -rr; dz <= rr; dz++) {
        for (let dx = -rr; dx <= rr; dx++) {
          if (rr >= 3 && Math.abs(dx) === rr && Math.abs(dz) === rr) continue;
          g.set(x + dx, yy, z + dz, p);
        }
      }
      yy++;
    }
  }
  g.box(x, yy, z, x + 1, yy + 1, z + 1, top);
}

export function bush(g: VoxelGrid, x: number, z: number, y: number, w: number, d: number, h: number, seed: number, hex: string = C.hedge): void {
  g.box(x, y, z, x + w, y + h, z + d, mat(hex, { dark: 0.25, dk: 0.88, light: 0.2, lk: 1.08, cell: [1, 1, 1], seed }));
}

/** A row of flowers on top of soil/grass at row y. */
export function flowers(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number, seed: number): void {
  const petals = ['#ff6f8e', '#ffd84a', '#ffffff', '#c58cff', '#ff9d4a'].map((h) => col(h));
  const green = col(C.leafDark);
  for (let z = z0; z < z1; z++) {
    for (let x = x0; x < x1; x++) {
      const h = hash01(x + seed * 13, z, seed);
      g.set(x, y, z, green);
      if (h < 0.55) g.set(x, y + 1, z, petals[Math.floor(h * 9.1) % petals.length]);
    }
  }
}

/** White picket fence along a run at row y. Gaps are [a, b) ranges along the run left open. */
export function fence(g: VoxelGrid, axis: 'x' | 'z', a0: number, a1: number, at: number, y: number, hex: string = C.frame, gaps: Array<[number, number]> = []): void {
  const p = col(hex);
  for (let a = a0; a < a1; a++) {
    if (gaps.some(([s, e]) => a >= s && a < e)) continue;
    const post = (a - a0) % 2 === 0;
    const h = post ? 2 : 1;
    if (axis === 'x') g.box(a, y, at, a + 1, y + h, at + 1, p);
    else g.box(at, y, a, at + 1, y + h, a + 1, p);
  }
}

/** An air-conditioning box with a dark fan grille on top. */
export function acUnit(g: VoxelGrid, x: number, y: number, z: number, w = 2, d = 2): void {
  g.box(x, y, z, x + w, y + 1, z + d, col(C.metal));
  g.box(x, y + 1, z, x + w, y + 2, z + d, col(C.metal, 1.06));
  g.set(x, y + 1, z, col(C.darkMetal));
}

/** A classic rooftop water tank on legs with a pointed cap. Footprint 4×4 from (x, z). */
export function waterTank(g: VoxelGrid, x: number, z: number, y: number): void {
  const leg = col(C.darkMetal);
  g.box(x, y, z, x + 1, y + 2, z + 1, leg);
  g.box(x + 3, y, z, x + 4, y + 2, z + 1, leg);
  g.box(x, y, z + 3, x + 1, y + 2, z + 4, leg);
  g.box(x + 3, y, z + 3, x + 4, y + 2, z + 4, leg);
  const wood = mat(C.wood, { dark: 0.3, dk: 0.88, cell: [1, 8, 1], seed: x * 3 + z });
  cylinder(g, x + 2, z + 2, 2.2, y + 2, y + 6, wood);
  g.box(x + 1, y + 6, z + 1, x + 3, y + 7, z + 3, col(C.woodDark));
  g.box(x + 1, y + 4, z, x + 3, y + 5, z + 4, col(C.darkMetal));
  g.box(x, y + 4, z + 1, x + 4, y + 5, z + 3, col(C.darkMetal));
}

/** A thin antenna mast with a blinking-red tip (glow). Returns its top row. */
export function antenna(g: VoxelGrid, x: number, z: number, y: number, h: number, tipHex = '#ff5a4a'): number {
  g.box(x, y, z, x + 1, y + h, z + 1, col(C.metal));
  g.set(x, y + h, z, glow(tipHex));
  return y + h + 1;
}

/** Solar panels on a roof: dark-blue tilted rows (one voxel thick, every other row raised). */
export function solarPanels(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number): void {
  const a = col('#2d4f8a');
  const b = col('#3b64a8');
  const frame = col(C.metal);
  for (let z = z0; z < z1; z++) {
    const row = (z - z0) % 3;
    if (row === 2) continue;
    g.box(x0, y + (row === 0 ? 0 : 1), z, x1, y + (row === 0 ? 1 : 2), z + 1, row === 0 ? a : b);
    if (row === 0) g.box(x0, y, z, x0 + 1, y + 1, z + 1, frame);
  }
}

/** A park bench facing +z (or rotated by choosing axis). */
export function bench(g: VoxelGrid, x: number, z: number, y: number, axis: 'x' | 'z' = 'x'): void {
  const wood = col(C.wood);
  const legs = col(C.darkMetal);
  if (axis === 'x') {
    g.box(x, y, z, x + 1, y + 1, z + 1, legs);
    g.box(x + 2, y, z, x + 3, y + 1, z + 1, legs);
    g.box(x, y + 1, z, x + 3, y + 2, z + 1, wood);
    g.box(x, y + 2, z - 1, x + 3, y + 3, z, wood);
  } else {
    g.box(x, y, z, x + 1, y + 1, z + 1, legs);
    g.box(x, y, z + 2, x + 1, y + 1, z + 3, legs);
    g.box(x, y + 1, z, x + 1, y + 2, z + 3, wood);
    g.box(x - 1, y + 2, z, x, y + 3, z + 3, wood);
  }
}

/** A street lamp: dark post with a glowing head. */
export function lampPost(g: VoxelGrid, x: number, z: number, y: number, h = 5): void {
  g.box(x, y, z, x + 1, y + h, z + 1, col(C.darkMetal));
  g.set(x, y + h, z, glow(LAMP));
}

/** Stacked wooden crates. */
export function crates(g: VoxelGrid, x: number, z: number, y: number, seed: number): void {
  const a = col(C.wood);
  const b = col(C.wood, 0.86);
  g.box(x, y, z, x + 2, y + 1, z + 2, a);
  if (hash01(seed, x, z) < 0.6) g.box(x, y + 1, z, x + 1, y + 2, z + 1, b);
  if (hash01(seed, z, x) < 0.5) g.box(x + 2, y, z, x + 3, y + 1, z + 1, b);
}

/** A barrel/drum of the given colour. */
export function barrel(g: VoxelGrid, x: number, z: number, y: number, hex: string): void {
  g.box(x, y, z, x + 1, y + 2, z + 1, col(hex));
}

/** A roll-up door on face f of a wall layer: horizontal slats in two greys. */
export function rollDoor(g: VoxelGrid, f: number, a0: number, a1: number, y0: number, y1: number, layer: number, hex: string = C.metal): void {
  const s = [col(hex), col(hex, 0.88)];
  pane(g, f, a0, a1, y0, y1, layer, (_x, y) => s[(y - y0) % 2]);
}

/** A flagpole with a flag pointing +x. */
export function flag(g: VoxelGrid, x: number, z: number, y: number, h: number, hexA: string, hexB: string): void {
  g.box(x, y, z, x + 1, y + h, z + 1, col(C.white));
  g.box(x + 1, y + h - 3, z, x + 4, y + h - 2, z + 1, col(hexA));
  g.box(x + 1, y + h - 2, z, x + 4, y + h - 1, z + 1, col(hexB));
}

/**
 * Windows on any outline (round towers): every solid voxel in the given rows with an empty
 * horizontal neighbour becomes glass. The ring is split into `segments` panes around (cx, cz),
 * each lit on its own; a thin mullion is left between panes.
 */
export function skinWindows(
  g: VoxelGrid,
  cx: number,
  cz: number,
  r: number,
  y0: number,
  floors: number,
  floorH: number,
  sill: number,
  h: number,
  style: WindowStyle,
  seed: number,
  segments = 12,
  mullion = 0.18,
): void {
  const x0 = Math.floor(cx - r - 1);
  const x1 = Math.ceil(cx + r + 1);
  const z0 = Math.floor(cz - r - 1);
  const z1 = Math.ceil(cz + r + 1);
  for (let f = 0; f < floors; f++) {
    const yb = y0 + f * floorH + sill;
    for (let y = yb; y < yb + h; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (g.get(x, y, z) === 0) continue;
          if (g.get(x + 1, y, z) && g.get(x - 1, y, z) && g.get(x, y, z + 1) && g.get(x, y, z - 1)) continue;
          const t = ((Math.atan2(z + 0.5 - cz, x + 0.5 - cx) / (Math.PI * 2) + 1) % 1) * segments;
          if (t - Math.floor(t) < mullion) continue;
          g.set(x, y, z, windowColor(style, hash01(seed * 31 + Math.floor(t), f, 5)));
        }
      }
    }
  }
}

/** A sloping awning in front of a wall whose front face is at z = zFace, spanning [x0, x1). */
export function awning(g: VoxelGrid, x0: number, x1: number, y: number, zFace: number, depth: number, p: Paint): void {
  for (let k = 0; k < depth; k++) g.box(x0, y - k, zFace + k, x1, y - k + 1, zFace + k + 1, p);
}

// 3×3 pixel glyphs for sign lettering (read as "text" from a distance, spell nothing in particular)
const GLYPHS = [
  [0b111, 0b101, 0b111], // O
  [0b111, 0b110, 0b111], // E-ish
  [0b101, 0b111, 0b101], // H
  [0b110, 0b111, 0b110], // B-ish
  [0b111, 0b010, 0b010], // T
  [0b100, 0b100, 0b111], // L
  [0b011, 0b010, 0b110], // S
  [0b101, 0b101, 0b111], // U
  [0b111, 0b101, 0b101], // N/A
];

/**
 * A sign board on the front (+z) of a wall: a coloured board one voxel thick in front of zFace,
 * with 3×3 pixel letters in glow voxels (dark glass by day, shining at night). Boards shorter than
 * five rows get a single lit stripe instead of letters.
 */
export function sign(g: VoxelGrid, x0: number, x1: number, y0: number, y1: number, zFace: number, board: string, letters: string, seed: number): void {
  g.box(x0, y0, zFace, x1, y1, zFace + 1, col(board));
  const lit = glow(letters);
  if (y1 - y0 < 5) {
    for (let x = x0 + 1; x < x1 - 1; x++) if ((x - x0) % 4 !== 0 || x1 - x0 < 6) g.set(x, y0 + 1 + ((y1 - y0 - 2) >> 1), zFace, lit);
    if (y1 - y0 === 4) for (let x = x0 + 1; x < x1 - 1; x++) if (hash01(x, seed, 3) < 0.5) g.set(x, y0 + 2, zFace, lit);
    return;
  }
  const inner = x1 - x0 - 2;
  const count = Math.max(1, Math.floor((inner + 1) / 4));
  const start = x0 + 1 + Math.floor((inner - (count * 4 - 1)) / 2);
  const yb = y0 + 1 + Math.floor((y1 - y0 - 2 - 3) / 2);
  for (let k = 0; k < count; k++) {
    const gl = GLYPHS[Math.floor(hash01(seed, k, 11) * GLYPHS.length)];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (gl[r] & (4 >> c)) g.set(start + k * 4 + c, yb + 2 - r, zFace, lit);
      }
    }
  }
}

/** A rooftop garden on a flat roof whose surface is row y: planters with shrubs and a small tree. */
export function roofGarden(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number, seed: number): void {
  const soil = col(C.soil);
  const grass = mat(C.grass, { dark: 0.2, dk: 0.9, cell: [2, 1, 2], seed });
  g.box(x0, y, z0, x1, y + 1, z1, grass);
  // planter rim
  parapet(g, x0, z0, x1, z1, y, col(C.concrete, 1.03), 2);
  const w = x1 - x0;
  const d = z1 - z0;
  if (w >= 6 && d >= 6) smallTree(g, x0 + 2, z0 + 2, y + 1, seed, w >= 9 ? 2 : 1, C.leaf);
  bush(g, x1 - 3, z1 - 3, y + 1, 2, 2, 1, seed + 1);
  if (w >= 5) flowers(g, x1 - 4, z0 + 1, x1 - 1, z0 + 2, y + 1, seed);
  g.set(x0 + 1, y + 1, z1 - 2, soil);
}

/** A front door: a wood (or given) panel on face 0 at x [x0, x0+w), with a light above it. */
export function frontDoor(g: VoxelGrid, x0: number, w: number, y: number, h: number, layer: number, hex: string = C.door, lamp = true): void {
  pane(g, 0, x0, x0 + w, y, y + h, layer, col(hex));
  if (lamp) g.set(x0 + w, y + h, layer + 1, glow(LAMP));
}

/**
 * A round chimney. With `bands`, the top `bandRows` rows (all of it if omitted) get horizontal
 * stripes of `hex` and `bands`. Returns the smoke point (top centre) in grid units.
 */
export function chimney(
  g: VoxelGrid,
  cx: number,
  cz: number,
  r: number,
  y0: number,
  y1: number,
  hex: string,
  bands?: string,
  bandRows?: number,
): [number, number, number] {
  const plain = courses(hex, 2, 0.93);
  if (bands) {
    const a = col(hex);
    const b = col(bands);
    const from = bandRows !== undefined ? y1 - bandRows : y0;
    cylinder(g, cx, cz, r, y0, y1, (x, y, z) => (y < from ? (plain as (x: number, y: number, z: number) => number)(x, y, z) : Math.floor((y1 - y) / 3) % 2 === 0 ? a : b));
  } else cylinder(g, cx, cz, r, y0, y1, plain);
  cylinder(g, cx, cz, r + 0.5, y1 - 1, y1, col('#4a4d55'));
  // hollow top
  if (r >= 1) cylinder(g, cx, cz, Math.max(0.6, r - 0.8), y1 - 1, y1, 0);
  // tall stacks carry red aviation lights just under the lip
  if (y1 - y0 >= 40) {
    const red = glow('#ff4436');
    const yl = y1 - 3;
    const ix = Math.floor(cx);
    const iz = Math.floor(cz);
    // scan in from each side and light the first wall voxel met
    for (const dir of [-1, 1]) {
      for (let k = Math.ceil(r) + 1; k >= 0; k--) {
        const z = iz + dir * k;
        if (g.get(ix, yl, z) !== 0) {
          g.set(ix, yl, z, red);
          break;
        }
      }
    }
  }
  return [cx, y1, cz];
}

/** Small work lights (glow voxels) at the given grid positions. */
export function lights(g: VoxelGrid, points: Array<[number, number, number]>, hex = '#fff0b8'): void {
  const p = glow(hex);
  for (const [x, y, z] of points) g.set(x, y, z, p);
}

/** A stepped heap (coal, gravel, ore): layers shrinking by one voxel per row. */
export function heap(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, h: number, hex: string, seed: number): void {
  const p = mat(hex, { cell: [2, 1, 2], dark: 0.3, dk: 0.85, light: 0.2, lk: 1.1, seed });
  for (let k = 0; k < h; k++) {
    if (x0 + k >= x1 - k || z0 + k >= z1 - k) break;
    g.box(x0 + k, k, z0 + k, x1 - k, k + 1, z1 - k, p);
  }
}

/** A light box with a glowing plus-shaped cross on its front (+z) and back faces. */
export function crossSign(g: VoxelGrid, x0: number, y0: number, z0: number, w: number, h: number, d: number, crossHex = '#ff4a4a'): void {
  g.box(x0, y0, z0, x0 + w, y0 + h, z0 + d, col('#fbfbf8'));
  const cx = x0 + Math.floor(w / 2);
  const cy = y0 + Math.floor(h / 2);
  const arm = Math.max(1, Math.floor(Math.min(w, h) / 2) - 1);
  const lit = glow(crossHex);
  for (const z of [z0, z0 + d - 1]) {
    for (let k = -arm; k < arm; k++) {
      for (const t of [-1, 0]) {
        g.set(cx + k, cy + t, z, lit);
        g.set(cx + t, cy + k, z, lit);
      }
    }
  }
}
