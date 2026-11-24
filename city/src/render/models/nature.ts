// Tree clumps for wooded tiles. Forests cover large parts of the map, so these stay light
// (a few hundred triangles) while still reading as a little grove: round crowns, tiered pines, bushes.
import { hash01 } from '../../core/rng';
import { col } from './palette';
import { C, bush, crown, smallPine } from './shapes';
import { VoxelGrid } from './voxel';

const LEAVES = ['#5db84a', '#4fae4c', '#73c44f', '#62b85a'];

function roundTree(g: VoxelGrid, x: number, z: number, size: number, seed: number, hex: string): void {
  const trunkH = size + 1 + (seed % 2);
  g.box(x, 0, z, x + 1, trunkH, z + 1, col(C.trunk, 0.95 + (seed % 3) * 0.04));
  crown(g, x, z, trunkH, size, size + 2, hex, seed);
}

/** Variant 1 deciduous, 2 conifers, 3 mixed with bushes. */
export function treeGrid(variant: number): VoxelGrid {
  const g = new VoxelGrid(16, 16, 16);
  const v = Math.max(1, Math.min(3, variant | 0));
  if (v === 1) {
    roundTree(g, 5, 5, 3, 11, LEAVES[0]);
    roundTree(g, 11, 10, 2, 12, LEAVES[2]);
    roundTree(g, 4, 12, 2, 13, LEAVES[1]);
  } else if (v === 2) {
    smallPine(g, 5, 4, 0, 21, 10, C.pine);
    smallPine(g, 11, 8, 0, 22, 8, '#2a7d4f');
    smallPine(g, 5, 11, 0, 23, 7, C.pine);
    smallPine(g, 12, 13, 0, 24, 5, '#3a945c');
  } else {
    roundTree(g, 10, 5, 3, 31, LEAVES[3]);
    smallPine(g, 4, 9, 0, 32, 9, C.pine);
    bush(g, 9, 11, 0, 3, 2, 2, 33, '#4aa647');
    bush(g, 12, 12, 0, 2, 2, 1, 34, '#5cb84e');
    // a few wild flowers in the grass
    const petals = ['#ffd84a', '#ffffff', '#ff8fb0'];
    for (let k = 0; k < 4; k++) {
      const x = 2 + Math.floor(hash01(k, 3, 35) * 12);
      const z = 2 + Math.floor(hash01(k, 4, 35) * 12);
      if (g.get(x, 0, z) === 0) g.set(x, 0, z, col(petals[k % petals.length]));
    }
  }
  return g;
}
