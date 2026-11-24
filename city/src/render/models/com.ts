// Shops: level 1 corner shops and cafés, level 2 offices and a mall, level 3 glass towers.
// The world paves commercial lots; the front (+z) faces the road.
import { hash01 } from '../../core/rng';
import { col, courses, glow, mat, stripes, windowColor, LAMP } from './palette';
import {
  C,
  acUnit,
  antenna,
  awning,
  bush,
  cylinder,
  frontDoor,
  lampPost,
  pane,
  parapet,
  ribbons,
  sign,
  skinWindows,
  smallTree,
  windows,
} from './shapes';
import type { Design } from './design';
import { carMesh } from './vehicles';
import { VoxelGrid } from './voxel';

function lot(h: number): VoxelGrid {
  return new VoxelGrid(16, h, 16);
}

/** A café table with a parasol. */
function parasol(g: VoxelGrid, x: number, z: number, hex: string): void {
  g.box(x, 0, z, x + 1, 1, z + 1, col(C.wood));
  g.box(x, 1, z, x + 1, 3, z + 1, col(C.frame));
  g.box(x - 1, 3, z - 1, x + 2, 4, z + 2, col(hex));
  g.set(x, 4, z, col(hex, 0.9));
}

/** Shop window glass across the ground floor front, with the door in the middle. */
function shopfront(g: VoxelGrid, x0: number, x1: number, layer: number, h: number, door: number, doorHex: string): void {
  pane(g, 0, x0, x1, 1, 1 + h, layer, glow('#ffe2a0'));
  pane(g, 0, door, door + 2, 0, 4, layer, col(doorHex));
}

// ---------------------------------------------------------------- level 1

function cafe(): Design {
  const g = lot(15);
  const wall = mat('#f7c9a4', { seed: 200 });
  g.box(2, 0, 3, 14, 8, 11, wall);
  g.box(2, 0, 3, 14, 1, 11, col('#a9826a'));
  shopfront(g, 3, 13, 10, 4, 7, '#6a3d2a');
  windows(g, 2, 3, 14, 11, { y0: 0, floors: 1, floorH: 8, sill: 2, h: 3, w: 2, pitch: 4, style: 'shop', seed: 201, faces: 14 });
  // cornice and a sign on the parapet
  g.box(1, 8, 2, 15, 9, 12, col('#fff3e4'));
  sign(g, 3, 13, 9, 14, 10, '#6a3d2a', '#ffd27a', 202);
  // red and white striped awning
  awning(g, 3, 13, 6, 11, 2, stripes('#e5483f', '#fff6ec', 'x'));
  // tables with parasols on the pavement
  parasol(g, 3, 13, '#e5483f');
  parasol(g, 12, 13, '#2fb3a6');
  g.box(6, 0, 12, 7, 1, 13, col('#3e8f4a'));
  g.box(9, 0, 12, 10, 1, 13, col('#3e8f4a'));
  g.box(6, 1, 12, 7, 2, 13, mat(C.hedge, { seed: 203, cell: [1, 1, 1] }));
  g.box(9, 1, 12, 10, 2, 13, mat(C.hedge, { seed: 204, cell: [1, 1, 1] }));
  acUnit(g, 4, 8, 4);
  return { g };
}

function grocery(): Design {
  const g = lot(19);
  const wall = mat('#f1ede2', { seed: 210 });
  g.box(2, 0, 2, 13, 11, 11, wall);
  g.box(2, 0, 2, 13, 1, 11, col('#7d8a6a'));
  shopfront(g, 3, 12, 10, 4, 7, '#2f6f45');
  windows(g, 2, 2, 13, 11, { y0: 6, floors: 1, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'home', seed: 211 });
  windows(g, 2, 2, 13, 11, { y0: 0, floors: 1, floorH: 6, sill: 2, h: 3, w: 2, pitch: 4, style: 'shop', seed: 212, faces: 2 });
  awning(g, 2, 13, 5, 11, 2, stripes('#3f9a4f', '#e8f5e0', 'x'));
  parapet(g, 2, 2, 13, 11, 11, col('#d9d2c2'));
  // rooftop sign box on legs
  g.box(5, 12, 6, 6, 13, 7, col(C.darkMetal));
  g.box(10, 12, 6, 11, 13, 7, col(C.darkMetal));
  sign(g, 3, 13, 13, 18, 6, '#3f9a4f', '#fff2c0', 213);
  // fruit crates out front
  const fruit = ['#e5483f', '#f5a623', '#f5d742', '#7ac943'];
  for (let k = 0; k < 4; k++) {
    const x = k < 2 ? 3 + k * 2 : 9 + (k - 2) * 2;
    g.box(x, 0, 12, x + 2, 1, 13, col(C.wood));
    g.box(x, 1, 12, x + 2, 2, 13, col(fruit[k]));
  }
  // an AC unit on the side wall and a shrub by the door
  acUnit(g, 13, 2, 4, 1, 2);
  bush(g, 13, 12, 0, 2, 2, 1, 214);
  return { g };
}

