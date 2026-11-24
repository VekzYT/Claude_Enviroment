// Service and utility buildings, one design per BuildingType, sized to its footprint
// (16 voxels per tile). The front (entrance, sign) faces +z.
import type { BuildingType } from '../../core/types';
import { BUILDINGS } from '../../core/defs';
import { col, courses, glow, mat, LAMP, type Paint } from './palette';
import {
  C,
  acUnit,
  antenna,
  bench,
  bush,
  chimney,
  crossSign,
  cylinder,
  ellipsoid,
  flag,
  flowers,
  frontDoor,
  gableRoof,
  hcylinder,
  heap,
  hipRoof,
  lampPost,
  pane,
  parapet,
  ribbons,
  rollDoor,
  sign,
  skinWindows,
  smallPine,
  smallTree,
  windows,
} from './shapes';
import type { Design, PropPlacement } from './design';
import { ambulanceMesh, busMesh, fireTruckMesh, policeCarMesh } from './vehicles';
import { MeshAcc, VoxelGrid, meshGrid } from './voxel';

function grid(tiles: number, h: number): VoxelGrid {
  return new VoxelGrid(tiles * 16, h, tiles * 16);
}

// ---------------------------------------------------------------- utilities

function coalPlant(): Design {
  const g = grid(3, 80);
  // coal heaps at the back left with a conveyor up into the boiler house
  heap(g, 2, 2, 16, 14, 5, '#55565e', 600);
  heap(g, 3, 16, 12, 25, 3, '#5d5e66', 601);
  const belt = col('#f2c94c');
  for (let k = 0; k < 10; k++) g.box(8 + k, 6 + k * 2, 9, 9 + k, 8 + k * 2, 11, belt);
  for (const k of [2, 5, 8]) g.box(8 + k, 0, 9, 9 + k, 6 + k * 2, 10, col(C.darkMetal));
  // boiler house
  const conc = mat('#9298a0', { seed: 602, cell: [6, 4, 6], dark: 0.25 });
  g.box(18, 0, 6, 36, 28, 30, conc);
  g.box(18, 27, 6, 36, 28, 30, col('#5a6068'));
  windows(g, 18, 6, 36, 30, { y0: 4, floors: 4, floorH: 6, sill: 1, h: 3, w: 2, pitch: 4, style: 'factory', seed: 603, faces: 10 });
  g.box(22, 28, 10, 32, 31, 26, col('#6e747c'));
  // turbine hall in front, with a blue band and a big door
  const hall = mat('#e1e5ea', { seed: 604, cell: [6, 4, 6], dark: 0.2 });
  g.box(8, 0, 30, 40, 14, 42, hall);
  g.box(8, 11, 30, 40, 12, 42, col('#3d7be0'));
  g.box(8, 14, 30, 40, 15, 42, col('#5a6068'));
  windows(g, 8, 30, 40, 42, { y0: 0, floors: 1, floorH: 11, sill: 5, h: 4, w: 3, pitch: 4, style: 'factory', seed: 605, skip: (f, a) => f === 0 && a >= 20 && a <= 27 });
  rollDoor(g, 0, 20, 28, 0, 8, 41, '#c9ced6');
  g.set(19, 9, 42, glow(LAMP));
  g.set(28, 9, 42, glow(LAMP));
  // two tall chimneys with banded tops
  const smoke = [chimney(g, 41, 9, 3, 0, 76, '#d6d3cb', '#e0504a', 18), chimney(g, 41, 22, 2.4, 0, 62, '#d6d3cb', '#e0504a', 12)];
  g.box(36, 12, 8, 38, 14, 10, col(C.steel));
  g.box(36, 16, 21, 39, 18, 23, col(C.steel));
  // transformer yard at the front right
  const tr = col('#8c939c');
  for (const z of [32, 38]) {
    g.box(42, 0, z, 46, 4, z + 4, tr);
    g.box(43, 4, z + 1, 44, 6, z + 2, col('#c9a36a'));
    g.box(44, 4, z + 2, 45, 6, z + 3, col('#c9a36a'));
  }
  for (const z of [31, 46]) g.box(41, 0, z, 47, 1, z + 1, col(C.darkMetal));
  lampPost(g, 6, 44, 0, 6);
  return { g, smoke };
}

/** One tapered rotor blade pointing up (+y) from the hub, built at 32 voxels per tile. */
function bladeMesh(): MeshAcc {
  const b = new VoxelGrid(3, 26, 1);
  const white = col('#f7f7f4');
  b.box(0, 0, 0, 3, 9, 1, white);
  b.box(0, 9, 0, 2, 19, 1, white);
  b.box(0, 19, 0, 2, 22, 1, col('#e0504a'));
  b.box(0, 22, 0, 1, 26, 1, col('#e0504a'));
  const acc = new MeshAcc();
  meshGrid(b, acc, 1 / 32, 1.5, -2, 0.5);
  return acc;
}

