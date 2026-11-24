// Catalogues: vehicles, paints, surfaces, districts, landmarks, props, gadgets, wildlife, character
// looks and the colour theme. Worldgen, sim, render, models and ui all read these.

import type { BuildingStyle, CritterKind, DistrictId, GadgetId, LandmarkId, PropKind, VehicleKind } from './types';
import { Surface } from './types';

// ---------------------------------------------------------------------------------------------
// Theme. The city is warm terracotta, cream and slate glass; the wilderness around it is bright
// green and blue by day and glows at night. Not a rainy dystopia.
// ---------------------------------------------------------------------------------------------

export const THEME = {
  clay: '#d97757', // the signature terracotta: accents, the player's first car, Claude's voice
  cream: '#f0eee6',
  ink: '#141413',
  slate: '#2b2a27',
  sand: '#e8dcc4',
  teal: '#2fc4b2',
  violet: '#8f7cf5',
  coral: '#ff7a59',
  gold: '#f2b84b',
  sky: '#8ecbf0',
  leaf: '#4caf6a',
  lagoon: '#2a9fc9',
  danger: '#e5484d',
  good: '#3fb97a',
} as const;

/** Neon / hologram colours signs and strips may use. */
export const NEONS = ['#ff7a59', '#2fc4b2', '#8f7cf5', '#f2b84b', '#ff5fa2', '#59b7ff', '#f0eee6'] as const;
/** Bioluminescent colours of the forest at night. */
export const GLOWS = ['#3ff0d0', '#7cf06a', '#59b7ff', '#c08cff'] as const;

// ---------------------------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------------------------

export type VehicleClass = 'car' | 'offroad' | 'heavy' | 'bike' | 'boat';

export interface VehicleDef {
  kind: VehicleKind;
  name: string;
  blurb: string;
  cls: VehicleClass;
  /** Length (along forward), width, height of the body, metres. */
  l: number;
  w: number;
  h: number;
  /** Gap under the body: ground clearance for wheeled vehicles, hover height for the bike, 0 for the boat. */
  ride: number;
  /** Number of wheels (0: it hovers or floats). */
  wheels: number;
  wheelR: number;
  mass: number;
  /** m/s on a paved road. */
  topSpeed: number;
  reverseSpeed: number;
  /** m/s^2 at a standstill (tapers to 0 at top speed). */
  accel: number;
  brake: number;
  /** Sideways acceleration it can hold before it starts to slide, m/s^2 (on pavement). */
  grip: number;
  /** Fastest it can turn at low speed, rad/s. */
  turn: number;
  /** 0 planted .. 1 loves to slide. */
  drift: number;
  /** Top-speed and acceleration multiplier while the nitro is on. */
  boost: number;
  /** 0 hopeless off the pavement .. 1 does not care what is under it (see SURFACES). */
  offroad: number;
  health: number;
  seats: number;
  /** Price at a garage in Tokens (0 = cannot be bought). */
  price: number;
  /** How common it is in traffic (0 = never). */
  traffic: number;
}

