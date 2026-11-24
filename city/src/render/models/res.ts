// Homes: level 1 cottages, level 2 townhouses and apartment blocks, level 3 residential towers.
// Lots are 16×16 voxels; the front (+z, z = 15) faces the road. The world paints a lawn with a
// stone path to the door at x 7..8, z ≥ 11, so cottage doors sit there.
import { col, courses, glow, mat, LAMP } from './palette';
import {
  C,
  acUnit,
  antenna,
  bench,
  bush,
  fence,
  flowers,
  frontDoor,
  gableRoof,
  hipRoof,
  pane,
  parapet,
  roofGarden,
  skinWindows,
  smallPine,
  smallTree,
  solarPanels,
  waterTank,
  windows,
  cylinder,
} from './shapes';
import type { Design } from './design';
import { carMesh } from './vehicles';
import { VoxelGrid } from './voxel';

function lot(h: number): VoxelGrid {
  return new VoxelGrid(16, h, 16);
}

/** Stone foundation course under a wall block. */
function plinth(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, hex = '#c8bea8'): void {
  g.box(x0, 0, z0, x1, 1, z1, col(hex));
}

// ---------------------------------------------------------------- level 1: cottages

function cottageClassic(): Design {
  const g = lot(16);
  const wall = mat('#f6e7c8', { seed: 1 });
  g.box(3, 0, 5, 13, 6, 12, wall);
  plinth(g, 3, 5, 13, 12);
  windows(g, 3, 5, 13, 12, { y0: 0, floors: 1, floorH: 6, sill: 2, h: 2, w: 2, pitch: 6, style: 'home', seed: 11, inset: true });
  frontDoor(g, 7, 2, 1, 3, 11, C.door, false);
  const roof = mat('#e0574a', { seed: 2, dark: 0.18, cell: [3, 1, 1] });
  gableRoof(g, 3, 5, 13, 12, 6, 'x', roof, wall, { ridge: col('#b8443b') });
  // chimney
  g.box(10, 6, 6, 12, 12, 8, mat(C.brick, { seed: 3, cell: [1, 1, 1] }));
  g.box(10, 12, 6, 12, 13, 8, col(C.brickDark));
  // porch: little roof on two white posts
  g.box(6, 4, 12, 10, 5, 14, col('#c9483e'));
  g.box(6, 0, 13, 7, 4, 14, col(C.frame));
  g.box(9, 0, 13, 10, 4, 14, col(C.frame));
  g.set(8, 3, 12, glow(LAMP));
  // flower beds under the front windows, fence with a gate gap at the path
  flowers(g, 3, 12, 6, 13, 0, 4);
  flowers(g, 10, 12, 13, 13, 0, 5);
  fence(g, 'x', 1, 15, 14, 0, C.frame, [[6, 10]]);
  smallTree(g, 2, 2, 0, 6, 2, '#5db84a');
  bush(g, 13, 2, 0, 2, 2, 1, 7);
  return { g };
}

function cottageBungalow(): Design {
  const g = lot(14);
  const wall = mat('#d3e6f3', { seed: 11 });
  g.box(2, 0, 4, 10, 5, 11, wall);
  plinth(g, 2, 4, 10, 11, '#b9c3cc');
  windows(g, 2, 4, 10, 11, { y0: 0, floors: 1, floorH: 5, sill: 2, h: 2, w: 2, pitch: 4, style: 'home', seed: 12, faces: 14, inset: true });
  pane(g, 0, 3, 5, 2, 4, 10, glow('#ffd27a'), false);
  frontDoor(g, 7, 2, 1, 3, 10, C.doorBlue);
  hipRoof(g, 2, 4, 10, 11, 5, mat('#4f73b8', { seed: 13, cell: [2, 1, 2] }), { ridge: col('#3c5a96') });
  // garage with a white roll-up door and a flat roof
  g.box(10, 0, 5, 14, 4, 11, mat('#e9eef2', { seed: 14 }));
  g.box(10, 4, 5, 14, 5, 11, col('#9aa7b4'));
  const slat = [col('#fbfbf8'), col('#dcdfe2')];
  pane(g, 0, 11, 13, 0, 3, 10, (_x, y) => slat[y % 2]);
  acUnit(g, 3, 0, 2, 2, 2);
  // hedge along the left edge and a planter by the door
  bush(g, 1, 11, 0, 1, 4, 1, 15);
  flowers(g, 3, 11, 6, 12, 0, 16);
  smallTree(g, 4, 1, 0, 17, 1, '#73c44f');
  return {
    g,
    // the family car on the driveway, nose to the garage
    props: [{ mesh: carMesh(1), x: 12, z: 13.6, rot: 2 }],
  };
}

