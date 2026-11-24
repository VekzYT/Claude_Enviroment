// Service and utility buildings (placeholder while designs are written).
import type { BuildingType } from '../../core/types';
import { BUILDINGS } from '../../core/defs';
import { col } from './palette';
import type { Design } from './design';
import { VoxelGrid } from './voxel';

export function buildingDesign(type: BuildingType): Design {
  const n = (BUILDINGS[type]?.size ?? 1) * 16;
  const g = new VoxelGrid(n, 20, n);
  g.box(2, 0, 2, n - 2, 10, n - 2, col('#cccccc'));
  return { g };
}