export const VEHICLES: Record<VehicleKind, VehicleDef> = {
  compact: { kind: 'compact', name: 'Pebble', blurb: 'A little city runabout. Slow, nimble, hard to dislike.', cls: 'car', l: 3.4, w: 1.7, h: 1.5, ride: 0.22, wheels: 4, wheelR: 0.3, mass: 900, topSpeed: 32, reverseSpeed: 9, accel: 9, brake: 20, grip: 15, turn: 2.6, drift: 0.2, boost: 1.25, offroad: 0.35, health: 80, seats: 4, price: 1500, traffic: 5 },
  sedan: { kind: 'sedan', name: 'Sonnet', blurb: 'The everyday four-door. Balanced in all things.', cls: 'car', l: 4.6, w: 1.9, h: 1.4, ride: 0.2, wheels: 4, wheelR: 0.33, mass: 1300, topSpeed: 40, reverseSpeed: 10, accel: 10, brake: 22, grip: 15, turn: 2.2, drift: 0.3, boost: 1.3, offroad: 0.35, health: 100, seats: 4, price: 4000, traffic: 6 },
  sports: { kind: 'sports', name: 'Stanza', blurb: 'Low, quick and happy to go sideways.', cls: 'car', l: 4.4, w: 1.9, h: 1.2, ride: 0.14, wheels: 4, wheelR: 0.34, mass: 1200, topSpeed: 56, reverseSpeed: 11, accel: 16, brake: 28, grip: 17, turn: 2.4, drift: 0.55, boost: 1.35, offroad: 0.2, health: 90, seats: 2, price: 14000, traffic: 2 },
  super: { kind: 'super', name: 'Opus GT', blurb: 'A prototype hypercar. The fastest thing on the coast.', cls: 'car', l: 4.7, w: 2.0, h: 1.1, ride: 0.11, wheels: 4, wheelR: 0.36, mass: 1250, topSpeed: 72, reverseSpeed: 12, accel: 24, brake: 34, grip: 20, turn: 2.3, drift: 0.45, boost: 1.4, offroad: 0.12, health: 90, seats: 2, price: 80000, traffic: 0.3 },
  van: { kind: 'van', name: 'Courier', blurb: 'A tall delivery van. Carries anything, hurries for no one.', cls: 'car', l: 5.4, w: 2.1, h: 2.3, ride: 0.25, wheels: 4, wheelR: 0.36, mass: 2100, topSpeed: 32, reverseSpeed: 8, accel: 7, brake: 18, grip: 12, turn: 1.8, drift: 0.15, boost: 1.2, offroad: 0.4, health: 140, seats: 2, price: 5000, traffic: 3 },
  truck: { kind: 'truck', name: 'Ballad 4x4', blurb: 'A lifted pickup on swamp tyres. Mud is a suggestion.', cls: 'offroad', l: 5.3, w: 2.1, h: 2.1, ride: 0.55, wheels: 4, wheelR: 0.52, mass: 2300, topSpeed: 42, reverseSpeed: 10, accel: 11, brake: 20, grip: 14, turn: 2.0, drift: 0.3, boost: 1.3, offroad: 0.95, health: 160, seats: 2, price: 9000, traffic: 2 },
  buggy: { kind: 'buggy', name: 'Limerick', blurb: 'A roll cage, four knobbly tyres and a bad attitude.', cls: 'offroad', l: 3.2, w: 1.8, h: 1.5, ride: 0.4, wheels: 4, wheelR: 0.42, mass: 650, topSpeed: 46, reverseSpeed: 10, accel: 15, brake: 24, grip: 15, turn: 2.7, drift: 0.5, boost: 1.35, offroad: 1, health: 90, seats: 2, price: 7000, traffic: 0.6 },
  hauler: { kind: 'hauler', name: 'Atlas', blurb: 'A cargo hauler. Unstoppable once it gets going.', cls: 'heavy', l: 8.5, w: 2.6, h: 3.2, ride: 0.45, wheels: 6, wheelR: 0.5, mass: 7000, topSpeed: 27, reverseSpeed: 6, accel: 5, brake: 14, grip: 10, turn: 1.2, drift: 0.05, boost: 1.15, offroad: 0.3, health: 240, seats: 2, price: 9000, traffic: 1.5 },
  bike: { kind: 'bike', name: 'Haiku', blurb: 'A hover-bike: seventeen syllables of speed. Skims mud and shallows.', cls: 'bike', l: 2.2, w: 0.8, h: 1.2, ride: 0.35, wheels: 0, wheelR: 0, mass: 250, topSpeed: 60, reverseSpeed: 6, accel: 22, brake: 30, grip: 19, turn: 3.0, drift: 0.35, boost: 1.4, offroad: 0.85, health: 50, seats: 1, price: 8000, traffic: 1.2 },
  boat: { kind: 'boat', name: 'Riptide', blurb: 'A speedboat for the bayou and the bay. Water only.', cls: 'boat', l: 6.5, w: 2.2, h: 1.5, ride: 0, wheels: 0, wheelR: 0, mass: 1500, topSpeed: 34, reverseSpeed: 6, accel: 9, brake: 8, grip: 9, turn: 1.7, drift: 0.6, boost: 1.35, offroad: 0, health: 120, seats: 4, price: 12000, traffic: 0 },
  police: { kind: 'police', name: 'Sentinel', blurb: 'An armoured Anthropic Police interceptor. Not for sale.', cls: 'car', l: 4.8, w: 2.0, h: 1.4, ride: 0.18, wheels: 4, wheelR: 0.35, mass: 1800, topSpeed: 62, reverseSpeed: 12, accel: 20, brake: 30, grip: 19, turn: 2.4, drift: 0.3, boost: 1.3, offroad: 0.4, health: 180, seats: 2, price: 0, traffic: 0 },
  ranger: { kind: 'ranger', name: 'Warden', blurb: 'The off-road pursuit unit that follows you into the trees.', cls: 'offroad', l: 5.2, w: 2.1, h: 2.0, ride: 0.5, wheels: 4, wheelR: 0.5, mass: 2400, topSpeed: 46, reverseSpeed: 10, accel: 13, brake: 22, grip: 15, turn: 2.1, drift: 0.3, boost: 1.3, offroad: 0.95, health: 200, seats: 2, price: 0, traffic: 0 },
  swat: { kind: 'swat', name: 'Bulwark', blurb: 'A containment truck. It ends chases by being in the way.', cls: 'heavy', l: 7.0, w: 2.6, h: 3.0, ride: 0.4, wheels: 6, wheelR: 0.5, mass: 6500, topSpeed: 36, reverseSpeed: 8, accel: 8, brake: 16, grip: 12, turn: 1.4, drift: 0.05, boost: 1.2, offroad: 0.5, health: 400, seats: 4, price: 0, traffic: 0 },
};
export const VEHICLE_KINDS = Object.keys(VEHICLES) as VehicleKind[];

