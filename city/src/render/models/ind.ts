// Industry: level 1 workshops and warehouses, level 2 factories with sawtooth roofs and
// chimneys, level 3 heavy industry. The world paints a concrete yard with a hazard-striped
// loading strip at z 10..13 (voxels), so building fronts stay behind it.
import { hash01 } from '../../core/rng';
import { col, courses, glow, mat, planks } from './palette';
import {
  C,
  acUnit,
  antenna,
  barrel,
  crates,
  cylinder,
  ellipsoid,
  gableRoof,
  hcylinder,
  lampPost,
  pane,
  parapet,
  rollDoor,
  windows,
} from './shapes';
import type { Design } from './design';
import { carMesh } from './vehicles';
import { VoxelGrid } from './voxel';

function lot(h: number): VoxelGrid {
  return new VoxelGrid(16, h, 16);
}

/** A round chimney with a darker lip; returns the smoke point (top centre) in grid units. */
function chimney(g: VoxelGrid, cx: number, cz: number, r: number, y0: number, y1: number, hex: string, bands?: string): [number, number, number] {
  if (bands) {
    // horizontal red/white bands
    const a = col(hex);
    const b = col(bands);
    cylinder(g, cx, cz, r, y0, y1, (_x, y) => (Math.floor((y - y0) / 3) % 2 === 0 ? a : b));
  } else cylinder(g, cx, cz, r, y0, y1, courses(hex, 2, 0.93));
  cylinder(g, cx, cz, r + 0.5, y1 - 1, y1, col('#4a4d55'));
  // hollow top
  if (r >= 1) cylinder(g, cx, cz, Math.max(0.6, r - 0.8), y1 - 1, y1, 0);
  return [cx, y1, cz];
}

/** A square brick stack (for small chimneys). */
function stack(g: VoxelGrid, x: number, z: number, w: number, y0: number, y1: number): [number, number, number] {
  g.box(x, y0, z, x + w, y1, z + w, courses(C.brick, 2, 0.92));
  g.box(x, y1 - 1, z, x + w, y1, z + w, col('#4a4d55'));
  return [x + w / 2, y1, z + w / 2];
}

/** Sawtooth roof teeth along z over [x0,x1)×[z0,z1) from row y: steep glazed faces look +z. */
function sawtooth(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number, tooth: number, roof: string): void {
  const r = col(roof);
  const rd = col(roof, 0.9);
  for (let z = z0; z < z1; z += tooth) {
    for (let k = 0; k < tooth && z + k < z1; k++) {
      const h = k + 1;
      g.box(x0, y, z + k, x1, y + h, z + k + 1, k % 2 ? rd : r);
    }
    // the vertical glazed face at the tall end of each tooth
    const zf = Math.min(z1 - 1, z + tooth - 1);
    for (let x = x0 + 1; x < x1 - 1; x++) {
      for (let yy = y + 1; yy < y + tooth; yy++) {
        if (g.get(x, yy, zf) && !g.get(x, yy, zf + 1)) g.set(x, yy, zf, glow('#ffe6a0', hash01(x, yy, z) < 0.5 ? 1 : 0.8));
      }
    }
  }
}

// ---------------------------------------------------------------- level 1

function warehouse(): Design {
  const g = lot(12);
  const wall = planks('#c5ced8', 'x', 1, 0.93);
  const sideWall = planks('#c5ced8', 'z', 1, 0.93);
  g.box(2, 0, 2, 14, 7, 10, wall);
  g.box(2, 0, 2, 3, 7, 10, sideWall);
  g.box(13, 0, 2, 14, 7, 10, sideWall);
  // barrel roof
  const roof = col('#8d99a8');
  g.box(2, 7, 3, 14, 8, 9, roof);
  g.box(2, 8, 4, 14, 9, 8, col('#97a3b1'));
  g.box(2, 9, 5, 14, 10, 7, col('#a2adba'));
  g.box(2, 7, 2, 14, 8, 3, col('#a2adba'));
  g.box(2, 7, 9, 14, 8, 10, col('#a2adba'));
  rollDoor(g, 0, 3, 7, 0, 5, 9, '#f2c94c');
  rollDoor(g, 0, 9, 13, 0, 5, 9, '#f2c94c');
  windows(g, 2, 2, 14, 10, { y0: 0, floors: 1, floorH: 7, sill: 4, h: 2, w: 2, pitch: 3, style: 'factory', seed: 400, faces: 10 });
  g.set(8, 5, 10, glow('#fff0c0'));
  // pallets and crates in the yard
  crates(g, 2, 12, 0, 401);
  crates(g, 12, 12, 0, 402);
  g.box(6, 0, 13, 9, 1, 15, col(C.wood, 0.9));
  return { g };
}