function windTurbine(): Design {
  const g = grid(1, 48);
  g.box(3, 0, 3, 13, 1, 13, col(C.concrete));
  const white = courses('#f4f4f0', 6, 0.96);
  g.box(6, 1, 6, 10, 14, 10, white);
  g.box(7, 14, 7, 9, 43, 9, white);
  pane(g, 0, 7, 9, 1, 4, 9, col('#6d7a88'));
  // nacelle pointing into the wind (+z)
  g.box(6, 42, 4, 10, 46, 12, col('#eeeeea'));
  g.box(6, 42, 4, 10, 43, 12, col('#d4d4ce'));
  g.set(8, 46, 5, glow('#ff4a3a'));
  // little transformer box
  g.box(11, 1, 10, 14, 4, 13, col('#9aa3ad'));
  g.box(11, 3, 13, 14, 4, 14, 0);
  g.set(12, 2, 13, col('#f2c94c'));
  // rotor: hub plus three blades, spinning around z
  const rotor = new MeshAcc();
  const hub = new VoxelGrid(4, 4, 3);
  hub.box(0, 0, 0, 4, 4, 3, col('#e6e6e0'));
  hub.box(1, 1, 2, 3, 3, 3, col('#cfcfc8'));
  meshGrid(hub, rotor, 1 / 32, 2, 2, 1.5);
  const blade = bladeMesh();
  for (let k = 0; k < 3; k++) rotor.appendRotZ(blade, (k * Math.PI * 2) / 3, 0, 0, 0.01);
  return { g, spinner: { mesh: rotor, at: [8, 44, 13], axis: 'z', speed: 1.6, reach: 28 / 32 } };
}

function solarFarm(): Design {
  const g = grid(2, 10);
  const cellA = col('#2c4f8e');
  const cellB = col('#355ea6');
  const frame = col('#c9d0d8');
  const leg = col(C.darkMetal);
  for (const z0 of [3, 10, 17, 24]) {
    for (const x of [8, 15, 22, 28]) g.box(x, 0, z0 + 1, x + 1, 3, z0 + 2, leg);
    // three rows stepping up toward the back so the panels face the sun (south, +z)
    for (let k = 0; k < 3; k++) {
      const z = z0 + k;
      const y = 4 - k;
      const p: Paint = (x) => ((x - 6) % 4 === 0 ? frame : k % 2 ? cellB : cellA);
      g.box(6, y, z, 30, y + 1, z + 1, p);
    }
  }
  // inverter hut with a lamp, and a fence post line along the front
  g.box(1, 0, 11, 5, 5, 18, col('#eceae2'));
  g.box(0, 5, 10, 6, 6, 19, col('#5a6270'));
  pane(g, 1, 13, 16, 0, 4, 4, col('#5a6270'));
  g.set(5, 4, 17, glow(LAMP));
  for (let x = 1; x < 31; x += 3) g.box(x, 0, 30, x + 1, 2, 31, col(C.metalDark));
  g.box(1, 1, 30, 31, 2, 31, col(C.metal));
  return { g };
}

function waterTower(): Design {
  const g = grid(1, 40);
  const steel = col('#7d8a99');
  for (const [x, z] of [
    [3, 3],
    [12, 3],
    [3, 12],
    [12, 12],
  ] as Array<[number, number]>)
    g.box(x, 0, z, x + 1, 21, z + 1, steel);
  // cross braces
  for (const y of [7, 14]) {
    g.box(3, y, 3, 13, y + 1, 4, steel);
    g.box(3, y, 12, 13, y + 1, 13, steel);
    g.box(3, y, 3, 4, y + 1, 13, steel);
    g.box(12, y, 3, 13, y + 1, 13, steel);
  }
  // central riser pipe and a pump hut at the foot
  g.box(7, 4, 7, 9, 19, 9, col('#9aa6b2'));
  g.box(5, 0, 5, 11, 4, 11, col('#e9e4d8'));
  g.box(5, 4, 5, 11, 5, 11, col('#3d7be0'));
  pane(g, 0, 7, 9, 0, 3, 10, col('#3d5a80'));
  g.set(9, 3, 11, glow(LAMP));
  // the tank
  cylinder(g, 8, 8, 3, 18, 19, col('#5aa9e6'));
  cylinder(g, 8, 8, 5.2, 19, 20, col('#5aa9e6'));
  cylinder(g, 8, 8, 6.8, 20, 21, col('#c9d0d8'));
  cylinder(g, 8, 8, 6, 21, 31, courses('#68b8ea', 3, 0.95, 1));
  cylinder(g, 8, 8, 6.05, 25, 27, col('#f4f4f0'));
  cylinder(g, 8, 8, 6.5, 31, 32, col('#3d6fae'));
  cylinder(g, 8, 8, 5, 32, 33, col('#3d6fae'));
  cylinder(g, 8, 8, 3.5, 33, 34, col('#4a7cbc'));
  cylinder(g, 8, 8, 2, 34, 35, col('#4a7cbc'));
  g.box(7, 35, 7, 9, 36, 9, col(C.metal));
  g.set(8, 36, 8, glow('#ff4a3a'));
  // ladder up one leg
  for (let y = 1; y < 21; y += 2) g.set(12, y, 13, col(C.darkMetal));
  return { g };
}