function diner(): Design {
  const g = lot(16);
  const teal = mat('#6cc8c0', { seed: 220 });
  g.box(1, 0, 4, 15, 6, 11, teal);
  // rounded ends
  g.box(1, 0, 4, 2, 6, 5, 0);
  g.box(1, 0, 10, 2, 6, 11, 0);
  g.box(14, 0, 4, 15, 6, 5, 0);
  g.box(14, 0, 10, 15, 6, 11, 0);
  // chrome band and a lit window strip all round
  g.paintSolid(0, 1, 0, 16, 2, 16, col('#e8edf2'));
  for (let x = 1; x < 15; x++) {
    for (let z = 4; z < 11; z++) {
      for (let y = 2; y < 4; y++) {
        if (g.get(x, y, z) === 0) continue;
        if (g.get(x + 1, y, z) && g.get(x - 1, y, z) && g.get(x, y, z + 1) && g.get(x, y, z - 1)) continue;
        g.set(x, y, z, windowColor('shop', hash01(Math.floor(x / 2), z, 221)));
      }
    }
  }
  pane(g, 0, 7, 9, 0, 4, 10, col('#c33f3a'));
  g.box(1, 6, 4, 15, 7, 11, col('#f4f1ea'));
  g.box(2, 6, 5, 14, 7, 10, col('#e5483f'));
  // big rooftop sign on posts: red board, glowing letters and a star
  g.box(4, 7, 7, 5, 9, 8, col(C.darkMetal));
  g.box(11, 7, 7, 12, 9, 8, col(C.darkMetal));
  sign(g, 3, 13, 9, 14, 7, '#e5483f', '#fff2a8', 222);
  g.box(7, 14, 7, 9, 15, 8, glow('#ffd84a'));
  // a customer's car parked out front
  return {
    g,
    props: [{ mesh: carMesh(2), x: 12.5, z: 13.3, rot: 1 }],
  };
}

function shopWithFlat(): Design {
  const g = lot(16);
  const lower = courses('#c98a6a', 1, 0.94);
  const upper = mat('#c9b6e4', { seed: 230 });
  g.box(3, 0, 3, 13, 6, 12, lower);
  g.box(3, 6, 3, 13, 12, 12, upper);
  g.box(2, 6, 2, 14, 7, 13, col(C.frame));
  g.box(3, 12, 3, 13, 13, 12, col('#a9aeb6'));
  parapet(g, 2, 2, 14, 13, 12, col(C.frame), 2);
  shopfront(g, 4, 12, 11, 4, 9, '#2f4f7a');
  windows(g, 3, 3, 13, 12, { y0: 7, floors: 1, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'home', seed: 231 });
  awning(g, 3, 13, 5, 12, 2, stripes('#3d7be0', '#eef4ff', 'x'));
  // sign hanging on the corner
  g.box(13, 8, 12, 14, 11, 13, col('#3d7be0'));
  g.set(13, 9, 13, glow('#ffe6a8'));
  // roof: AC units and a satellite dish
  acUnit(g, 4, 13, 4);
  acUnit(g, 8, 13, 4);
  g.box(10, 13, 8, 11, 15, 9, col(C.metal));
  g.box(9, 15, 7, 12, 16, 10, col('#f4f4f0'));
  // potted plants and a bench outside
  bush(g, 2, 13, 0, 1, 1, 2, 232);
  bush(g, 13, 13, 0, 1, 1, 2, 233);
  lampPost(g, 2, 14, 0, 5);
  return { g };
}