function workshop(): Design {
  const g = lot(16);
  const brick = courses('#b86b4e', 1, 0.94);
  g.box(3, 0, 3, 13, 6, 10, brick);
  gableRoof(g, 3, 3, 13, 10, 6, 'x', mat('#59636e', { seed: 410, cell: [1, 1, 3] }), brick, { ridge: col('#4a535c') });
  rollDoor(g, 0, 4, 9, 0, 5, 9, '#d7dbe0');
  pane(g, 0, 10, 12, 0, 3, 9, col('#3e5e8c'));
  windows(g, 3, 3, 13, 10, { y0: 0, floors: 1, floorH: 6, sill: 2, h: 2, w: 2, pitch: 3, style: 'factory', seed: 411, faces: 14 });
  // lean-to store on the side
  g.box(13, 0, 4, 15, 4, 9, planks('#9fb08a', 'z', 1, 0.92));
  g.box(13, 4, 3, 16, 5, 10, col('#6e7a85'));
  const smoke = [stack(g, 5, 5, 1, 7, 12)];
  // sign over the door and a lamp
  g.box(4, 6, 10, 9, 7, 11, col('#f5c542'));
  g.set(9, 4, 10, glow('#fff0c0'));
  barrel(g, 2, 11, 0, '#3d7be0');
  barrel(g, 3, 12, 0, '#e0504a');
  crates(g, 11, 11, 0, 412);
  return { g, smoke };
}

function depot(): Design {
  const g = lot(12);
  const wall = planks('#e2d6b4', 'x', 2, 0.94);
  g.box(2, 0, 1, 14, 6, 7, wall);
  g.box(1, 6, 0, 15, 7, 8, col('#7c8792'));
  g.box(2, 7, 1, 14, 8, 7, col('#8b96a1'));
  // concrete loading dock with three bays
  g.box(2, 0, 7, 14, 2, 9, col(C.concrete));
  for (const x of [3, 7, 11]) rollDoor(g, 0, x, x + 3, 2, 6, 6, '#d65a4a');
  g.box(2, 2, 7, 14, 3, 8, col('#f2c94c'));
  windows(g, 2, 1, 14, 7, { y0: 0, floors: 1, floorH: 6, sill: 3, h: 2, w: 2, pitch: 4, style: 'factory', seed: 420, faces: 10 });
  lampPost(g, 1, 9, 0, 6);
  barrel(g, 14, 9, 0, '#2fb3a6');
  return {
    g,
    // a delivery truck backed up to the dock
    props: [{ mesh: carMesh(5), x: 8.5, z: 11.9, rot: 0 }],
  };
}

function lumberYard(): Design {
  const g = lot(14);
  // open shed with a pitched roof on posts
  const post = col(C.woodDark);
  for (const x of [2, 7]) for (const z of [2, 8]) g.box(x, 0, z, x + 1, 5, z + 1, post);
  gableRoof(g, 2, 2, 8, 9, 5, 'x', mat('#c25b3c', { seed: 430, cell: [1, 1, 3] }), col('#a84a30'), { ridge: col('#a84a30') });
  // stacked planks under the shed
  g.box(3, 0, 3, 7, 2, 8, planks('#e0b47a', 'z', 1, 0.9));
  // small office cabin
  g.box(9, 0, 2, 14, 5, 7, mat('#f2c94c', { seed: 431 }));
  g.box(9, 5, 2, 14, 6, 7, col('#5a6270'));
  windows(g, 9, 2, 14, 7, { y0: 0, floors: 1, floorH: 5, sill: 2, h: 2, w: 2, pitch: 3, style: 'factory', seed: 432 });
  pane(g, 0, 11, 13, 0, 3, 6, col('#5a3a28'));
  // log piles lying along x
  const bark = col('#8a5f3c');
  const cut = col('#e2bb86');
  for (const [z, y] of [
    [10, 1],
    [12, 1],
    [11, 3],
  ] as Array<[number, number]>) {
    hcylinder(g, 'x', z, y, 1, 2, 9, bark);
    g.box(2, y - 1, z - 1, 3, y + 1, z + 1, cut);
  }
  barrel(g, 12, 11, 0, '#4f9d69');
  crates(g, 11, 12, 0, 433);
  const smoke = [stack(g, 12, 3, 1, 6, 9)];
  return { g, smoke };
}

