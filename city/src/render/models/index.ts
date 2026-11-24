// OWNER: models agent. Voxel art for everything that stands on the map. Keep these signatures.
//
// Coordinates: 1 world unit = 1 tile. A w×h-tile model is centred on the origin in x/z, spans
// [-w/2, w/2] × [-h/2, h/2], and stands on y = 0. Its front (door, sign) faces +z when rot = 0.
// The world renderer rotates by rot × 90° around y and places the centre over the footprint.
import * as THREE from 'three';
import type { BuildingType } from '../../core/types';
import { ZoneType } from '../../core/types';

export interface ModelParts {
  /** Opaque body with vertex colours (attribute `color`) and flat normals. */
  body: THREE.BufferGeometry;
  /** Windows, lamps and signs: drawn with a material that glows at night. Vertex colours are the lit colour. */
  glow: THREE.BufferGeometry | null;
  /** Local points where smoke or steam rises (chimneys). */
  smoke?: THREE.Vector3[];
  /** A part that spins (wind turbine rotor). Geometry is centred on its own pivot. */
  spinner?: { geometry: THREE.BufferGeometry; pivot: THREE.Vector3; axis: 'x' | 'y' | 'z'; speed: number };
  /** Height of the model's top in world units (for floating status icons). */
  height: number;
}

/** Distinct designs per zone and level. Tiles pick one with `variant % ZONE_VARIANTS`. */
export const ZONE_VARIANTS = 4;

/** A developed lot (1×1). level is 1..3. Results are cached: same arguments return the same object. */
export function zoneModel(_zone: ZoneType, level: number, _variant: number): ModelParts {
  return placeholder(0.7, 0.4 + level * 0.6);
}

/** A placed service or utility building. Cached. */
export function buildingModel(_type: BuildingType): ModelParts {
  return placeholder(1.6, 1);
}

/** A clump of trees on a 1×1 tile, variant 1..3. Cached. */
export function treeModel(_variant: number): ModelParts {
  return placeholder(0.4, 0.8);
}

/** A car about 0.3 long, front facing +z, sitting on y = 0. variant picks the paint. Cached. */
export const CAR_VARIANTS = 6;
export function carModel(_variant: number): ModelParts {
  return placeholder(0.15, 0.12);
}

function placeholder(width: number, height: number): ModelParts {
  const body = new THREE.BoxGeometry(width, height, width).translate(0, height / 2, 0).toNonIndexed();
  const n = body.getAttribute('position').count;
  body.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0.8), 3));
  return { body, glow: null, height };
}