/** Body paints (Vehicle.paint indexes this). 0 is the terracotta of the player's first car. */
export const PAINTS = ['#d97757', '#f0eee6', '#2b2a27', '#2fc4b2', '#8f7cf5', '#f2b84b', '#59b7ff', '#e5484d', '#9aa3ad', '#3fb97a', '#ff5fa2', '#c9b58f'] as const;

// ---------------------------------------------------------------------------------------------
// Surfaces: how the ground behaves under a vehicle and under feet
// ---------------------------------------------------------------------------------------------

export interface SurfaceDef {
  paved: boolean;
  /** Grip multiplier (1 = dry asphalt). */
  grip: number;
  /** How much it holds a vehicle back: scaled by (1 - vehicle.offroad). 0 none .. 1 bogged down. */
  drag: number;
  /** 0 dry, 1 shallow (wade / splash through), 2 deep (boats only; everything else sinks). */
  water: 0 | 1 | 2;
  /** Walking speed multiplier. */
  walk: number;
}

export const SURFACES: Record<Surface, SurfaceDef> = {
  [Surface.Ground]: { paved: false, grip: 0.75, drag: 0.3, water: 0, walk: 1 },
  [Surface.Road]: { paved: true, grip: 1, drag: 0, water: 0, walk: 1 },
  [Surface.Sidewalk]: { paved: true, grip: 1, drag: 0, water: 0, walk: 1 },
  [Surface.Plaza]: { paved: true, grip: 1, drag: 0, water: 0, walk: 1 },
  [Surface.Park]: { paved: false, grip: 0.8, drag: 0.2, water: 0, walk: 1 },
  [Surface.Water]: { paved: false, grip: 0.4, drag: 1, water: 2, walk: 0.4 },
  [Surface.Sand]: { paved: false, grip: 0.6, drag: 0.5, water: 0, walk: 0.85 },
  [Surface.Lot]: { paved: true, grip: 1, drag: 0, water: 0, walk: 1 },
  [Surface.Bridge]: { paved: false, grip: 0.4, drag: 1, water: 2, walk: 0.4 },
  [Surface.Dirt]: { paved: false, grip: 0.8, drag: 0.1, water: 0, walk: 1 },
  [Surface.Forest]: { paved: false, grip: 0.65, drag: 0.45, water: 0, walk: 0.9 },
  [Surface.Swamp]: { paved: false, grip: 0.5, drag: 0.8, water: 1, walk: 0.55 },
  [Surface.Boardwalk]: { paved: true, grip: 0.95, drag: 0, water: 0, walk: 1 },
};

// ---------------------------------------------------------------------------------------------
// Districts: six in the city, three in the wilderness
// ---------------------------------------------------------------------------------------------

export interface DistrictDef {
  id: DistrictId;
  name: string;
  blurb: string;
  /** City district (streets and blocks) or open country. */
  wild: boolean;
  /** Main building styles, most common first. */
  styles: BuildingStyle[];
  /** Typical building heights, metres. */
  minH: number;
  maxH: number;
  /** Wall tints the facades draw from, and the district's light colour at night. */
  walls: string[];
  neon: string;
  /** 0..1: how green it is (street trees in the city; density of growth in the wild). */
  green: number;
  /** 0..1: how busy it is (traffic and people). */
  busy: number;
}