function waterPump(): Design {
  const g = grid(2, 22);
  const brick = courses('#c47a5a', 1, 0.94);
  g.box(6, 0, 10, 24, 10, 23, brick);
  g.box(6, 0, 10, 24, 1, 23, col('#8f8577'));
  gableRoof(g, 6, 10, 24, 23, 10, 'x', mat('#4f6b8f', { seed: 610, cell: [3, 1, 1] }), brick, { ridge: col('#3f5878') });
  windows(g, 6, 10, 24, 23, { y0: 0, floors: 1, floorH: 10, sill: 3, h: 4, w: 2, pitch: 4, style: 'factory', seed: 611, skip: (f, a) => f === 0 && a >= 13 && a <= 16 });
  frontDoor(g, 14, 2, 1, 5, 22, '#3d5a80');
  // big blue intake pipes along the back, dropping into the water side
  const pipe = col('#3d7be0');
  hcylinder(g, 'x', 6, 3, 2, 2, 30, pipe);
  hcylinder(g, 'x', 6, 3, 2.4, 9, 11, col('#2f62b8'));
  hcylinder(g, 'x', 6, 3, 2.4, 20, 22, col('#2f62b8'));
  g.box(2, 0, 5, 5, 5, 8, pipe);
  g.box(27, 0, 5, 30, 5, 8, pipe);
  g.box(15, 5, 4, 16, 8, 5, col('#e0504a'));
  g.box(14, 7, 4, 17, 8, 5, col('#e0504a'));
  g.box(15, 5, 5, 16, 10, 10, pipe);
  // settling basin at the front right
  cylinder(g, 27, 26, 4.2, 0, 3, col(C.concrete));
  cylinder(g, 27, 26, 3.2, 1, 3, 0);
  cylinder(g, 27, 26, 3.2, 1, 2, col('#4fb3e8'));
  lampPost(g, 3, 25, 0, 6);
  return { g };
}

// ---------------------------------------------------------------- parks

function smallPark(): Design {
  const g = grid(1, 14);
  smallTree(g, 4, 4, 0, 620, 2, '#5db84a');
  smallPine(g, 12, 3, 0, 621, 8);
  // round pond with a stone rim
  cylinder(g, 5, 11.5, 3.2, 0, 2, col('#cfc8b8'));
  cylinder(g, 5, 11.5, 2.3, 1, 2, 0);
  cylinder(g, 5, 11.5, 2.3, 0, 1, col('#4fb3e8'));
  bench(g, 10, 14, 0, 'x');
  flowers(g, 9, 8, 14, 10, 0, 622);
  lampPost(g, 13, 13, 0, 5);
  bush(g, 8, 4, 0, 2, 2, 1, 623);
  return { g };
}

function plaza(): Design {
  const g = grid(2, 22);
  // fountain: basin, two bowls and a jet, with lights under the water
  cylinder(g, 16, 16, 7.4, 0, 2, col('#d8d0c0'));
  cylinder(g, 16, 16, 6.4, 1, 2, 0);
  cylinder(g, 16, 16, 6.4, 0, 1, col('#56b8ea'));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    g.set(Math.floor(16 + Math.cos(a) * 5.6), 0, Math.floor(16 + Math.sin(a) * 5.6), glow('#9ff3ff'));
  }
  cylinder(g, 16, 16, 1.5, 0, 6, col('#e4ddd0'));
  cylinder(g, 16, 16, 3.4, 5, 6, col('#e4ddd0'));
  cylinder(g, 16, 16, 2.4, 6, 7, col('#7fd0f2'));
  cylinder(g, 16, 16, 0.9, 6, 10, col('#bfefff'));
  g.box(15, 10, 15, 17, 11, 17, col('#e8fbff'));
  // corner trees in planters
  for (const [x, z] of [
    [4, 4],
    [27, 4],
    [4, 27],
    [27, 27],
  ] as Array<[number, number]>) {
    g.box(x - 2, 0, z - 2, x + 3, 2, z + 3, col('#c9bfae'));
    g.box(x - 1, 1, z - 1, x + 2, 2, z + 2, col(C.soil));
    smallTree(g, x, z, 2, 630 + x + z, 2, x < 16 ? '#5db84a' : '#73c44f');
  }
  // benches facing the fountain and lamps between them
  bench(g, 15, 26, 0, 'x');
  bench(g, 15, 6, 0, 'x');
  bench(g, 6, 15, 0, 'z');
  bench(g, 26, 15, 0, 'z');
  for (const [x, z] of [
    [10, 10],
    [21, 10],
    [10, 21],
    [21, 21],
  ] as Array<[number, number]>)
    lampPost(g, x, z, 0, 6);
  flowers(g, 12, 1, 20, 3, 0, 640);
  flowers(g, 12, 29, 20, 31, 0, 641);
  return { g };
}

