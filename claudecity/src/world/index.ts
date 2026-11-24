// OWNER: world. Generates Claude City from a seed and answers route questions.
// (Point, collider and ray queries live in core/query.ts and work on any CityMap.)
import { fixtureCity } from '../core/fixture';
import type { CityMap } from '../core/types';

/** The whole city for a seed. Same seed, same city. PLACEHOLDER: returns the small test city. */
export function generateCity(seed: number): CityMap {
  return fixtureCity(seed);
}

/**
 * Shortest drive from one point to another along the roads. Writes the node ids to pass through
 * into `out` (from index 0) and returns how many, or 0 if there is no way. PLACEHOLDER: returns 0.
 */
export function findRoute(map: CityMap, ax: number, az: number, bx: number, bz: number, out: number[]): number {
  void map; void ax; void az; void bx; void bz; void out;
  return 0;
}

/** The name of the road nearest a point (for the HUD), or '' away from any road. PLACEHOLDER. */
export function streetNameAt(map: CityMap, x: number, z: number): string {
  void map; void x; void z;
  return '';
}