function cottageAFrame(): Design {
  const g = lot(18);
  const wall = mat('#f7e2a0', { seed: 21 });
  g.box(4, 0, 3, 12, 4, 12, wall);
  plinth(g, 4, 3, 12, 12);
  const roof = mat('#8a63b8', { seed: 22, cell: [1, 2, 3] });
  gableRoof(g, 4, 3, 12, 12, 4, 'z', roof, wall, { rise: 2, ridge: col('#6c4c96') });
  frontDoor(g, 7, 2, 0, 3, 11, '#8a4b2f');
  // tall window in the gable end above the door, and side windows
  pane(g, 0, 7, 9, 6, 9, 11, glow('#ffcf7a'));
  pane(g, 2, 7, 9, 6, 8, 3, glow('#ffe0a0'));
  windows(g, 4, 3, 12, 12, { y0: 0, floors: 1, floorH: 4, sill: 1, h: 2, w: 2, pitch: 4, style: 'home', seed: 23, faces: 10 });
  // chimney through the back slope
  g.box(9, 8, 5, 11, 14, 7, mat(C.brick, { seed: 24, cell: [1, 1, 1] }));
  g.box(9, 14, 5, 11, 15, 7, col(C.brickDark));
  // vegetable patch on the right, pine on the left, a mailbox by the path
  g.box(12, 0, 4, 15, 1, 11, col(C.soil));
  for (let z = 4; z < 11; z += 2) g.box(12, 1, z, 15, 2, z + 1, mat('#6fc04f', { seed: 25, cell: [1, 1, 1] }));
  smallPine(g, 2, 5, 0, 26, 8);
  g.box(10, 0, 14, 11, 2, 15, col(C.woodDark));
  g.box(10, 2, 14, 11, 3, 15, col('#4f7bd0'));
  bush(g, 1, 10, 0, 2, 3, 1, 27);
  return { g };
}

function cottageFarm(): Design {
  const g = lot(16);
  const wall = mat('#f6f1e6', { seed: 31 });
  const roof = mat('#cf6b3f', { seed: 32, cell: [3, 1, 1] });
  const ridge = col('#a95532');
  // main wing across the back, front wing on the left
  g.box(2, 0, 3, 13, 5, 9, wall);
  g.box(2, 0, 8, 7, 5, 13, wall);
  plinth(g, 2, 3, 13, 9);
  plinth(g, 2, 8, 7, 13);
  windows(g, 2, 3, 13, 9, { y0: 0, floors: 1, floorH: 5, sill: 2, h: 2, w: 2, pitch: 4, style: 'home', seed: 33, faces: 14, inset: true });
  windows(g, 2, 8, 7, 13, { y0: 0, floors: 1, floorH: 5, sill: 2, h: 2, w: 2, pitch: 4, style: 'home', seed: 34, faces: 9, inset: true });
  pane(g, 0, 10, 12, 2, 4, 8, glow('#ffc35e'), true);
  frontDoor(g, 7, 2, 1, 3, 8, '#5d7f3a');
  gableRoof(g, 2, 3, 13, 9, 5, 'x', roof, wall, { ridge });
  gableRoof(g, 2, 8, 7, 13, 5, 'z', roof, wall, { ridge });
  // timber porch along the main wing's front with a bench
  g.box(7, 3, 9, 13, 4, 11, col(C.wood));
  g.box(12, 0, 10, 13, 3, 11, col(C.woodDark));
  bench(g, 9, 10, 0, 'x');
  // round tree on the right, a little doghouse, flowers at the corner
  smallTree(g, 14, 13, 0, 35, 1, '#62b85a');
  g.box(9, 0, 13, 11, 2, 15, col('#c2884f'));
  g.box(9, 2, 13, 11, 3, 15, col('#b5463c'));
  g.set(10, 0, 15, 0);
  flowers(g, 1, 13, 7, 14, 0, 36);
  return { g };
}