// ---------------------------------------------------------------- services

function policeStation(): Design {
  const g = grid(2, 30);
  const white = mat('#f2f4f6', { seed: 650, cell: [6, 3, 6], dark: 0.2 });
  const blue = col('#2f5fb3');
  g.box(3, 0, 5, 29, 13, 20, white);
  g.box(3, 0, 5, 29, 1, 20, col('#8d96a3'));
  g.box(3, 6, 5, 29, 7, 20, blue);
  parapet(g, 3, 5, 29, 20, 13, blue);
  windows(g, 3, 5, 29, 20, { y0: 0, floors: 2, floorH: 6, sill: 2, h: 3, w: 3, pitch: 4, style: 'office', seed: 651, skip: (f, a, fl) => f === 0 && fl === 0 && a >= 12 && a <= 18 });
  // entrance: glass doors, blue canopy, glowing sign above
  pane(g, 0, 13, 19, 0, 5, 19, glow('#e8f0ff'));
  g.box(11, 5, 20, 21, 6, 23, blue);
  g.set(11, 4, 22, glow('#5a9bff'));
  g.set(20, 4, 22, glow('#5a9bff'));
  sign(g, 10, 22, 7, 12, 20, '#2f5fb3', '#ffffff', 652);
  // roof: blue beacon, antenna, AC
  g.box(14, 13, 11, 18, 15, 14, col('#d8dde3'));
  g.box(15, 15, 12, 17, 16, 13, glow('#4a8bff'));
  antenna(g, 6, 8, 13, 9);
  acUnit(g, 22, 13, 8);
  acUnit(g, 22, 13, 13);
  flag(g, 28, 24, 0, 12, '#2f5fb3', '#f4f4f0');
  bush(g, 3, 21, 0, 6, 1, 1, 653);
  const props: PropPlacement[] = [
    { mesh: policeCarMesh(), x: 6, z: 26, rot: 0 },
    { mesh: policeCarMesh(), x: 24, z: 26.5, rot: 0 },
  ];
  return { g, props };
}

function fireStation(): Design {
  const g = grid(2, 38);
  const brick = courses('#c94b3d', 1, 0.94);
  g.box(3, 0, 6, 24, 15, 22, brick);
  g.box(3, 8, 6, 24, 9, 22, col('#f4f1ea'));
  parapet(g, 3, 6, 24, 22, 15, col('#f4f1ea'));
  windows(g, 3, 6, 24, 22, { y0: 9, floors: 1, floorH: 6, sill: 1, h: 3, w: 2, pitch: 3, style: 'home', seed: 660 });
  // three engine bays
  for (const x of [4, 11, 18]) {
    rollDoor(g, 0, x, x + 5, 0, 7, 21, '#e9ecef');
    pane(g, 0, x, x + 5, 6, 7, 21, glow('#fff0c8'));
  }
  sign(g, 7, 20, 9, 14, 22, '#f4f1ea', '#ff5a4a', 661);
  g.box(4, 15, 9, 6, 16, 11, col(C.metal));
  g.set(5, 16, 10, glow('#ff3b3b'));
  // hose-drying tower
  g.box(24, 0, 6, 30, 34, 12, brick);
  for (let y = 4; y < 30; y += 6) g.box(26, y, 11, 28, y + 3, 12, glow('#ffd98e'));
  hipRoof(g, 24, 6, 30, 12, 34, col('#5a6270'), { overhang: 1 });
  // hydrant and the engine
  g.box(29, 0, 26, 30, 2, 27, col('#e0504a'));
  g.set(29, 2, 26, col('#f4f1ea'));
  const props: PropPlacement[] = [{ mesh: fireTruckMesh(), x: 13.5, z: 25.8, rot: 0 }];
  return { g, props };
}

