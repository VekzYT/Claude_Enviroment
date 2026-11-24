// OWNER: models. The look of everything that is not a plain building: vehicles, people and robots,
// wildlife, street furniture, trees, landmarks. All geometry is made in code and cached.
//
// Geometry convention (every model): non-indexed BufferGeometry with
//   position, normal         flat-shaded
//   color   (vec3, linear)   base colour
//   aGlow   (float 0..1)     how strongly this vertex lights up at night (windows, lamps, strips)
//   aPaint  (float 0..1)     how much the instance colour (vehicle paint, outfit tint) replaces `color`
// Built facing +z, standing on y = 0, centred on x / z.
import * as THREE from 'three';
import { CRITTERS, LANDMARKS, PROPS, VEHICLES } from '../../core/defs';
import type { CritterKind, LandmarkId, PropKind, VehicleKind } from '../../core/types';

export type Vec3 = [number, number, number];

export interface WheelMount {
  /** Wheel centre in model space. */
  pos: Vec3;
  radius: number;
  /** Turns with the steering (front wheels). */
  steers: boolean;
}

export interface VehicleModel {
  /** The body, without wheels. Sized from core/defs VEHICLES: underside at y = ride (the boat's hull
   *  sits in the water: its waterline is at y = 0). */
  geometry: THREE.BufferGeometry;
  /** One wheel of radius 1 centred on the origin with its axle along x, or null for the hover-bike
   *  and the boat. The renderer instances it at each mount, scaled by the mount's radius, spinning
   *  with Vehicle.wheelSpin and turning with Vehicle.wheelSteer. */
  wheel: THREE.BufferGeometry | null;
  wheels: WheelMount[];
  /** Where the driver's hips sit, in model space (for drawing a rider and for the camera). */
  seat: Vec3;
  /** True when the driver is out in the open (bike, buggy, boat): the renderer draws them seated. */
  openRider: boolean;
  /** Light and effect anchor points in model space. */
  headlights: Vec3[];
  taillights: Vec3[];
  /** Where the roof light bar is (police vehicles), else null. */
  lightBar: Vec3 | null;
  /** Hover emitters under the bike; empty for everything else. */
  hoverPads: Vec3[];
  /** Where nitro flame comes out (exhausts; the boat's jet). */
  thrusters: Vec3[];
}

/** The model for a vehicle kind. PLACEHOLDER: a box with box wheels. */
export function vehicleModel(kind: VehicleKind): VehicleModel {
  const d = VEHICLES[kind];
  const g = box(d.w, d.h, d.l, 0xffffff, 1);
  g.translate(0, d.ride + d.h / 2, 0);
  const wheels: WheelMount[] = [];
  if (d.wheels > 0) {
    const rows = d.wheels / 2;
    for (let r = 0; r < rows; r++) {
      const z = rows === 1 ? 0 : d.l * 0.34 - (r * d.l * 0.68) / (rows - 1);
      for (const side of [1, -1]) wheels.push({ pos: [side * (d.w / 2 - 0.12), d.wheelR, z], radius: d.wheelR, steers: r === 0 });
    }
  }
  const lightY = d.ride + d.h * 0.4;
  return {
    geometry: g,
    wheel: d.wheels > 0 ? box(0.24, 2, 2, 0x1c1c1c, 0) : null,
    wheels,
    seat: [0, d.ride + d.h * 0.4, 0],
    openRider: kind === 'bike' || kind === 'buggy' || kind === 'boat',
    headlights: [[-d.w * 0.35, lightY, d.l / 2], [d.w * 0.35, lightY, d.l / 2]],
    taillights: [[-d.w * 0.35, lightY, -d.l / 2], [d.w * 0.35, lightY, -d.l / 2]],
    lightBar: kind === 'police' || kind === 'ranger' || kind === 'swat' ? [0, d.ride + d.h, 0] : null,
    hoverPads: kind === 'bike' ? [[0, d.ride, d.l * 0.3], [0, d.ride, -d.l * 0.3]] : [],
    thrusters: [[0, d.ride + d.h * 0.3, -d.l / 2]],
  };
}

export type CharPart = 'torso' | 'head' | 'armL' | 'armR' | 'legL' | 'legR';
export const CHAR_PARTS: CharPart[] = ['torso', 'head', 'armL', 'armR', 'legL', 'legR'];

export interface CharacterModel {
  /** Each part's geometry is in its own space with the joint at the origin; `pivot` places the
   *  joint in character space (feet at y = 0, facing +z). */
  parts: Record<CharPart, { geometry: THREE.BufferGeometry; pivot: Vec3 }>;
  height: number;
}

