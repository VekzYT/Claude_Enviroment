// A few chunky voxel clouds drifting far below the slab, so the city reads as a floating island.
// One static merged mesh that slowly turns around the map centre: a single draw, no per-frame work
// beyond one rotation.
import * as THREE from 'three';
import { makeRng } from '../core/rng';
import { MeshBuilder } from './util';

export class CloudLayer {
  readonly mesh: THREE.Mesh;
  private readonly mat: THREE.MeshLambertMaterial;

  constructor() {
    // soft and a little see-through, mostly self-lit so they read as puffs rather than boxes
    this.mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      emissive: new THREE.Color('#5a6474'),
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.mesh.name = 'clouds';
    this.mesh.renderOrder = -10;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
  }

  /** Scatter clouds around a map of the given size. */
  build(size: number): void {
    const rng = makeRng(size * 31 + 7);
    const b = new MeshBuilder();
    const count = 16;
    for (let c = 0; c < count; c++) {
      const ang = (c / count) * Math.PI * 2 + rng() * 0.3;
      const dist = size * (0.45 + rng() * 0.75);
      const cx = Math.cos(ang) * dist;
      const cz = Math.sin(ang) * dist;
      const cy = -8 - rng() * 10;
      const s = 0.9 + rng() * 1.3;
      const blocks = 5 + ((rng() * 4) | 0);
      for (let k = 0; k < blocks; k++) {
        const w = s * (1.2 + rng() * 1.6);
        const d = s * (1 + rng() * 1.2);
        const h = s * (0.5 + rng() * 0.6);
        const ox = (rng() - 0.5) * s * 3.2;
        const oz = (rng() - 0.5) * s * 2.2;
        const oy = rng() * s * 0.5;
        const shade = 0.93 + rng() * 0.07;
        b.box(cx + ox - w / 2, cy + oy, cz + oz - d / 2, cx + ox + w / 2, cy + oy + h, cz + oz + d / 2, shade, shade, shade, 0, true);
      }
    }
    this.mesh.geometry.dispose();
    this.mesh.geometry = b.build(false, false);
    this.mesh.position.set(size / 2, 0, size / 2);
  }

  update(dt: number): void {
    this.mesh.rotation.y += dt * 0.006;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