function clinic(): Design {
  const g = grid(2, 22);
  const white = mat('#f7f7f4', { seed: 670, cell: [6, 3, 6], dark: 0.2 });
  g.box(4, 0, 7, 28, 11, 23, white);
  g.box(4, 0, 7, 28, 1, 23, col('#a9b4b0'));
  g.box(4, 5, 7, 28, 6, 23, col('#5cc8a8'));
  parapet(g, 4, 7, 28, 23, 11, col('#5cc8a8'));
  windows(g, 4, 7, 28, 23, { y0: 0, floors: 2, floorH: 5, sill: 1, h: 3, w: 3, pitch: 4, style: 'office', seed: 671, skip: (f, a, fl) => f === 0 && fl === 0 && a >= 10 && a <= 18 });
  pane(g, 0, 12, 18, 0, 4, 22, glow('#eaf6ff'));
  g.box(10, 4, 23, 20, 5, 27, col('#5cc8a8'));
  // red cross on the facade, glowing cross light box on the roof
  const red = col('#e0504a');
  g.box(23, 6, 23, 26, 11, 24, col('#fbfbf8'));
  g.box(24, 7, 23, 25, 10, 24, red);
  g.box(23, 8, 23, 26, 9, 24, red);
  crossSign(g, 12, 11, 13, 8, 6, 2);
  g.box(13, 11, 11, 14, 12, 13, col(C.darkMetal));
  acUnit(g, 22, 11, 10);
  bush(g, 4, 24, 0, 5, 2, 1, 672);
  bench(g, 22, 26, 0, 'x');
  return { g, props: [{ mesh: ambulanceMesh(), x: 6, z: 27.5, rot: 0 }] };
}

function school(): Design {
  const g = grid(2, 26);
  const brick = courses('#d0704f', 1, 0.95);
  const roof = mat('#56607a', { seed: 680, cell: [3, 1, 1] });
  // L-shaped two-storey building
  g.box(2, 0, 3, 29, 10, 12, brick);
  g.box(2, 0, 12, 11, 10, 22, brick);
  g.box(2, 5, 3, 29, 6, 12, col('#f1e3c6'));
  g.box(2, 5, 12, 11, 6, 22, col('#f1e3c6'));
  windows(g, 2, 3, 29, 12, { y0: 0, floors: 2, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'office', seed: 681, faces: 14 });
  windows(g, 11, 3, 29, 12, { y0: 0, floors: 2, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'office', seed: 682, faces: 1, skip: (_f, a, fl) => fl === 0 && a >= 17 && a <= 20 });
  windows(g, 2, 12, 11, 22, { y0: 0, floors: 2, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'office', seed: 683, faces: 11 });
  gableRoof(g, 2, 3, 29, 12, 10, 'x', roof, brick, { ridge: col('#48506a') });
  gableRoof(g, 2, 12, 11, 22, 10, 'z', roof, brick, { ridge: col('#48506a') });
  // entrance with a little clock tower
  frontDoor(g, 18, 2, 0, 4, 11, '#3d5a80');
  g.box(16, 0, 9, 22, 18, 13, brick);
  pane(g, 0, 18, 20, 0, 4, 12, col('#3d5a80'));
  g.box(17, 12, 13, 21, 16, 14, col('#fbfbf8'));
  g.set(19, 14, 13, col(C.black));
  g.set(19, 15, 13, col(C.black));
  g.set(20, 14, 13, col(C.black));
  hipRoof(g, 16, 9, 22, 13, 18, col('#48506a'), { overhang: 1 });
  // playground: slide, swings, sandpit
  const red = col('#e0504a');
  const yel = col('#f5c542');
  const blu = col('#3d7be0');
  g.box(14, 0, 16, 18, 1, 20, col('#f2d58a'));
  g.box(14, 0, 16, 18, 1, 17, col('#b38b5a'));
  for (const x of [21, 27]) g.box(x, 0, 16, x + 1, 5, 17, blu);
  g.box(21, 5, 16, 28, 6, 17, blu);
  g.box(23, 2, 16, 24, 3, 17, red);
  g.box(25, 2, 16, 26, 3, 17, yel);
  g.box(22, 0, 24, 24, 5, 26, yel);
  for (let k = 0; k < 4; k++) g.box(24 + k, 4 - k, 24, 25 + k, 5 - k, 26, red);
  flag(g, 13, 13, 0, 14, '#3d7be0', '#f5c542');
  smallTree(g, 29, 29, 0, 684, 2, '#5db84a');
  return { g, props: [{ mesh: busMesh(), x: 7.5, z: 27.5, rot: 1 }] };
}

