// Catalogues: vehicles, paints, districts, props, character looks and the colour theme.
// Worldgen, sim, render, models and ui all read these.

import type { BuildingStyle, DistrictId, LandmarkId, PropKind, VehicleKind } from './types';

// ---------------------------------------------------------------------------------------------
// Theme. A warm, optimistic future: cream ceramic and clay-orange against deep ink, lit by
// coral, teal and violet light. Not a rainy dystopia.
// ---------------------------------------------------------------------------------------------

export const THEME = {
  clay: '#d97757', // the signature colour: accents, the player's first car, Claude's voice
  cream: '#f0eee6',
  ink: '#141413',
  slate: '#2b2a27',
  sand: '#e8dcc4',
  teal: '#2fc4b2',
  violet: '#8f7cf5',
  coral: '#ff7a59',
  gold: '#f2b84b',
  sky: '#8ecbf0',
  danger: '#e5484d',
  good: '#3fb97a',
} as const;

/** Neon / hologram colours signs and strips may use. */
export const NEONS = ['#ff7a59', '#2fc4b2', '#8f7cf5', '#f2b84b', '#ff5fa2', '#59b7ff', '#f0eee6'] as const;

// ---------------------------------------------------------------------------------------------
// Vehicles. Everything in Claude City hovers: no wheels, a soft glow underneath.
// ---------------------------------------------------------------------------------------------

export interface VehicleDef {
  kind: VehicleKind;
  name: string;
  blurb: string;
  /** Length (along forward), width, height of the body, metres. */
  l: number;
  w: number;
  h: number;
  /** Gap between the ground and the underside when hovering at rest. */
  hover: number;
  mass: number;
  /** m/s. */
  topSpeed: number;
  reverseSpeed: number;
  /** m/s^2 at a standstill (tapers to 0 at top speed). */
  accel: number;
  brake: number;
  /** Sideways acceleration it can hold before it starts to slide, m/s^2. */
  grip: number;
  /** Fastest it can turn at low speed, rad/s. */
  turn: number;
  /** 0 planted .. 1 loves to slide. */
  drift: number;
  /** Top-speed and acceleration multiplier while boosting. */
  boost: number;
  health: number;
  seats: number;
  /** Price at a garage (0 = cannot be bought). */
  price: number;
  /** How common it is in traffic (0 = never). */
  traffic: number;
}

export const VEHICLES: Record<VehicleKind, VehicleDef> = {
  pod: { kind: 'pod', name: 'Pebble', blurb: 'A little city pod. Slow, nimble, hard to dislike.', l: 3.0, w: 1.7, h: 1.5, hover: 0.3, mass: 700, topSpeed: 30, reverseSpeed: 9, accel: 9, brake: 20, grip: 16, turn: 2.6, drift: 0.2, boost: 1.25, health: 80, seats: 2, price: 1500, traffic: 5 },
  sedan: { kind: 'sedan', name: 'Sonnet', blurb: 'The everyday four-seater. Balanced in all things.', l: 4.6, w: 1.9, h: 1.4, hover: 0.3, mass: 1200, topSpeed: 38, reverseSpeed: 10, accel: 10, brake: 22, grip: 15, turn: 2.2, drift: 0.3, boost: 1.3, health: 100, seats: 4, price: 4000, traffic: 6 },
  coupe: { kind: 'coupe', name: 'Stanza', blurb: 'Low, quick and happy to go sideways.', l: 4.4, w: 1.9, h: 1.2, hover: 0.25, mass: 1100, topSpeed: 52, reverseSpeed: 11, accel: 16, brake: 28, grip: 17, turn: 2.4, drift: 0.55, boost: 1.35, health: 90, seats: 2, price: 12000, traffic: 2 },
  super: { kind: 'super', name: 'Opus GT', blurb: 'The fastest thing on the grid. Mind the corners.', l: 4.7, w: 2.0, h: 1.1, hover: 0.2, mass: 1150, topSpeed: 70, reverseSpeed: 12, accel: 24, brake: 34, grip: 20, turn: 2.3, drift: 0.45, boost: 1.4, health: 90, seats: 2, price: 60000, traffic: 0.4 },
  van: { kind: 'van', name: 'Courier', blurb: 'A tall delivery van. Carries anything, hurries for no one.', l: 5.4, w: 2.1, h: 2.3, hover: 0.35, mass: 2000, topSpeed: 30, reverseSpeed: 8, accel: 7, brake: 18, grip: 12, turn: 1.8, drift: 0.15, boost: 1.2, health: 140, seats: 2, price: 5000, traffic: 3 },
  hauler: { kind: 'hauler', name: 'Atlas', blurb: 'A cargo hauler. Unstoppable once it gets going.', l: 8.5, w: 2.6, h: 3.2, hover: 0.45, mass: 6000, topSpeed: 26, reverseSpeed: 6, accel: 5, brake: 14, grip: 10, turn: 1.2, drift: 0.05, boost: 1.15, health: 220, seats: 2, price: 9000, traffic: 1.5 },
  bike: { kind: 'bike', name: 'Haiku', blurb: 'A hover bike: seventeen syllables of speed.', l: 2.2, w: 0.8, h: 1.2, hover: 0.3, mass: 250, topSpeed: 58, reverseSpeed: 6, accel: 22, brake: 30, grip: 19, turn: 3.0, drift: 0.35, boost: 1.4, health: 50, seats: 1, price: 8000, traffic: 1.5 },
  patrol: { kind: 'patrol', name: 'Sentinel', blurb: 'A security interceptor. Not for sale.', l: 4.8, w: 2.0, h: 1.4, hover: 0.3, mass: 1500, topSpeed: 60, reverseSpeed: 12, accel: 20, brake: 30, grip: 19, turn: 2.4, drift: 0.3, boost: 1.3, health: 150, seats: 2, price: 0, traffic: 0 },
};
export const VEHICLE_KINDS = Object.keys(VEHICLES) as VehicleKind[];