// ---------------------------------------------------------------- level 2

function sawtoothFactory(): Design {
  const g = lot(32);
  const brick = courses('#c06a4c', 1, 0.94);
  g.box(2, 0, 2, 14, 8, 10, brick);
  g.box(2, 0, 2, 14, 1, 10, col('#6e665e'));
  sawtooth(g, 2, 2, 14, 10, 8, 4, '#7d8a99');
  windows(g, 2, 2, 14, 10, { y0: 0, floors: 1, floorH: 8, sill: 3, h: 3, w: 2, pitch: 3, style: 'factory', seed: 440, faces: 10 });
  rollDoor(g, 0, 4, 8, 0, 6, 9, '#f2c94c');
  pane(g, 0, 10, 12, 1, 5, 9, glow('#ffd98e'));
  // tall brick chimney at the back right
  const smoke = [chimney(g, 12.5, 12.5, 1.6, 0, 28, '#b5604a')];
  g.box(11, 0, 11, 14, 2, 14, col('#7a726a'));
  barrel(g, 2, 11, 0, '#f2c94c');
  barrel(g, 3, 11, 0, '#f2c94c');
  crates(g, 5, 12, 0, 441);
  return { g, smoke };
}

function twinChimneyPlant(): Design {
  const g = lot(34);
  const wall = mat('#d6dbe0', { seed: 450, cell: [4, 3, 4] });
  g.box(2, 0, 3, 11, 12, 10, wall);
  g.box(2, 11, 3, 11, 12, 10, col('#3d7be0'));
  windows(g, 2, 3, 11, 10, { y0: 0, floors: 2, floorH: 6, sill: 2, h: 3, w: 2, pitch: 3, style: 'factory', seed: 451 });
  rollDoor(g, 0, 3, 7, 0, 5, 9, '#3d7be0');
  // two steel stacks with red and white bands
  const smoke = [chimney(g, 13, 5, 1.3, 0, 30, '#f4f1ea', '#e0504a'), chimney(g, 13, 10, 1.3, 0, 25, '#f4f1ea', '#e0504a')];
  // pipes from the hall to the stacks
  g.box(11, 8, 5, 13, 9, 6, col(C.steel));
  g.box(11, 6, 10, 13, 7, 11, col(C.steel));
  // a squat tank in front
  cylinder(g, 12.5, 13, 1.8, 0, 5, col('#e8e4d8'));
  cylinder(g, 12.5, 13, 1.2, 5, 6, col('#c9c3b2'));
  acUnit(g, 4, 12, 5);
  acUnit(g, 7, 12, 5);
  return { g, smoke };
}

function siloPlant(): Design {
  const g = lot(32);
  const wall = planks('#e6dcc4', 'x', 2, 0.94);
  g.box(6, 0, 3, 14, 9, 10, wall);
  gableRoof(g, 6, 3, 14, 10, 9, 'x', col('#6f7c8a'), wall, { overhang: 0 });
  rollDoor(g, 0, 8, 12, 0, 5, 9, '#d65a4a');
  windows(g, 6, 3, 14, 10, { y0: 0, floors: 1, floorH: 9, sill: 5, h: 2, w: 2, pitch: 3, style: 'factory', seed: 460, faces: 10 });
  // tall silo with a domed top
  cylinder(g, 3.5, 5.5, 2.6, 0, 22, courses('#d9dde2', 3, 0.93));
  ellipsoid(g, 3.5, 22, 5.5, 2.6, 2, 2.6, col('#b9c0c8'), true);
  // conveyor from the silo top down to the hall roof
  for (let k = 0; k < 8; k++) g.box(5 + k, 20 - k, 5, 6 + k, 21 - k, 6, col('#f2c94c'));
  for (let k = 0; k < 8; k += 2) g.box(5 + k, 14 - k, 5, 6 + k, 20 - k, 6, col(C.darkMetal));
  const smoke = [stack(g, 12, 4, 2, 12, 18)];
  barrel(g, 2, 12, 0, '#4f9d69');
  barrel(g, 3, 12, 0, '#4f9d69');
  crates(g, 11, 12, 0, 461);
  return { g, smoke };
}