function hospital(): Design {
  const g = grid(3, 56);
  const white = mat('#f6f7f5', { seed: 690, cell: [8, 5, 8], dark: 0.25, dk: 0.95 });
  const mint = col('#5cc8a8');
  // tower block
  g.box(10, 0, 8, 38, 45, 26, white);
  ribbons(g, 10, 8, 38, 26, 10, 7, 5, 3, 'office', 691, 2, 1);
  for (let fl = 2; fl < 9; fl++) g.box(10, fl * 5, 8, 38, fl * 5 + 1, 26, col('#e8ece9'));
  g.box(10, 44, 8, 38, 45, 26, mint);
  // helipad on the roof
  cylinder(g, 24, 17, 8.2, 45, 46, col('#f5c542'));
  cylinder(g, 24, 17, 7.2, 45, 46, col('#4a4f58'));
  const hw = col('#fbfbf8');
  g.box(20, 45, 13, 22, 46, 21, hw);
  g.box(26, 45, 13, 28, 46, 21, hw);
  g.box(22, 45, 16, 26, 46, 18, hw);
  for (const [x, z] of [
    [11, 9],
    [36, 9],
    [11, 24],
    [36, 24],
  ] as Array<[number, number]>)
    g.set(x, 45, z, glow('#7ff38a'));
  // glowing cross sign high on the front of the tower
  crossSign(g, 30, 34, 26, 7, 7, 1);
  // low front wing with the emergency entrance
  g.box(4, 0, 26, 44, 10, 41, white);
  g.box(4, 0, 26, 44, 1, 41, col('#a9b4b0'));
  g.box(4, 9, 26, 44, 10, 41, mint);
  windows(g, 4, 26, 44, 41, { y0: 0, floors: 2, floorH: 5, sill: 1, h: 3, w: 3, pitch: 4, style: 'office', seed: 692, skip: (f, a, fl) => f === 0 && fl === 0 && a >= 16 && a <= 30 });
  pane(g, 0, 18, 30, 0, 4, 40, glow('#eaf6ff'));
  g.box(16, 4, 41, 32, 5, 46, col('#e0504a'));
  for (const x of [16, 31]) g.box(x, 0, 45, x + 1, 4, 46, col('#f4f4f0'));
  sign(g, 18, 30, 5, 10, 41, '#e0504a', '#ffffff', 693);
  acUnit(g, 6, 10, 28);
  acUnit(g, 40, 10, 28);
  bush(g, 4, 42, 0, 10, 2, 1, 694);
  bush(g, 34, 42, 0, 10, 2, 1, 695);
  const props: PropPlacement[] = [
    { mesh: ambulanceMesh(), x: 20, z: 43.5, rot: 0 },
    { mesh: ambulanceMesh(), x: 27, z: 43.5, rot: 0 },
  ];
  return { g, props };
}

function college(): Design {
  const g = grid(3, 36);
  const stone = mat('#f1e7d2', { seed: 700, cell: [4, 2, 4], dark: 0.18 });
  // main hall and lower wings
  g.box(6, 0, 4, 42, 14, 20, stone);
  g.box(6, 0, 4, 42, 1, 20, col('#c9bca2'));
  g.box(5, 13, 3, 43, 14, 21, col('#fbf6ea'));
  windows(g, 6, 4, 42, 20, { y0: 0, floors: 2, floorH: 6, sill: 2, h: 4, w: 2, pitch: 4, style: 'office', seed: 701, skip: (f, a) => f === 0 && a >= 15 && a <= 32 });
  for (const x0 of [2, 42]) {
    g.box(x0, 0, 6, x0 + 4, 10, 18, stone);
    hipRoof(g, x0, 6, x0 + 4, 18, 10, col('#8a7f74'), { overhang: 0 });
  }
  // portico: steps, columns, pediment
  g.box(15, 0, 20, 33, 1, 27, col('#e4d9c2'));
  for (let x = 16; x < 33; x += 3) g.box(x, 1, 24, x + 1, 11, 25, col('#fbf6ea'));
  g.box(15, 11, 20, 33, 13, 26, col('#fbf6ea'));
  gableRoof(g, 15, 20, 33, 26, 13, 'z', col('#e4d9c2'), col('#fbf6ea'), { overhang: 0 });
  pane(g, 0, 21, 27, 1, 8, 19, glow('#ffe2a8'));
  // drum and copper dome with a lantern
  cylinder(g, 24, 12, 6, 14, 18, stone);
  skinWindows(g, 24, 12, 6, 14, 1, 4, 1, 2, 'office', 702, 10);
  ellipsoid(g, 24, 18, 12, 6.5, 6, 6.5, mat('#5fb3a0', { seed: 703, cell: [2, 1, 2] }), true);
  g.box(23, 24, 11, 25, 27, 13, col('#fbf6ea'));
  g.set(24, 27, 12, glow('#ffe9b0'));
  // quad lawn with crossing paths and trees
  g.box(8, 0, 28, 40, 1, 46, mat('#7cc95a', { seed: 704, cell: [3, 1, 3], dark: 0.2 }));
  g.box(8, 0, 36, 40, 1, 38, col('#e4d9c2'));
  g.box(23, 0, 27, 25, 1, 46, col('#e4d9c2'));
  for (const [x, z] of [
    [11, 31],
    [36, 31],
    [11, 42],
    [36, 42],
  ] as Array<[number, number]>)
    smallTree(g, x, z, 1, 705 + x, 2, x < 20 ? '#5db84a' : '#62b85a');
  bench(g, 17, 35, 1, 'x');
  bench(g, 29, 35, 1, 'x');
  lampPost(g, 22, 39, 1, 5);
  lampPost(g, 25, 34, 1, 5);
  return { g };
}