/** Body paints (Vehicle.paint indexes this). 0 is the clay orange of the player's first car. */
export const PAINTS = ['#d97757', '#f0eee6', '#2b2a27', '#2fc4b2', '#8f7cf5', '#f2b84b', '#59b7ff', '#e5484d', '#9aa3ad', '#3fb97a', '#ff5fa2', '#c9b58f'] as const;

// ---------------------------------------------------------------------------------------------
// Districts
// ---------------------------------------------------------------------------------------------

export interface DistrictDef {
  id: DistrictId;
  name: string;
  blurb: string;
  /** Main facade styles, most common first. */
  styles: BuildingStyle[];
  /** Typical building heights, metres. */
  minH: number;
  maxH: number;
  /** Wall tints the facades draw from, and the district's light colour at night. */
  walls: string[];
  neon: string;
  /** 0..1: how many trees and planters line its streets. */
  green: number;
  /** 0..1: how busy its streets are (traffic and people). */
  busy: number;
}

export const DISTRICTS: Record<DistrictId, DistrictDef> = {
  core: { id: 'core', name: 'Opus Core', blurb: 'Downtown. Glass and ceramic towers around the Spire.', styles: ['glass', 'ceramic', 'neon'], minH: 70, maxH: 300, walls: ['#e9e4d8', '#cfd8dc', '#b7c4cc', '#f0eee6'], neon: '#59b7ff', green: 0.35, busy: 1 },
  strip: { id: 'strip', name: 'Sonnet Strip', blurb: 'Arcades, hotels and holograms. It never dims.', styles: ['neon', 'glass', 'ceramic'], minH: 24, maxH: 110, walls: ['#2b2a27', '#3a3350', '#402b3a', '#1f2a33'], neon: '#ff5fa2', green: 0.25, busy: 0.9 },
  heights: { id: 'heights', name: 'Haiku Heights', blurb: 'Quiet terraces, roof gardens and small shops.', styles: ['residential', 'ceramic', 'brick'], minH: 10, maxH: 42, walls: ['#f0eee6', '#e8dcc4', '#d9c7a8', '#c9d6c3'], neon: '#f2b84b', green: 0.9, busy: 0.45 },
  harbor: { id: 'harbor', name: 'Fable Harbor', blurb: 'Docks, cranes and warehouses on the bay.', styles: ['concrete', 'brick', 'ceramic'], minH: 8, maxH: 36, walls: ['#8f969c', '#a69a8a', '#6f7a80', '#b3a58f'], neon: '#2fc4b2', green: 0.1, busy: 0.5 },
  park: { id: 'park', name: 'Mythos Park', blurb: 'Lawns, a lake and the research campus domes.', styles: ['ceramic', 'glass', 'residential'], minH: 8, maxH: 48, walls: ['#f0eee6', '#dfe8e3', '#cfe0d6'], neon: '#3fb97a', green: 1, busy: 0.35 },
  market: { id: 'market', name: 'Tokenside', blurb: 'The old market quarter: narrow streets, stalls and signs.', styles: ['brick', 'residential', 'neon'], minH: 9, maxH: 30, walls: ['#b5694a', '#c98a5e', '#a8553d', '#d9b38c', '#8a5a44'], neon: '#f2b84b', green: 0.3, busy: 0.8 },
};
/** The order used by CityMap.district cells. */
export const DISTRICT_IDS = ['core', 'strip', 'heights', 'harbor', 'park', 'market'] as const satisfies readonly DistrictId[];

// ---------------------------------------------------------------------------------------------
// Landmarks: the one-off buildings. The models module builds each at exactly this size, centred on
// its footprint with its base at y = 0 and its entrance facing +z; worldgen reserves the footprint.
// ---------------------------------------------------------------------------------------------

export interface LandmarkDef {
  id: LandmarkId;
  name: string;
  /** Footprint along x and z, and height, metres. */
  w: number;
  d: number;
  h: number;
  district: DistrictId;
}