// ---------------------------------------------------------------- level 2

function ribbonOffice(): Design {
  const g = lot(32);
  const floors = 5;
  const fh = 5;
  const white = mat('#eeeeea', { seed: 240, cell: [12, 5, 12], dark: 0.3, dk: 0.95 });
  g.box(2, 0, 2, 14, floors * fh + 1, 14, white);
  ribbons(g, 2, 2, 14, 14, 0, floors, fh, 3, 'office', 241, 2, 1);
  // lobby canopy and entrance
  g.box(5, 4, 14, 11, 5, 16, col('#3a6fb8'));
  pane(g, 0, 6, 10, 0, 4, 13, glow('#fff0c8'));
  // rooftop plant: AC units, a lift housing with a logo stripe
  parapet(g, 2, 2, 14, 14, floors * fh + 1, col('#d6d6d0'));
  g.box(4, 26, 4, 8, 29, 8, col('#d6d6d0'));
  g.box(4, 28, 4, 8, 29, 8, col('#3a6fb8'));
  acUnit(g, 10, 26, 4);
  acUnit(g, 10, 26, 8);
  acUnit(g, 5, 26, 10);
  bush(g, 1, 14, 0, 2, 1, 1, 242);
  bush(g, 13, 14, 0, 2, 1, 1, 243);
  return { g };
}

function mall(): Design {
  const g = lot(26);
  const wall = mat('#ecdcc6', { seed: 250, cell: [4, 3, 4] });
  g.box(1, 0, 2, 15, 18, 13, wall);
  g.box(1, 0, 2, 15, 1, 13, col('#a8957c'));
  // orange stripe and display windows on the sides
  g.box(1, 12, 2, 15, 13, 13, col('#f08a3c'));
  windows(g, 1, 2, 15, 13, { y0: 0, floors: 2, floorH: 6, sill: 1, h: 4, w: 3, pitch: 4, style: 'shop', seed: 251, faces: 14 });
  // glass atrium in the middle of the front
  g.box(4, 0, 13, 12, 16, 15, col('#e8e4dc'));
  for (let y = 1; y < 15; y++) {
    for (let x = 5; x < 11; x++) g.set(x, y, 14, (y % 5 === 0 ? col('#cfd5dc') : windowColor('shop', hash01(x, Math.floor(y / 5), 252), 0.95)));
  }
  pane(g, 0, 7, 9, 0, 4, 14, col('#2f3b4a'));
  g.box(3, 4, 15, 13, 5, 16, col('#f08a3c'));
  // big sign above the atrium and skylights on the roof
  sign(g, 3, 13, 16, 21, 14, '#f08a3c', '#fff6dc', 253);
  for (const x of [3, 8]) {
    g.box(x, 18, 4, x + 4, 19, 11, col('#d8d0c2'));
    g.box(x + 1, 19, 5, x + 3, 20, 10, glow('#e8f0ff'));
  }
  acUnit(g, 12, 18, 4);
  acUnit(g, 12, 18, 8);
  return { g };
}

function gridOffice(): Design {
  const g = lot(36);
  const floors = 6;
  const fh = 5;
  const stone = mat('#d9dde3', { seed: 260, cell: [10, 5, 10], dark: 0.3, dk: 0.95 });
  g.box(3, 0, 3, 13, floors * fh + 1, 13, stone);
  g.box(3, 0, 3, 13, 5, 13, col('#5a6270'));
  windows(g, 3, 3, 13, 13, { y0: 5, floors: floors - 1, floorH: fh, sill: 1, h: 3, w: 2, pitch: 3, style: 'office', seed: 261 });
  pane(g, 0, 4, 12, 1, 4, 12, glow('#fff1cc'));
  // glass corner column at the front right
  for (let y = 5; y < floors * fh; y++) {
    const c = windowColor('office', hash01(Math.floor(y / fh), 3, 262));
    g.set(12, y, 12, c);
  }
  g.box(2, 4, 2, 14, 5, 14, col('#5a6270'));
  // roof: antenna, AC and a little lift housing
  parapet(g, 3, 3, 13, 13, floors * fh + 1, col('#5a6270'));
  g.box(4, 31, 4, 7, 34, 7, col('#b9bec6'));
  acUnit(g, 9, 31, 4);
  acUnit(g, 9, 31, 8);
  antenna(g, 5, 9, 31, 4);
  lampPost(g, 2, 14, 0, 5);
  lampPost(g, 13, 14, 0, 5);
  return { g };
}