/** Body types 0..CHARACTER_TYPES-1 (core/defs): 0 the operative (player), 1-3 residents, 4 service robot, 5 police. PLACEHOLDER: boxes. */
export function characterModel(type: number): CharacterModel {
  void type;
  const limb = (w: number, h: number, d: number, c: number, paint: number) => {
    const g = box(w, h, d, c, paint);
    g.translate(0, -h / 2, 0);
    return g;
  };
  const torso = box(0.5, 0.65, 0.28, 0xffffff, 1);
  torso.translate(0, 0.325, 0);
  const head = box(0.34, 0.34, 0.34, 0xe0b090, 0);
  head.translate(0, 0.17, 0);
  return {
    height: 1.8,
    parts: {
      torso: { geometry: torso, pivot: [0, 0.8, 0] },
      head: { geometry: head, pivot: [0, 1.46, 0] },
      armL: { geometry: limb(0.16, 0.62, 0.16, 0xffffff, 1), pivot: [0.33, 1.42, 0] },
      armR: { geometry: limb(0.16, 0.62, 0.16, 0xffffff, 1), pivot: [-0.33, 1.42, 0] },
      legL: { geometry: limb(0.2, 0.8, 0.2, 0x333340, 0), pivot: [0.13, 0.8, 0] },
      legR: { geometry: limb(0.2, 0.8, 0.2, 0x333340, 0), pivot: [-0.13, 0.8, 0] },
    },
  };
}

export type CharAnim = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'sit' | 'ride' | 'down' | 'getup' | 'pulse' | 'cower' | 'talk' | 'swim';

/** Joint rotations in radians, as [x, y, z] Euler angles (order XYZ) about each part's pivot. */
export interface CharacterPose {
  /** Raise (or lower) the whole body. */
  y: number;
  /** Tip the whole body forward about the feet. */
  lean: number;
  torso: Vec3;
  head: Vec3;
  armL: Vec3;
  armR: Vec3;
  legL: Vec3;
  legR: Vec3;
}

export function blankPose(): CharacterPose {
  return { y: 0, lean: 0, torso: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 0], armR: [0, 0, 0], legL: [0, 0, 0], legR: [0, 0, 0] };
}

/**
 * The pose for an animation. `phase` advances with distance walked (radians, one stride = 2 PI);
 * `t` is seconds since the animation started. Writes into `out` and returns it. PLACEHOLDER: a walk swing.
 */
export function poseCharacter(anim: CharAnim, phase: number, t: number, out: CharacterPose): CharacterPose {
  void t;
  const s = anim === 'walk' || anim === 'run' ? Math.sin(phase) * (anim === 'run' ? 0.9 : 0.5) : 0;
  out.y = 0;
  out.lean = anim === 'run' ? 0.15 : 0;
  out.torso[0] = out.torso[1] = out.torso[2] = 0;
  out.head[0] = out.head[1] = out.head[2] = 0;
  out.armL[0] = s;
  out.armR[0] = -s;
  out.legL[0] = -s;
  out.legR[0] = s;
  out.armL[1] = out.armL[2] = out.armR[1] = out.armR[2] = out.legL[1] = out.legL[2] = out.legR[1] = out.legR[2] = 0;
  return out;
}

export interface PropModel {
  geometry: THREE.BufferGeometry;
  /** True for the sized kinds: built as a 1 x 1 x 1 m unit (base at y = 0) and scaled to w / h / d. */
  unit: boolean;
  /** Where its lamp is, if it has one (lamps, traffic lights, signs), in model space. */
  light: Vec3 | null;
}

/** PLACEHOLDER: a box of the prop's nominal size. */
export function propModel(kind: PropKind): PropModel {
  const d = PROPS[kind];
  const g = d.sized ? box(1, 1, 1, 0x9aa3ad, 0) : box(Math.max(0.2, d.r * 2), d.h, Math.max(0.2, d.r * 2), 0x9aa3ad, 0);
  g.translate(0, d.sized ? 0.5 : d.h / 2, 0);
  return { geometry: g, unit: d.sized, light: kind === 'lamp' ? [0, d.h, 0] : null };
}

export interface CritterModel {
  /** The body, facing +z, on y = 0. */
  geometry: THREE.BufferGeometry;
  /** Parts that swing (wings, a tail, a jaw): each rotates about `axis` through `pivot` by
   *  sin(phase) * amount radians. The renderer drives phase from Critter.anim. */
  flaps: Array<{ geometry: THREE.BufferGeometry; pivot: Vec3; axis: 'x' | 'y' | 'z'; amount: number }>;
}

/** Wildlife. PLACEHOLDER: a box. */
export function critterModel(kind: CritterKind): CritterModel {
  const d = CRITTERS[kind];
  const g = box(d.l * 0.35, d.l * 0.3, d.l, 0x5a7a4a, 0);
  g.translate(0, d.l * 0.15, 0);
  return { geometry: g, flaps: [] };
}

/** A unique building at the size given in core/defs LANDMARKS. PLACEHOLDER: a box. */
export function landmarkModel(id: LandmarkId): { geometry: THREE.BufferGeometry } {
  const d = LANDMARKS[id];
  const g = box(d.w, d.h, d.d, 0xf0eee6, 0);
  g.translate(0, d.h / 2, 0);
  return { geometry: g };
}

/** Build every model now (call while a loading screen is up) so nothing stalls a frame later. */
export function warmModels(): void {}

function box(w: number, h: number, d: number, color: number, paint: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  const n = g.getAttribute('position').count;
  const c = new THREE.Color(color);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aPaint', new THREE.BufferAttribute(new Float32Array(n).fill(paint), 1));
  g.deleteAttribute('uv');
  return g;
}