// ---------------------------------------------------------------- level 2: townhouses, apartments

function townhouses(): Design {
  const g = lot(24);
  const fronts = ['#e8a3a0', '#f2d28a', '#9fcbe3'];
  const roofs = ['#7a5560', '#6e6a5a', '#4f6382'];
  for (let k = 0; k < 3; k++) {
    const x0 = 2 + k * 4;
    const x1 = x0 + 4;
    const wall = mat(fronts[k], { seed: 40 + k, cell: [2, 1, 2] });
    const h = 15 + (k === 1 ? 2 : 0);
    g.box(x0, 0, 4, x1, h, 12, wall);
    plinth(g, x0, 4, x1, 12, '#b7ad9c');
    // cornice
    g.box(x0, h - 1, 4, x1, h, 13, col(C.frame));
    gableRoof(g, x0, 4, x1, 12, h, 'z', col(roofs[k]), wall, { overhang: 0, rise: 2 });
    windows(g, x0, 4, x1, 12, { y0: 0, floors: 3, floorH: 5, sill: 2, h: 3, w: 2, pitch: 3, style: 'home', seed: 44 + k, faces: 5, skip: (f, _a, fl) => f === 0 && fl === 0 });
    // door with a stoop on the ground floor
    frontDoor(g, x0 + 1, 2, 1, 3, 11, ['#5b3a6a', '#2f6f6a', '#8a3a33'][k]);
    g.box(x0 + 1, 0, 12, x0 + 3, 1, 14, col('#cfc6b6'));
    // a window box with flowers on the first floor
    flowers(g, x0 + 1, 12, x0 + 3, 13, 6, 47 + k);
  }
  // side walls get small windows, and a chimney between roofs
  windows(g, 2, 4, 14, 12, { y0: 0, floors: 3, floorH: 5, sill: 2, h: 2, w: 2, pitch: 4, style: 'home', seed: 49, faces: 10 });
  g.box(5, 15, 6, 7, 21, 8, mat(C.brick, { seed: 50, cell: [1, 1, 1] }));
  bush(g, 2, 13, 0, 1, 1, 1, 51);
  bush(g, 13, 13, 0, 1, 1, 1, 52);
  return { g };
}

function brickApartments(): Design {
  const g = lot(30);
  const brick = courses(C.brick, 1, 0.95);
  g.box(2, 0, 3, 14, 20, 13, brick);
  g.box(2, 0, 3, 14, 1, 13, col('#8f8577'));
  // stone bands between floors
  for (let fl = 1; fl < 4; fl++) g.box(2, fl * 5, 3, 14, fl * 5 + 1, 13, col('#e3d6c0'));
  parapet(g, 2, 3, 14, 13, 20, col('#e3d6c0'));
  windows(g, 2, 3, 14, 13, {
    y0: 0, floors: 4, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'home', seed: 60, inset: true,
    skip: (f, a, fl) => f === 0 && fl === 0 && a >= 6 && a <= 9,
  });
  // entrance with a canopy
  frontDoor(g, 7, 2, 1, 4, 12, '#3a3f4a', false);
  g.box(6, 4, 13, 10, 5, 15, col('#2f6f6a'));
  g.set(8, 3, 13, glow(LAMP));
  // balconies with iron railings on the front
  for (let fl = 1; fl < 4; fl++) {
    for (const x0 of [3, 10]) {
      g.box(x0, fl * 5, 13, x0 + 3, fl * 5 + 1, 15, col('#d8cbb5'));
      g.box(x0, fl * 5 + 1, 14, x0 + 3, fl * 5 + 2, 15, col(C.darkMetal));
    }
  }
  // roof: water tank, AC units, a hatch
  waterTank(g, 9, 5, 20);
  acUnit(g, 4, 20, 5);
  acUnit(g, 4, 20, 9);
  g.box(12, 20, 10, 13, 22, 12, col(C.concreteDark));
  return { g };
}