function hotel(): Design {
  const g = lot(36);
  const floors = 6;
  const fh = 5;
  const wall = mat('#f2e6d0', { seed: 270, cell: [12, 5, 12], dark: 0.3, dk: 0.95 });
  g.box(2, 0, 4, 14, floors * fh + 1, 12, wall);
  g.box(2, 0, 4, 14, 5, 12, col('#8a4b5e'));
  windows(g, 2, 4, 14, 12, { y0: 5, floors: floors - 1, floorH: fh, sill: 1, h: 3, w: 2, pitch: 3, style: 'home', seed: 271 });
  pane(g, 0, 4, 12, 1, 4, 11, glow('#ffd890'));
  pane(g, 0, 7, 9, 0, 4, 11, col('#3a2630'));
  // vertical fins between window columns on the front
  for (const x of [2, 13]) g.box(x, 5, 12, x + 1, floors * fh + 1, 13, col('#c95b6e'));
  // canopy with lamps
  g.box(5, 4, 12, 11, 5, 15, col('#c95b6e'));
  g.set(5, 3, 14, glow(LAMP));
  g.set(10, 3, 14, glow(LAMP));
  // a tall vertical sign on the corner
  g.box(14, 8, 10, 15, 28, 12, col('#c95b6e'));
  for (let y = 9; y < 27; y++) if (y % 3 !== 0) g.set(14, y, 11, glow('#ffe1ef'));
  // roof terrace with parasols
  parapet(g, 2, 4, 14, 12, floors * fh + 1, col('#c95b6e'));
  g.box(5, 32, 6, 6, 34, 7, col(C.frame));
  g.box(4, 34, 5, 7, 35, 8, col('#2fb3a6'));
  g.box(10, 32, 8, 11, 34, 9, col(C.frame));
  g.box(9, 34, 7, 12, 35, 10, col('#f5c542'));
  bush(g, 1, 13, 0, 1, 2, 2, 272);
  bush(g, 14, 13, 0, 1, 2, 2, 273);
  return { g };
}

// ---------------------------------------------------------------- level 3

function spireTower(): Design {
  const g = lot(96);
  const fh = 5;
  const floors = 14;
  const frame = col('#cdd7e3');
  g.box(3, 0, 3, 13, floors * fh + 2, 13, frame);
  // curtain wall: blue glass in vertical strips separated by light mullions
  windows(g, 3, 3, 13, 13, { y0: 0, floors, floorH: fh, sill: 0, h: 4, w: 2, pitch: 3, margin: 0, style: 'office', seed: 300 });
  g.box(2, 0, 2, 14, 4, 14, col('#4d5f78'));
  pane(g, 0, 4, 12, 0, 3, 13, glow('#fff0c8'));
  // tapering crown and a spire with a red tip
  const top = floors * fh + 2;
  g.box(4, top, 4, 12, top + 3, 12, frame);
  windows(g, 4, 4, 12, 12, { y0: top, floors: 1, floorH: 3, sill: 0, h: 2, w: 2, pitch: 2, margin: 0, style: 'office', seed: 301 });
  g.box(5, top + 3, 5, 11, top + 5, 11, col('#9fb0c4'));
  g.box(6, top + 5, 6, 10, top + 7, 10, col('#b8c6d6'));
  g.box(7, top + 7, 7, 9, top + 10, 9, col('#dfe6ee'));
  antenna(g, 7, 7, top + 10, 8);
  return { g };
}