function stadium(): Design {
  const g = grid(4, 44);
  const cx = 32;
  const cz = 32;
  const ax = 30.5;
  const az = 27;
  const p = 2.6;
  const inner = 0.6;
  const seatA = col('#3d7be0');
  const seatB = col('#f4f4f0');
  const seatC = col('#e0504a');
  const wall = col('#d8d3c8');
  const wallDark = col('#bdb6a8');
  for (let z = 0; z < 64; z++) {
    for (let x = 0; x < 64; x++) {
      const dx = Math.abs(x + 0.5 - cx) / ax;
      const dz = Math.abs(z + 0.5 - cz) / az;
      const n = Math.pow(Math.pow(dx, p) + Math.pow(dz, p), 1 / p);
      if (n > 1) continue;
      if (n < inner) continue;
      const t = (n - inner) / (1 - inner);
      const tier = Math.min(7, Math.floor(t * 8));
      const h = 2 + tier * 2;
      if (t > 0.93) {
        // outer wall with arches
        g.box(x, 0, z, x + 1, h + 2, z + 1, wall);
        continue;
      }
      g.box(x, 0, z, x + 1, h - 1, z + 1, wallDark);
      // seats: colour by sector around the bowl, alternating per tier
      const ang = Math.atan2(z + 0.5 - cz, x + 0.5 - cx);
      const sector = Math.floor(((ang / (Math.PI * 2) + 1) % 1) * 10);
      g.set(x, h - 1, z, sector % 2 === 0 ? (tier % 2 ? seatA : seatB) : tier % 2 ? seatC : seatB);
    }
  }
  // arches along the outside of the wall
  for (let z = 0; z < 64; z++) {
    for (let x = 0; x < 64; x++) {
      for (let y = 1; y < 5; y++) {
        if (!g.get(x, y, z) || g.get(x, 18, z) === 0) continue;
        const exposed = !g.get(x + 1, y, z) || !g.get(x - 1, y, z) || !g.get(x, y, z + 1) || !g.get(x, y, z - 1);
        if (exposed && (x + z) % 4 < 2) g.set(x, y, z, col('#7d7568'));
      }
    }
  }
  // pitch with mown stripes and white lines
  const grassA = col('#5cbf4a');
  const grassB = col('#4fae42');
  const line = col('#fbfbf8');
  const px0 = 17;
  const px1 = 47;
  const pz0 = 21;
  const pz1 = 43;
  g.box(px0 - 2, 0, pz0 - 2, px1 + 2, 1, pz1 + 2, col('#c9875a'));
  g.box(px0, 0, pz0, px1, 1, pz1, (x) => (Math.floor((x - px0) / 3) % 2 ? grassA : grassB));
  g.box(px0, 0, pz0, px1, 1, pz0 + 1, line);
  g.box(px0, 0, pz1 - 1, px1, 1, pz1, line);
  g.box(px0, 0, pz0, px0 + 1, 1, pz1, line);
  g.box(px1 - 1, 0, pz0, px1, 1, pz1, line);
  g.box(31, 0, pz0, 33, 1, pz1, line);
  for (let a = 0; a < 24; a++) {
    const an = (a / 24) * Math.PI * 2;
    g.set(Math.floor(32 + Math.cos(an) * 4.5), 0, Math.floor(32 + Math.sin(an) * 4.5), line);
  }
  for (const x of [px0, px1 - 3]) g.box(x, 1, 30, x + 3, 3, 34, line);
  // roof canopy over the back stand
  const roof = col('#f4f4f0');
  for (let z = 4; z < 16; z++) {
    for (let x = 10; x < 54; x++) {
      const dx = Math.abs(x + 0.5 - cx) / ax;
      const dz = Math.abs(z + 0.5 - cz) / az;
      const n = Math.pow(Math.pow(dx, p) + Math.pow(dz, p), 1 / p);
      if (n > 0.78 && n <= 1.0) g.set(x, 21, z, roof);
    }
  }
  for (const x of [14, 32, 50]) g.box(x, 18, 6, x + 1, 21, 7, col(C.steel));
  // floodlight masts at the four corners, lamps facing the pitch
  const steel = col('#8f99a6');
  for (const [x, z] of [
    [6, 6],
    [57, 6],
    [6, 57],
    [57, 57],
  ] as Array<[number, number]>) {
    g.box(x, 0, z, x + 1, 38, z + 1, steel);
    const sx = x < 32 ? 1 : -1;
    const sz = z < 32 ? 1 : -1;
    g.box(Math.min(x, x + sx * 3), 38, Math.min(z, z + sz * 3), Math.max(x, x + sx * 3) + 1, 41, Math.max(z, z + sz * 3) + 1, col('#5a6270'));
    for (let k = 0; k <= 3; k++) {
      g.set(x + sx * k, 39, z + sz * (3 - k), glow('#f6f9ff'));
      g.set(x + sx * k, 40, z + sz * (3 - k), glow('#f6f9ff'));
    }
  }
  // main gate with a glowing sign at the front
  g.box(26, 0, 57, 38, 12, 60, wall);
  g.box(28, 0, 59, 36, 7, 60, 0);
  pane(g, 0, 28, 36, 0, 6, 58, glow('#ffe6a8'));
  sign(g, 25, 39, 12, 17, 59, '#3d7be0', '#ffffff', 710);
  return { g };
}