function modernApartments(): Design {
  const g = lot(30);
  const white = mat('#f3f1ec', { seed: 70, cell: [3, 5, 3], dark: 0.12, dk: 0.95 });
  g.box(3, 0, 3, 13, 25, 13, white);
  g.box(3, 0, 3, 13, 1, 13, col('#a7a39b'));
  windows(g, 3, 3, 13, 13, { y0: 0, floors: 5, floorH: 5, sill: 1, h: 3, w: 3, pitch: 4, margin: 1, style: 'home', seed: 71 });
  // coloured balcony fronts, alternating teal and wood
  for (let fl = 1; fl < 5; fl++) {
    const pc = fl % 2 ? col('#2fb3a6') : col('#c98b5a');
    g.box(4, fl * 5, 13, 12, fl * 5 + 1, 15, col('#dedbd4'));
    g.box(4, fl * 5 + 1, 14, 12, fl * 5 + 2, 15, pc);
  }
  // ground floor lobby glass and canopy
  pane(g, 0, 6, 10, 1, 4, 12, glow('#ffe6a8'));
  g.box(5, 4, 13, 11, 5, 15, col('#3b3f47'));
  // roof terrace: solar panels and a small garden
  parapet(g, 3, 3, 13, 13, 25, col('#dedbd4'));
  solarPanels(g, 4, 4, 8, 9, 25);
  roofGarden(g, 8, 8, 12, 12, 25, 72);
  // planters at street level
  bush(g, 2, 13, 0, 1, 2, 1, 73);
  bush(g, 13, 13, 0, 1, 2, 1, 74);
  return { g };
}

function mansardApartments(): Design {
  const g = lot(26);
  const stone = mat('#efe3cc', { seed: 80, cell: [2, 1, 2] });
  g.box(2, 0, 4, 14, 15, 12, stone);
  g.box(2, 0, 4, 14, 1, 12, col('#b3a68e'));
  g.box(2, 5, 4, 14, 6, 12, col('#e2d3b8'));
  g.box(1, 14, 3, 15, 15, 13, col(C.frame));
  windows(g, 2, 4, 14, 12, {
    y0: 0, floors: 3, floorH: 5, sill: 1, h: 3, w: 2, pitch: 3, style: 'home', seed: 81, inset: true,
    skip: (f, a, fl) => f === 0 && fl === 0 && a >= 6 && a <= 8,
  });
  frontDoor(g, 7, 2, 1, 4, 11, '#2c4a6e');
  g.box(6, 0, 12, 10, 1, 14, col('#cfc6b6'));
  // steep slate mansard with dormers
  const slate = mat('#5a6680', { seed: 82, cell: [1, 2, 1] });
  hipRoof(g, 2, 4, 14, 12, 15, slate, { overhang: 0, rise: 3, ridge: col('#48526a') });
  for (const x of [4, 7, 10]) {
    g.box(x, 15, 11, x + 2, 19, 13, col(C.frame));
    pane(g, 0, x, x + 2, 16, 18, 12, glow('#ffd890'));
    g.box(x, 19, 11, x + 2, 20, 13, slate);
  }
  for (const x of [4, 10]) {
    g.box(x, 15, 3, x + 2, 19, 5, col(C.frame));
    pane(g, 2, x, x + 2, 16, 18, 3, glow('#ffc86a'));
  }
  // chimneys
  g.box(3, 20, 7, 5, 24, 9, mat(C.brick, { seed: 83, cell: [1, 1, 1] }));
  g.box(11, 20, 7, 13, 24, 9, mat(C.brick, { seed: 84, cell: [1, 1, 1] }));
  // front garden railing with hedges
  fence(g, 'x', 1, 15, 14, 0, C.darkMetal, [[6, 10]]);
  bush(g, 2, 12, 0, 3, 2, 2, 85);
  bush(g, 11, 12, 0, 3, 2, 2, 86);
  return { g };
}

