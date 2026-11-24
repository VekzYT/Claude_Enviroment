// A model design before it becomes geometry: the voxel grid plus things that are not voxels on the
// standard grid (vehicles at a finer scale, smoke points, a spinning rotor). finish() bakes it into
// the ModelParts the world renderer consumes.
import * as THREE from 'three';
import { MeshAcc, VPT, VoxelGrid, meshGrid, meshLot } from './voxel';

export interface PropPlacement {
  mesh: MeshAcc;
  /** Position in grid voxels (x, z: centre of the prop; y: its base row). */
  x: number;
  z: number;
  y?: number;
  /** Quarter turns around y (0 = prop front faces +z). */
  rot: number;
  /** Height of the prop in world units (for the model height). */
  h?: number;
}

export interface SpinnerDesign {
  grid: VoxelGrid;
  /** The pivot inside the spinner's grid, in grid units. */
  centre: [number, number, number];
  /** The pivot inside the model's grid, in grid units. */
  at: [number, number, number];
  axis: 'x' | 'y' | 'z';
  speed: number;
  /** Voxels per world unit of the spinner's grid (default VPT). */
  vpt?: number;
}

export interface Design {
  g: VoxelGrid;
  /** Chimney tops in grid units. */
  smoke?: Array<[number, number, number]>;
  props?: PropPlacement[];
  spinner?: SpinnerDesign;
}

export interface Finished {
  body: THREE.BufferGeometry;
  glow: THREE.BufferGeometry | null;
  smoke?: THREE.Vector3[];
  spinner?: { geometry: THREE.BufferGeometry; pivot: THREE.Vector3; axis: 'x' | 'y' | 'z'; speed: number };
  height: number;
  triangles: number;
}

export function finish(d: Design): Finished {
  const g = d.g;
  const acc = meshLot(g);
  const ox = g.nx / 2;
  const oz = g.nz / 2;
  let height = g.topY() / VPT;
  for (const p of d.props ?? []) {
    acc.append(p.mesh, (p.x - ox) / VPT, (p.y ?? 0) / VPT, (p.z - oz) / VPT, p.rot);
    if (p.h !== undefined) height = Math.max(height, (p.y ?? 0) / VPT + p.h);
  }
  const parts = acc.toGeometries();
  const out: Finished = { body: parts.body, glow: parts.glow, height, triangles: acc.triangles };
  if (d.smoke && d.smoke.length) {
    out.smoke = d.smoke.map(([x, y, z]) => new THREE.Vector3((x - ox) / VPT, y / VPT, (z - oz) / VPT));
  }
  if (d.spinner) {
    const s = d.spinner;
    const vpt = s.vpt ?? VPT;
    const sacc = new MeshAcc();
    meshGrid(s.grid, sacc, 1 / vpt, s.centre[0], s.centre[1], s.centre[2]);
    const sg = sacc.toGeometries();
    const pivot = new THREE.Vector3((s.at[0] - ox) / VPT, s.at[1] / VPT, (s.at[2] - oz) / VPT);
    out.spinner = { geometry: sg.body, pivot, axis: s.axis, speed: s.speed };
    out.triangles += sacc.triangles;
    // the rotor reaches above the hub
    const reach = Math.max(s.grid.nx, s.grid.ny, s.grid.nz) / 2 / vpt;
    height = Math.max(height, pivot.y + reach);
    out.height = height;
  }
  return out;
}