export const DISTRICTS: Record<DistrictId, DistrictDef> = {
  core: { id: 'core', name: 'Opus Core', blurb: 'Downtown. Glass and ceramic towers around the Spire.', wild: false, styles: ['glass', 'ceramic', 'neon'], minH: 70, maxH: 300, walls: ['#e9e4d8', '#cfd8dc', '#b7c4cc', '#f0eee6', '#c98a6e'], neon: '#59b7ff', green: 0.35, busy: 1 },
  strip: { id: 'strip', name: 'Stanza Strip', blurb: 'Arcades, hotels and holograms. It never dims.', wild: false, styles: ['neon', 'glass', 'ceramic'], minH: 24, maxH: 110, walls: ['#2b2a27', '#3a3350', '#402b3a', '#1f2a33'], neon: '#ff5fa2', green: 0.25, busy: 0.9 },
  heights: { id: 'heights', name: 'Haiku Heights', blurb: 'Quiet terraces, roof gardens and small shops.', wild: false, styles: ['residential', 'ceramic', 'brick'], minH: 10, maxH: 42, walls: ['#f0eee6', '#e8dcc4', '#d9c7a8', '#c9d6c3'], neon: '#f2b84b', green: 0.9, busy: 0.45 },
  harbor: { id: 'harbor', name: 'Fable Harbor', blurb: 'Docks, cranes and warehouses on the bay.', wild: false, styles: ['concrete', 'brick', 'ceramic'], minH: 8, maxH: 36, walls: ['#8f969c', '#a69a8a', '#6f7a80', '#b3a58f'], neon: '#2fc4b2', green: 0.1, busy: 0.5 },
  park: { id: 'park', name: 'Mythos Campus', blurb: 'Lawns, a lake and the data centres that run the coast.', wild: false, styles: ['datacenter', 'ceramic', 'glass'], minH: 10, maxH: 48, walls: ['#d97757', '#f0eee6', '#c9644a', '#5a6068', '#e8dcc4'], neon: '#3fb97a', green: 1, busy: 0.35 },
  market: { id: 'market', name: 'Tokenside', blurb: 'The old market quarter: narrow streets, stalls and signs.', wild: false, styles: ['brick', 'residential', 'neon'], minH: 9, maxH: 30, walls: ['#b5694a', '#c98a5e', '#a8553d', '#d9b38c', '#8a5a44'], neon: '#f2b84b', green: 0.3, busy: 0.8 },
  bayou: { id: 'bayou', name: 'Latent Bayou', blurb: 'Wetlands, cypress and winding channels. Good for hiding things.', wild: true, styles: ['shack'], minH: 3, maxH: 7, walls: ['#8a6f55', '#6f7a5a', '#a08a6a'], neon: '#3ff0d0', green: 0.8, busy: 0.1 },
  forest: { id: 'forest', name: 'Gradient Woods', blurb: 'Dense forest that glows after dark. Dirt trails and not much else.', wild: true, styles: ['shack'], minH: 3, maxH: 8, walls: ['#7a5f48', '#5f6a4c'], neon: '#7cf06a', green: 1, busy: 0.05 },
  coast: { id: 'coast', name: 'Sonnet Shore', blurb: 'Palm-lined beaches, piers and beach houses.', wild: true, styles: ['residential', 'shack'], minH: 3, maxH: 12, walls: ['#f0eee6', '#e8dcc4', '#9fd3e0', '#f2c9a0'], neon: '#59b7ff', green: 0.5, busy: 0.3 },
};
/** The order used by CityMap.district cells. */
export const DISTRICT_IDS = ['core', 'strip', 'heights', 'harbor', 'park', 'market', 'bayou', 'forest', 'coast'] as const satisfies readonly DistrictId[];

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
  datacore: { id: 'datacore', name: 'The Datacore', w: 96, d: 64, h: 34, district: 'park' },
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
  /** Growing or lying in the landscape: drawn by the terrain renderer, not the city renderer. */
  nature: boolean;
}

const P = (solid: boolean, breakable: boolean, r: number, h: number, sized = false, nature = false): PropDef => ({ solid, breakable, r, h, sized, nature });