// ---------------------------------------------------------------- level 3: towers

function terracottaTower(): Design {
  const g = lot(76);
  const wall = mat('#e8a27a', { seed: 90, cell: [10, 5, 10], dark: 0.3, dk: 0.95, light: 0.2 });
  const floors = 12;
  const fh = 5;
  // lobby podium
  g.box(2, 0, 2, 14, 5, 14, col('#d8cfc2'));
  pane(g, 0, 4, 12, 1, 4, 13, glow('#ffe2a8'));
  g.box(3, 5, 3, 13, 5 + floors * fh, 13, wall);
  for (let fl = 1; fl <= floors; fl++) g.box(3, 5 + fl * fh - 1, 3, 13, 5 + fl * fh, 13, col('#f6e6d6'));
  windows(g, 3, 3, 13, 13, { y0: 5, floors: floors - 2, floorH: fh, sill: 1, h: 3, w: 2, pitch: 3, style: 'tower', seed: 91 });
  // top two floors set back with wraparound glass
  const top = 5 + (floors - 2) * fh;
  g.box(3, top, 3, 13, 5 + floors * fh, 13, 0);
  g.box(4, top, 4, 12, 5 + floors * fh, 12, col('#f6e6d6'));
  windows(g, 4, 4, 12, 12, { y0: top, floors: 2, floorH: fh, sill: 1, h: 3, w: 2, pitch: 2, margin: 0, style: 'tower', seed: 92 });
  // terrace railing on the setback and a roof garden on top
  parapet(g, 3, 3, 13, 13, top, col('#f6e6d6'));
  const roofY = 5 + floors * fh;
  roofGarden(g, 4, 4, 12, 12, roofY, 93);
  // vertical accent stripe on the front
  g.paintSolid(7, 5, 12, 9, top, 13, col('#c97f5a'));
  return { g };
}

function balconyTower(): Design {
  const g = lot(62);
  const wall = mat('#e2e6ea', { seed: 100, cell: [12, 5, 12], dark: 0.3, dk: 0.95 });
  const floors = 10;
  const fh = 5;
  g.box(2, 0, 4, 14, floors * fh + 1, 12, wall);
  g.box(2, 0, 4, 14, 1, 12, col('#8f949a'));
  windows(g, 2, 4, 14, 12, { y0: 0, floors, floorH: fh, sill: 1, h: 3, w: 2, pitch: 3, style: 'tower', seed: 101, skip: (f, a, fl) => f === 0 && fl === 0 && a >= 6 && a <= 8 });
  frontDoor(g, 7, 2, 1, 4, 11, '#2f6f6a');
  // stacked balconies front and back with glassy teal railings
  const rail = col('#7fd0c8');
  const slab = col('#cfd5da');
  for (let fl = 1; fl < floors; fl++) {
    const y = fl * fh;
    g.box(3, y, 12, 13, y + 1, 14, slab);
    g.box(3, y + 1, 13, 13, y + 2, 14, rail);
    g.box(3, y, 2, 13, y + 1, 4, slab);
    g.box(3, y + 1, 2, 13, y + 2, 3, rail);
  }
  // side fins in teal
  g.box(1, 1, 7, 2, floors * fh, 9, col('#2fb3a6'));
  g.box(14, 1, 7, 15, floors * fh, 9, col('#2fb3a6'));
  // roof: garden and a pergola
  const roofY = floors * fh + 1;
  roofGarden(g, 2, 4, 14, 12, roofY, 102);
  const post = col(C.wood);
  for (const x of [8, 12]) for (const z of [5, 10]) g.box(x, roofY + 1, z, x + 1, roofY + 4, z + 1, post);
  g.box(8, roofY + 4, 5, 13, roofY + 5, 11, col(C.wood, 0.9));
  return { g };
}

