// OWNER: terrain. Draws the land and everything that grows on it: the soft ground (grass, park lawn,
// sand, dirt trails, forest floor, swamp), the water (sea, canals, lake, bayou), the shoreline, and
// vegetation: the `nature` props (trees, palms, cypress, glow trees, rocks, logs...) plus undergrowth
// scattered by rule (ferns, reeds, grass tufts, flowers), and the forest's glow at night.
// The hard surfaces (roads, sidewalks, plazas, lots, bridges, boardwalks) are src/render/city.
import * as THREE from 'three';
import type { CityMap, GameState, Quality, RenderEnv } from '../../core/types';

export interface TerrainView {
  /** Add this to the scene. */
  readonly object: THREE.Object3D;
  /** Once per frame: cull and swap detail for the camera, follow the lighting, animate water and leaves. */
  update(dt: number, camera: THREE.PerspectiveCamera, env: RenderEnv, game: GameState | null): void;
  setQuality(quality: Quality): void;
  dispose(): void;
}

/** PLACEHOLDER: one flat green ground and one flat blue sheet. */
export function createTerrainView(map: CityMap, quality: Quality): TerrainView {
  void quality;
  const object = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(map.size, map.size), new THREE.MeshLambertMaterial({ color: 0x5f8a55 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(map.size / 2, -0.05, map.size / 2);
  object.add(ground);
  return { object, update() {}, setQuality() {}, dispose() {} };
}