export const PROPS: Record<PropKind, PropDef> = {
  lamp: P(true, true, 0.2, 7),
  traffic_light: P(true, true, 0.2, 6),
  tree: P(true, false, 0.35, 7, false, true),
  palm: P(true, false, 0.3, 9, false, true),
  bush: P(false, false, 0.8, 1, false, true),
  planter: P(true, false, 0.8, 0.8),
  bench: P(true, true, 0.8, 0.9),
  bin: P(true, true, 0.35, 1),
  bollard: P(true, false, 0.2, 0.9),
  hydrant: P(true, true, 0.25, 0.8),
  street_sign: P(true, true, 0.12, 3),
  bus_stop: P(true, true, 1.6, 2.6),
  charger: P(true, false, 0.5, 2.2),
  vending: P(true, true, 0.6, 2),
  holo_ad: P(true, false, 0.5, 8),
  billboard: P(true, false, 0.4, 12, true),
  neon_sign: P(false, false, 2, 3, true),
  stall: P(true, true, 1.4, 2.6),
  fountain: P(true, false, 4, 2.5),
  statue: P(true, false, 1.5, 6),
  barrier: P(true, false, 0.4, 1, true),
  fence: P(true, false, 0.1, 2, true),
  cone: P(false, true, 0.25, 0.7),
  container: P(true, false, 1.3, 2.6, true),
  crane: P(true, false, 3, 45),
  antenna: P(false, false, 0.5, 14),
  ac_unit: P(false, false, 1.2, 1.4),
  water_tank: P(false, false, 1.6, 3.5),
  helipad: P(false, false, 7, 0.3),
  roof_garden: P(false, false, 5, 2.5, true),
  cypress: P(true, false, 0.6, 14, false, true),
  glow_tree: P(true, false, 0.45, 11, false, true),
  rock: P(true, false, 1.2, 1.4, false, true),
  log: P(true, false, 0.4, 0.5, true, true),
  glow_shroom: P(false, false, 0.6, 0.8, false, true),
  dock_post: P(true, false, 0.2, 1.6),
  buoy: P(false, false, 0.5, 1.6),
  crate: P(true, true, 0.6, 1.1),
  gate_arm: P(true, true, 0.3, 1.2, true),
  watchtower: P(true, false, 1.6, 12),
  campfire: P(false, false, 0.7, 0.5),
  trail_sign: P(true, true, 0.12, 2),
  cooler: P(true, false, 1.6, 2.8),
  dish: P(false, false, 1.8, 3.5),
};
export const PROP_KINDS = Object.keys(PROPS) as PropKind[];

// ---------------------------------------------------------------------------------------------
// Gadgets (the gadget wheel) and wildlife
// ---------------------------------------------------------------------------------------------

export interface GadgetDef {
  id: GadgetId;
  name: string;
  blurb: string;
  /** Seconds between uses. */
  cooldown: number;
  /** Charges a new game starts with (-1 = unlimited). */
  charges: number;
  /** Price of one charge at a garage, Tokens. */
  price: number;
}

export const GADGETS: Record<GadgetId, GadgetDef> = {
  pulse: { id: 'pulse', name: 'Pulse', blurb: 'A stun shot. Stops machines for a few seconds, drops a pursuer on foot.', cooldown: 0.45, charges: -1, price: 0 },
  emp: { id: 'emp', name: 'EMP burst', blurb: 'Knocks out every vehicle and drone around you.', cooldown: 8, charges: 2, price: 400 },
  smoke: { id: 'smoke', name: 'Smoke screen', blurb: 'A cloud nobody can see through. Break the line of sight and vanish.', cooldown: 10, charges: 2, price: 250 },
  repair: { id: 'repair', name: 'Patch kit', blurb: 'Fixes up the vehicle you are in, or you.', cooldown: 6, charges: 1, price: 300 },
};
export const GADGET_IDS = Object.keys(GADGETS) as GadgetId[];
/** Radius of an EMP burst and how long a smoke screen lasts. */
export const EMP_RADIUS = 20;
export const SMOKE_TIME = 9;
export const SMOKE_RADIUS = 9;

export interface CritterDef {
  kind: CritterKind;
  name: string;
  /** Body length, metres. */
  l: number;
  speed: number;
  /** Where it lives. */
  home: Surface[];
}
export const CRITTERS: Record<CritterKind, CritterDef> = {
  gator: { kind: 'gator', name: 'Gator', l: 3.2, speed: 4, home: [Surface.Swamp, Surface.Water] },
  heron: { kind: 'heron', name: 'Heron', l: 1.1, speed: 9, home: [Surface.Swamp, Surface.Sand] },
  deer: { kind: 'deer', name: 'Deer', l: 1.6, speed: 11, home: [Surface.Forest, Surface.Ground] },
};

// ---------------------------------------------------------------------------------------------
// Characters. A look number packs a body type and an outfit colour.
// ---------------------------------------------------------------------------------------------

/** Body types the models module builds: 0 the operative (player), 1-3 residents, 4 service robot, 5 police. */
export const CHARACTER_TYPES = 6;
export const OUTFITS = ['#d97757', '#f0eee6', '#2fc4b2', '#8f7cf5', '#f2b84b', '#59b7ff', '#3a3a3a', '#c9b58f', '#ff5fa2', '#3fb97a'] as const;
/** The player's starting look: body type 0, terracotta jacket. */
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