export const LANDMARKS: Record<LandmarkId, LandmarkDef> = {
  spire: { id: 'spire', name: 'The Spire', w: 48, d: 48, h: 380, district: 'core' },
  arena: { id: 'arena', name: 'Meridian Arena', w: 110, d: 90, h: 36, district: 'strip' },
  observatory: { id: 'observatory', name: 'Mythos Observatory', w: 44, d: 44, h: 30, district: 'park' },
  lighthouse: { id: 'lighthouse', name: 'Fable Light', w: 12, d: 12, h: 52, district: 'harbor' },
  gate: { id: 'gate', name: 'Tokenside Gate', w: 34, d: 6, h: 18, district: 'market' },
  wheel: { id: 'wheel', name: 'The Great Wheel', w: 72, d: 16, h: 84, district: 'strip' },
};

// ---------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------

export interface PropDef {
  /** Blocks vehicles and people. Becomes a collider (a square of half-size `r`, or w x d when sized). */
  solid: boolean;
  /** A vehicle going fast enough knocks it over (game.propsDown) instead of stopping dead. */
  breakable: boolean;
  /** Collision half-size at ground level, metres (also the cull radius). */
  r: number;
  /** Nominal height, metres. */
  h: number;
  /** Each instance carries its own w / h / d. */
  sized: boolean;
}

export const PROPS: Record<PropKind, PropDef> = {
  lamp: { solid: true, breakable: true, r: 0.2, h: 7, sized: false },
  traffic_light: { solid: true, breakable: true, r: 0.2, h: 6, sized: false },
  tree: { solid: true, breakable: false, r: 0.35, h: 7, sized: false },
  palm: { solid: true, breakable: false, r: 0.3, h: 9, sized: false },
  bush: { solid: false, breakable: false, r: 0.8, h: 1, sized: false },
  planter: { solid: true, breakable: false, r: 0.8, h: 0.8, sized: false },
  bench: { solid: true, breakable: true, r: 0.8, h: 0.9, sized: false },
  bin: { solid: true, breakable: true, r: 0.35, h: 1, sized: false },
  bollard: { solid: true, breakable: false, r: 0.2, h: 0.9, sized: false },
  hydrant: { solid: true, breakable: true, r: 0.25, h: 0.8, sized: false },
  street_sign: { solid: true, breakable: true, r: 0.12, h: 3, sized: false },
  bus_stop: { solid: true, breakable: true, r: 1.6, h: 2.6, sized: false },
  charger: { solid: true, breakable: false, r: 0.5, h: 2.2, sized: false },
  vending: { solid: true, breakable: true, r: 0.6, h: 2, sized: false },
  holo_ad: { solid: true, breakable: false, r: 0.5, h: 8, sized: false },
  billboard: { solid: true, breakable: false, r: 0.4, h: 12, sized: true },
  neon_sign: { solid: false, breakable: false, r: 2, h: 3, sized: true },
  stall: { solid: true, breakable: true, r: 1.4, h: 2.6, sized: false },
  fountain: { solid: true, breakable: false, r: 4, h: 2.5, sized: false },
  statue: { solid: true, breakable: false, r: 1.5, h: 6, sized: false },
  barrier: { solid: true, breakable: false, r: 0.4, h: 1, sized: true },
  fence: { solid: true, breakable: false, r: 0.1, h: 2, sized: true },
  cone: { solid: false, breakable: true, r: 0.25, h: 0.7, sized: false },
  container: { solid: true, breakable: false, r: 1.3, h: 2.6, sized: true },
  crane: { solid: true, breakable: false, r: 3, h: 45, sized: false },
  antenna: { solid: false, breakable: false, r: 0.5, h: 14, sized: false },
  ac_unit: { solid: false, breakable: false, r: 1.2, h: 1.4, sized: false },
  water_tank: { solid: false, breakable: false, r: 1.6, h: 3.5, sized: false },
  helipad: { solid: false, breakable: false, r: 7, h: 0.3, sized: false },
  roof_garden: { solid: false, breakable: false, r: 5, h: 2.5, sized: true },
};
export const PROP_KINDS = Object.keys(PROPS) as PropKind[];

// ---------------------------------------------------------------------------------------------
// Characters. A look number packs a body type and an outfit colour.
// ---------------------------------------------------------------------------------------------

/** Body types the models module builds: 0 the player, 1-3 residents, 4 service robot, 5 security. */
export const CHARACTER_TYPES = 6;
export const OUTFITS = ['#d97757', '#f0eee6', '#2fc4b2', '#8f7cf5', '#f2b84b', '#59b7ff', '#3a3a3a', '#c9b58f', '#ff5fa2', '#3fb97a'] as const;
/** The player's look: body type 0, clay jacket. */
export const PLAYER_LOOK = 0;

export function lookType(look: number): number {
  return ((look | 0) >>> 0) % CHARACTER_TYPES;
}
export function lookTint(look: number): string {
  return OUTFITS[Math.floor(((look | 0) >>> 0) / CHARACTER_TYPES) % OUTFITS.length];
}
export function makeLook(type: number, outfit: number): number {
  return (outfit % OUTFITS.length) * CHARACTER_TYPES + (type % CHARACTER_TYPES);
}
