// OWNER: city-render. Draws the built world that never moves: roads, junctions, sidewalks, plazas and
// lots, bridges and boardwalks, ramps, buildings, landmarks, and every prop that is not `nature`.
// The soft ground, the water and the vegetation are src/render/terrain. Lives inside the scene that
// src/render sets up and follows its lighting (RenderEnv).
import * as THREE from 'three';
import type { CityMap, GameState, Quality, RenderEnv } from '../../core/types';

export interface CityView {
  /** Add this to the scene. */
  readonly object: THREE.Object3D;
  /**
   * Once per frame: cull and swap detail for the camera, follow the lighting (window glow, lamps,
   * wet streets), animate signs, and show knocked-over props from game.propsDown.
   */
  update(dt: number, camera: THREE.PerspectiveCamera, env: RenderEnv, game: GameState | null): void;
  setQuality(quality: Quality): void;
  /** A top-down picture of the whole map (city and wilderness, roads, trails, water), `size` pixels
   *  square, north up (for the minimap and the map screen). */
  minimap(size: number): HTMLCanvasElement;
  dispose(): void;
}

/** PLACEHOLDER: a grey box per building part. */
export function createCityView(map: CityMap, quality: Quality): CityView {
  void quality;
  const object = new THREE.Group();
  let count = 0;
  for (const b of map.buildings) count += b.parts.length;
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xd8d4c8 }), Math.max(1, count));
  const m = new THREE.Matrix4();
  let i = 0;
  for (const b of map.buildings) {
    for (const p of b.parts) {
      m.makeScale(p.x1 - p.x0, p.y1 - p.y0, p.z1 - p.z0);
      m.setPosition((p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, (p.z0 + p.z1) / 2);
      boxes.setMatrixAt(i++, m);
    }
  }
  boxes.count = i;
  object.add(boxes);
  return {
    object,
    update() {},
    setQuality() {},
    minimap(size) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      return c;
    },
    dispose() {},
  };
}