function brickMill(): Design {
  const g = lot(30);
  const brick = courses('#a9583f', 1, 0.94);
  g.box(2, 0, 3, 14, 15, 10, brick);
  g.box(2, 5, 3, 14, 6, 10, col('#d9c7a8'));
  g.box(2, 10, 3, 14, 11, 10, col('#d9c7a8'));
  parapet(g, 2, 3, 14, 10, 15, col('#d9c7a8'));
  windows(g, 2, 3, 14, 10, { y0: 0, floors: 3, floorH: 5, sill: 1, h: 3, w: 1, pitch: 2, style: 'factory', seed: 470, inset: true, skip: (f, a, fl) => f === 0 && fl === 0 && a >= 6 && a <= 9 });
  rollDoor(g, 0, 6, 10, 0, 4, 9, '#5a6270');
  // rooftop water tank and a chimney
  const legs = col(C.darkMetal);
  for (const [x, z] of [
    [4, 4],
    [7, 4],
    [4, 7],
    [7, 7],
  ] as Array<[number, number]>)
    g.box(x, 15, z, x + 1, 18, z + 1, legs);
  cylinder(g, 6, 6, 2.4, 18, 22, col('#7d8a99'));
  g.box(5, 22, 5, 7, 23, 7, col('#5a6270'));
  const smoke = [chimney(g, 12, 6, 1.2, 15, 27, '#8f4a36')];
  crates(g, 2, 12, 0, 471);
  barrel(g, 13, 12, 0, '#e0504a');
  return { g, smoke };
}

// ---------------------------------------------------------------- level 3

function refinery(): Design {
  const g = lot(72);
  // storage tanks with coloured bands
  for (const [cx, cz, r, h, band] of [
    [4, 11.5, 2.8, 8, '#3d7be0'],
    [10.5, 12, 2.4, 7, '#f2c94c'],
  ] as Array<[number, number, number, number, string]>) {
    cylinder(g, cx, cz, r, 0, h, col('#eceae2'));
    cylinder(g, cx, cz, r, h - 2, h - 1, col(band));
    cylinder(g, cx, cz, r - 0.8, h, h + 1, col('#d4d0c4'));
  }
  // distillation column with ring platforms
  cylinder(g, 5, 4.5, 1.7, 0, 48, courses('#d6dbe0', 4, 0.92));
  for (let y = 10; y < 46; y += 9) cylinder(g, 5, 4.5, 2.6, y, y + 1, col('#f2c94c'));
  g.box(4, 48, 4, 6, 50, 5, col(C.steel));
  // a slim flare stack with a burning tip
  g.box(12, 0, 4, 13, 58, 5, col('#cfd3d8'));
  g.box(11, 56, 3, 14, 57, 6, col('#e0504a'));
  g.set(12, 58, 4, glow('#ffb347'));
  g.set(12, 59, 4, glow('#ffd56a'));
  // pipe racks joining it all
  g.box(5, 6, 4, 13, 7, 5, col(C.steel));
  g.box(4, 3, 7, 5, 4, 12, col(C.steel));
  g.box(7, 4, 5, 8, 5, 12, col('#e0504a'));
  // control room
  g.box(8, 0, 7, 14, 4, 9, col('#f4f1ea'));
  pane(g, 0, 9, 13, 1, 3, 8, glow('#e8f0ff'));
  const smoke: Array<[number, number, number]> = [
    [12.5, 60, 4.5],
    [5, 50, 4.5],
  ];
  return { g, smoke };
}

function siloComplex(): Design {
  const g = lot(72);
  const silo = courses('#e3e0d6', 4, 0.94);
  for (const [cx, cz] of [
    [4.5, 4.5],
    [9.5, 4.5],
    [4.5, 9.5],
    [9.5, 9.5],
  ] as Array<[number, number]>) {
    cylinder(g, cx, cz, 2.5, 0, 46, silo);
    cylinder(g, cx, cz, 2.5, 46, 47, col('#b9b5aa'));
  }
  // headhouse on top of the silos
  g.box(3, 47, 3, 11, 52, 11, col('#d65a4a'));
  windows(g, 3, 3, 11, 11, { y0: 47, floors: 1, floorH: 5, sill: 1, h: 2, w: 2, pitch: 3, style: 'factory', seed: 480 });
  gableRoof(g, 3, 3, 11, 11, 52, 'x', col('#8a3c32'), col('#d65a4a'), { overhang: 0 });
  // elevator tower on the right with a conveyor gallery
  g.box(12, 0, 6, 15, 60, 9, courses('#b9c0c8', 5, 0.93));
  windows(g, 12, 6, 15, 9, { y0: 2, floors: 11, floorH: 5, sill: 1, h: 2, w: 1, pitch: 2, style: 'factory', seed: 481, faces: 3 });
  g.box(11, 56, 6, 12, 58, 9, col(C.steel));
  g.box(12, 60, 6, 15, 62, 9, col('#8a3c32'));
  antenna(g, 13, 7, 62, 5);
  // loading shed and a truck at the front
  g.box(2, 0, 12, 10, 4, 15, col('#efe7d2'));
  g.box(2, 4, 12, 10, 5, 15, col('#8a3c32'));
  rollDoor(g, 0, 4, 8, 0, 3, 14, '#d7dbe0');
  return { g, smoke: [[13.5, 62, 7.5]] };
}