function decoTower(): Design {
  const g = lot(92);
  const fh = 5;
  const stone = mat('#efe4cf', { seed: 310, cell: [12, 5, 12], dark: 0.3, dk: 0.95 });
  const tiers: Array<[number, number, number]> = [
    [2, 0, 6],
    [3, 6, 11],
    [4, 11, 15],
  ];
  for (const [inset, f0, f1] of tiers) {
    g.box(inset, f0 * fh, inset, 16 - inset, f1 * fh, 16 - inset, stone);
    windows(g, inset, inset, 16 - inset, 16 - inset, { y0: f0 * fh, floors: f1 - f0, floorH: fh, sill: 0, h: 4, w: 1, pitch: 2, style: 'tower', seed: 311 + f0 });
    // gold trim on each setback
    g.box(inset, f1 * fh - 1, inset, 16 - inset, f1 * fh, 16 - inset, col('#d9b44a'));
  }
  pane(g, 0, 5, 11, 0, 4, 13, glow('#ffd98a'));
  // crown: stepped pyramid with glowing chevrons, then a needle
  const top = 15 * fh;
  g.box(5, top, 5, 11, top + 3, 11, col('#d9b44a'));
  for (let x = 5; x < 11; x += 2) {
    g.set(x, top + 1, 10, glow('#ffe9b0'));
    g.set(x, top + 1, 5, glow('#ffe9b0'));
    g.set(10, top + 1, x, glow('#ffe9b0'));
    g.set(5, top + 1, x, glow('#ffe9b0'));
  }
  g.box(6, top + 3, 6, 10, top + 6, 10, col('#e8cf7a'));
  g.box(7, top + 6, 7, 9, top + 9, 9, col('#d9b44a'));
  antenna(g, 7, 8, top + 9, 6, '#ff5a4a');
  return { g };
}

function slopedTower(): Design {
  const g = lot(86);
  const fh = 5;
  const floors = 15;
  const glassFrame = col('#2a6f73');
  g.box(3, 0, 4, 13, floors * fh, 12, glassFrame);
  ribbons(g, 3, 4, 13, 12, 0, floors, fh, 4, 'office', 320, 2, 0);
  // the roof slopes down toward the front in steps
  for (let z = 4; z < 12; z++) {
    const cut = (z - 4) * 2;
    g.box(3, floors * fh - cut, z, 13, floors * fh, z + 1, 0);
    g.box(3, floors * fh - cut - 1, z, 13, floors * fh - cut, z + 1, col('#d5e7e6'));
  }
  g.box(2, 0, 3, 14, 4, 13, col('#cfd8d8'));
  pane(g, 0, 4, 12, 0, 3, 12, glow('#fff1cc'));
  // rooftop masts at the high back edge
  antenna(g, 4, 4, floors * fh, 6);
  antenna(g, 11, 4, floors * fh, 4);
  return { g };
}

function roundGlassTower(): Design {
  const g = lot(88);
  const fh = 5;
  const floors = 15;
  cylinder(g, 8, 8, 5.7, 0, floors * fh, col('#2f3d52'));
  skinWindows(g, 8, 8, 5.7, 0, floors, fh, 0, 4, 'office', 330, 16, 0.2);
  // gold bands every three floors
  for (let fl = 3; fl < floors; fl += 3) cylinder(g, 8, 8, 6.2, fl * fh, fl * fh + 1, col('#d9b44a'));
  // glowing crown ring and a helipad
  const top = floors * fh;
  cylinder(g, 8, 8, 6.2, top, top + 2, col('#d9b44a'));
  skinWindows(g, 8, 8, 6.2, top, 1, 2, 0, 1, 'tower', 331, 24, 0.0);
  cylinder(g, 8, 8, 5.2, top + 2, top + 3, col('#3e4a5c'));
  g.box(6, top + 3, 7, 10, top + 4, 9, col('#f5c542'));
  g.box(7, top + 3, 6, 9, top + 4, 10, col('#f5c542'));
  g.box(2, 0, 2, 14, 3, 14, col('#c9ced6'));
  pane(g, 0, 4, 12, 0, 3, 13, glow('#fff0c8'));
  bush(g, 2, 11, 3, 2, 2, 1, 332);
  bush(g, 12, 11, 3, 2, 2, 1, 333);
  return { g };
}

export function comDesign(level: number, v: number): Design {
  if (level === 1) return [cafe, grocery, diner, shopWithFlat][v]();
  if (level === 2) return [ribbonOffice, mall, gridOffice, hotel][v]();
  return [spireTower, decoTower, slopedTower, roundGlassTower][v]();
}