function weddingCakeTower(): Design {
  const g = lot(80);
  const fh = 5;
  const white = mat('#f4f2ee', { seed: 110, cell: [12, 5, 12], dark: 0.25, dk: 0.95 });
  const band = col('#8fb8e0');
  // three tiers, each with a planted terrace on its setback
  const tiers: Array<[number, number, number]> = [
    [2, 0, 5],
    [3, 5, 9],
    [4, 9, 14],
  ];
  for (const [inset, f0, f1] of tiers) {
    const y0 = f0 * fh;
    const y1 = f1 * fh;
    g.box(inset, y0, inset, 16 - inset, y1, 16 - inset, white);
    for (let fl = f0; fl < f1; fl++) g.box(inset, fl * fh, inset, 16 - inset, fl * fh + 1, 16 - inset, band);
    windows(g, inset, inset, 16 - inset, 16 - inset, {
      y0, floors: f1 - f0, floorH: fh, sill: 1, h: 3, w: 2, pitch: 3, style: 'tower', seed: 111 + f0,
      skip: (f, a, fl) => f0 === 0 && fl === 0 && f === 0 && a >= 6 && a <= 8,
    });
    if (f0 > 0) {
      // planters along the terrace edge below this tier
      const t = inset - 1;
      g.box(t, y0, t, 16 - t, y0 + 1, t + 1, mat(C.hedge, { seed: f0, cell: [1, 1, 1], dark: 0.3 }));
      g.box(t, y0, 15 - t, 16 - t, y0 + 1, 16 - t, mat(C.hedge, { seed: f0 + 1, cell: [1, 1, 1], dark: 0.3 }));
    }
  }
  frontDoor(g, 7, 2, 1, 4, 13, '#3a4a6a');
  g.box(6, 4, 14, 10, 5, 16, col('#3a4a6a'));
  roofGarden(g, 4, 4, 12, 12, 14 * fh, 112);
  antenna(g, 11, 5, 14 * fh + 1, 6);
  return { g };
}

function roundTower(): Design {
  const g = lot(72);
  const fh = 5;
  const floors = 13;
  const cx = 8;
  const cz = 8;
  // base podium in brick, round shaft in warm sand with balcony rings every floor
  g.box(2, 0, 2, 14, 4, 14, courses(C.brick, 1, 0.94));
  pane(g, 0, 4, 12, 1, 3, 13, glow('#ffd890'));
  frontDoor(g, 7, 2, 0, 3, 13, '#3d2f2a', false);
  cylinder(g, cx, cz, 5.6, 4, 4 + floors * fh, mat('#f0d9b0', { seed: 120, cell: [11, 5, 11], dark: 0.3, dk: 0.95 }));
  skinWindows(g, cx, cz, 5.6, 4, floors, fh, 1, 3, 'tower', 121, 14);
  for (let fl = 1; fl < floors; fl++) {
    const y = 4 + fl * fh;
    cylinder(g, cx, cz, 6.4, y, y + 1, col('#f7efe2'));
  }
  const roofY = 4 + floors * fh;
  cylinder(g, cx, cz, 5.6, roofY, roofY + 1, col('#7fbf5a'));
  cylinder(g, cx, cz, 4.5, roofY, roofY + 1, mat(C.grass, { seed: 122, cell: [2, 1, 2] }));
  smallTree(g, 6, 7, roofY + 1, 123, 2, '#5db84a');
  bush(g, 9, 9, roofY + 1, 2, 2, 1, 124);
  g.box(10, roofY + 1, 5, 11, roofY + 3, 6, col(C.metal));
  return { g };
}

export function resDesign(level: number, v: number): Design {
  if (level === 1) return [cottageClassic, cottageBungalow, cottageAFrame, cottageFarm][v]();
  if (level === 2) return [townhouses, brickApartments, modernApartments, mansardApartments][v]();
  return [terracottaTower, balconyTower, weddingCakeTower, roundTower][v]();
}