function steelMill(): Design {
  const g = lot(84);
  const hall = courses('#6f7a86', 3, 0.94);
  g.box(1, 0, 4, 15, 16, 12, hall);
  // dark roof with a raised clerestory
  g.box(0, 16, 3, 16, 17, 13, col('#4a525c'));
  g.box(3, 17, 6, 13, 19, 10, col('#565f6a'));
  for (let x = 4; x < 13; x += 2) g.set(x, 17, 10, glow('#ffb35c'));
  windows(g, 1, 4, 15, 12, { y0: 0, floors: 2, floorH: 8, sill: 4, h: 3, w: 2, pitch: 3, style: 'factory', seed: 490, faces: 10 });
  // glowing furnace mouth on the front
  g.box(5, 0, 12, 11, 8, 13, col('#3a3f47'));
  pane(g, 0, 6, 10, 1, 6, 12, glow('#ff8a2a'));
  g.box(4, 8, 12, 12, 9, 14, col('#f2c94c'));
  // two tall banded chimneys at the back
  const smoke = [chimney(g, 4, 1.5, 1.4, 0, 82, '#e0504a', '#f4f1ea'), chimney(g, 12, 1.5, 1.4, 0, 72, '#e0504a', '#f4f1ea')];
  // ore heap and a skip
  g.box(1, 0, 13, 4, 2, 16, mat('#5c4a3e', { cell: [1, 1, 1], dark: 0.4, seed: 491 }));
  g.box(2, 2, 14, 3, 3, 15, col('#5c4a3e'));
  g.box(12, 0, 13, 15, 2, 15, col('#f2c94c'));
  return { g, smoke };
}

function coolingWorks(): Design {
  const g = lot(68);
  // hyperboloid cooling tower: narrowest two thirds of the way up
  const shell = courses('#e6e2d8', 3, 0.95);
  const h = 40;
  const cx = 6.5;
  const cz = 7.5;
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const r = 4.9 - 1.6 * Math.sin(Math.min(1, t / 0.75) * Math.PI * 0.5) + (t > 0.75 ? (t - 0.75) * 2.4 : 0);
    cylinder(g, cx, cz, r, y, y + 1, shell);
    cylinder(g, cx, cz, r - 1.2, y, y + 1, 0);
  }
  cylinder(g, cx, cz, 4.4, 0, 1, col('#bdb8ac'));
  // red warning band near the rim
  for (let y = h - 4; y < h - 2; y++) {
    for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) if (g.get(x, y, z)) g.set(x, y, z, col('#e0504a'));
  }
  // slim chimney beside it
  const smoke: Array<[number, number, number]> = [[cx, h, cz], chimney(g, 13.5, 3, 1.1, 0, 64, '#f4f1ea', '#e0504a')];
  // turbine hall
  g.box(11, 0, 7, 16, 9, 14, mat('#5f8fbf', { seed: 500, cell: [3, 3, 3] }));
  g.box(11, 9, 7, 16, 10, 14, col('#4a525c'));
  windows(g, 11, 7, 16, 14, { y0: 0, floors: 1, floorH: 9, sill: 4, h: 3, w: 1, pitch: 2, style: 'factory', seed: 501, faces: 3 });
  g.box(10, 4, 9, 11, 5, 10, col(C.steel));
  return { g, smoke };
}

export function indDesign(level: number, v: number): Design {
  if (level === 1) return [warehouse, workshop, depot, lumberYard][v]();
  if (level === 2) return [sawtoothFactory, twinChimneyPlant, siloPlant, brickMill][v]();
  return [refinery, siloComplex, steelMill, coolingWorks][v]();
}