function skyTower(): Design {
  const g = grid(2, 184);
  const cx = 16;
  const cz = 16;
  const white = courses('#f4f4f0', 8, 0.96);
  // plinth and four splayed legs that join into the shaft
  cylinder(g, cx, cz, 12.5, 0, 2, col('#d8d3c8'));
  cylinder(g, cx, cz, 5, 2, 6, col('#e9edf2'));
  pane(g, 0, 13, 19, 2, 5, 20, glow('#eaf6ff'));
  for (let y = 2; y < 30; y++) {
    const d = Math.round(9 * Math.pow(1 - y / 30, 1.3));
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as Array<[number, number]>) {
      const x = cx + sx * d - (sx > 0 ? 2 : 0);
      const z = cz + sz * d - (sz > 0 ? 2 : 0);
      g.box(x, y, z, x + 2, y + 1, z + 2, col('#e4e8ee'));
    }
  }
  cylinder(g, cx, cz, 3.2, 20, 130, white);
  // glowing rings up the shaft
  for (let y = 36; y < 126; y += 15) {
    cylinder(g, cx, cz, 4.2, y, y + 1, glow('#8ff0ff'));
    cylinder(g, cx, cz, 4.2, y + 1, y + 2, col('#cfe9ee'));
  }
  // the observation cube: a glass box in a white frame, then a smaller cube and the needle
  g.box(7, 128, 7, 25, 130, 25, col('#e4e8ee'));
  g.box(8, 130, 8, 24, 146, 24, col('#f4f4f0'));
  windows(g, 8, 8, 24, 24, { y0: 130, floors: 3, floorH: 5, sill: 1, h: 4, w: 3, pitch: 4, margin: 1, style: 'tower', seed: 720, litShare: 0.85 });
  g.box(7, 146, 7, 25, 147, 25, col('#5fd0d8'));
  g.box(9, 147, 9, 23, 149, 23, col('#e4e8ee'));
  g.box(11, 149, 11, 21, 157, 21, col('#f4f4f0'));
  windows(g, 11, 11, 21, 21, { y0: 149, floors: 1, floorH: 8, sill: 2, h: 4, w: 2, pitch: 3, margin: 1, style: 'tower', seed: 721, litShare: 0.9 });
  g.box(12, 157, 12, 20, 158, 20, col('#5fd0d8'));
  g.box(14, 158, 14, 18, 164, 18, col('#e4e8ee'));
  g.box(15, 164, 15, 17, 178, 17, col('#dfe6ee'));
  g.box(15, 178, 15, 16, 182, 16, col('#c9d0d8'));
  g.set(15, 182, 15, glow('#ff4a3a'));
  // corner lights on the cube
  for (const [x, z] of [
    [7, 7],
    [24, 7],
    [7, 24],
    [24, 24],
  ] as Array<[number, number]>)
    g.set(x, 146, z, glow('#ffe9b0'));
  return { g };
}

const DESIGNS: Record<BuildingType, () => Design> = {
  power_coal: coalPlant,
  power_wind: windTurbine,
  power_solar: solarFarm,
  water_tower: waterTower,
  water_pump: waterPump,
  park_small: smallPark,
  park_plaza: plaza,
  police: policeStation,
  fire: fireStation,
  clinic,
  school,
  hospital,
  college,
  stadium,
  landmark: skyTower,
};

export function buildingDesign(type: BuildingType): Design {
  const make = DESIGNS[type];
  if (make) return make();
  // unknown type (a newer save?): a neutral block of the right size so nothing breaks
  const n = (BUILDINGS[type]?.size ?? 1) * 16;
  const g = new VoxelGrid(n, 12, n);
  g.box(2, 0, 2, n - 2, 10, n - 2, col(C.concrete));
  return { g };
}
