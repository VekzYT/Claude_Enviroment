// Shared types for Sonnet Coast. Every module reads these; only the architect edits this file.
// ("City" in type names means the whole map: the city and the wilderness around it.)
// Units: metres, seconds, radians. Axes: x east, y up, z south. The world is [0, size] x [0, size].
// Heading ("yaw") is a rotation about +y, the same value three.js takes as rotation.y:
//   forward = (sin yaw, 0, cos yaw)      yaw 0 faces +z (south), yaw PI/2 faces +x (east)
//   right   = (-cos yaw, 0, sin yaw)     facing south, your right hand points west (-x)
// Models are built facing +z. Traffic drives on the right.

// ---------------------------------------------------------------------------------------------
// Settings and small shared names
// ---------------------------------------------------------------------------------------------

export type Quality = 'low' | 'medium' | 'high';
export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export interface Settings {
  quality: Quality;
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
  haptics: boolean;
  tips: boolean;
  seenTips: string[];
  /** Camera look speed multiplier, 0.2..3 (1 = default). */
  lookSensitivity: number;
  invertY: boolean;
}

/** Sound effects the audio engine can play (the audio module owns the recipes). */
export type SfxId =
  | 'click'
  | 'open'
  | 'close'
  | 'denied'
  | 'enter'
  | 'exit'
  | 'crash'
  | 'scrape'
  | 'land'
  | 'boost'
  | 'pulse'
  | 'zap'
  | 'pickup'
  | 'spark'
  | 'cash'
  | 'checkpoint'
  | 'missionStart'
  | 'missionDone'
  | 'missionFail'
  | 'heatUp'
  | 'heatClear'
  | 'busted'
  | 'splash'
  | 'horn'
  | 'siren'
  | 'step'
  | 'jump'
  | 'propBreak'
  | 'dialog'
  | 'jack'
  | 'alarm'
  | 'emp'
  | 'smoke'
  | 'repair'
  | 'radio'
  | 'flagUp'
  | 'flagClear';

// ---------------------------------------------------------------------------------------------
// The city (static, generated once from a seed by src/world)
// ---------------------------------------------------------------------------------------------

export type DistrictId = 'core' | 'strip' | 'heights' | 'harbor' | 'park' | 'market' | 'bayou' | 'forest' | 'coast';

/** What the ground is at a point. Stored one byte per cell in CityMap.surface. */
export enum Surface {
  Ground = 0, // wild grass and scrub
  Road = 1,
  Sidewalk = 2,
  Plaza = 3, // paved public square
  Park = 4, // lawn
  Water = 5,
  Sand = 6,
  Lot = 7, // paved private yard around buildings (concrete)
  Bridge = 8, // deep water with a raised bridge deck over it (see Ramp): boats pass underneath
  Dirt = 9, // dirt trail or track
  Forest = 10, // forest floor: undergrowth, roots, slow going for cars
  Swamp = 11, // shallow water and mud: wade, drive a truck or take a boat through it
  Boardwalk = 12, // wooden deck or pier over water or swamp: solid
}

export type RoadClass = 'street' | 'avenue' | 'expressway' | 'rural';

export interface RoadNode {
  id: number;
  x: number;
  z: number;
  /** Edge ids towards north (-z), east (+x), south (+z), west (-x); -1 where there is none. */
  edges: [number, number, number, number];
  /** Half size of the junction square (the widest roadway that meets here, halved). */
  half: number;
  /** Has traffic lights. */
  signal: boolean;
}

export interface RoadEdge {
  id: number;
  /** Node ids. `a` has the smaller coordinate along the axis. */
  a: number;
  b: number;
  /** 0: runs along x (west-east). 1: runs along z (north-south). */
  axis: 0 | 1;
  cls: RoadClass;
  /** Centre line from node a to node b. */
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** Half width of the roadway (kerb to centre). */
  half: number;
  /** Sidewalk width on each side (0 for expressways). */
  walk: number;
  /** Driving lanes per direction. */
  lanes: number;
  bridge: boolean;
  name: string;
}

/** One directed driving lane along an edge, from the edge of one junction square to the next. */
export interface Lane {
  id: number;
  edge: number;
  /** +1: travels towards larger x or z. -1: the other way. */
  dir: 1 | -1;
  /** 0 = nearest the centre line. */
  index: number;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  len: number;
  /** Node ids it leaves and reaches. */
  from: number;
  to: number;
  /** Speed limit, m/s. */
  speed: number;
  /** Lanes that can be taken next at `to`. */
  out: number[];
}

/** A stretch of sidewalk (or a crossing) that people walk along, in either direction. */
export interface WalkSeg {
  id: number;
  ax: number;
  az: number;
  bx: number;
  bz: number;
  /** Segments reachable from end a / end b. */
  a: number[];
  b: number[];
  crossing: boolean;
}

/** A winding path through the wilderness (not part of the road graph). Painted into `surface`. */
export interface Trail {
  id: number;
  name: string;
  kind: 'dirt' | 'boardwalk';
  width: number;
  /** x0, z0, x1, z1, ... */
  pts: number[];
}

export interface Box {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  y0: number;
  y1: number;
}

export type BlockUse = 'built' | 'park' | 'plaza' | 'yard' | 'landmark' | 'water';

/** The land between roads, inside the sidewalks. */
export interface Block {
  id: number;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  district: DistrictId;
  use: BlockUse;
}

/** Facade looks the city renderer knows how to draw. */
export type BuildingStyle = 'glass' | 'ceramic' | 'brick' | 'concrete' | 'neon' | 'residential' | 'datacenter' | 'shack';
export type LandmarkId = 'spire' | 'arena' | 'observatory' | 'lighthouse' | 'gate' | 'wheel' | 'datacore';

export interface Building {
  id: number;
  block: number;
  district: DistrictId;
  style: BuildingStyle;
  /** Stacked axis-aligned boxes (podium, tower, crown...). parts[0] sits on the ground. */
  parts: Box[];
  /** Overall footprint and height (the bounds of parts). */
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  h: number;
  /** Which side faces the street: 0 +z, 1 +x, 2 -z, 3 -x. */
  front: 0 | 1 | 2 | 3;
  /** Picks colours, window rhythm and lit windows. */
  seed: number;
  /** Set for the unique buildings: drawn from render/models landmarkModel instead of facade boxes. */
  landmark?: LandmarkId;
}

export type PropKind =
  | 'lamp'
  | 'traffic_light'
  | 'tree'
  | 'palm'
  | 'bush'
  | 'planter'
  | 'bench'
  | 'bin'
  | 'bollard'
  | 'hydrant'
  | 'street_sign'
  | 'bus_stop'
  | 'charger'
  | 'vending'
  | 'holo_ad'
  | 'billboard'
  | 'neon_sign'
  | 'stall'
  | 'fountain'
  | 'statue'
  | 'barrier'
  | 'fence'
  | 'cone'
  | 'container'
  | 'crane'
  | 'antenna'
  | 'ac_unit'
  | 'water_tank'
  | 'helipad'
  | 'roof_garden'
  // --- wilderness
  | 'cypress'
  | 'glow_tree'
  | 'rock'
  | 'log'
  | 'glow_shroom'
  | 'dock_post'
  | 'buoy'
  | 'crate'
  | 'gate_arm'
  | 'watchtower'
  | 'campfire'
  | 'trail_sign'
  | 'cooler'
  | 'dish';

export interface Prop {
  kind: PropKind;
  x: number;
  /** Height of its base: 0 at street level, a roof height for rooftop props. */
  y: number;
  z: number;
  yaw: number;
  scale: number;
  seed: number;
  /** Size in metres for the sized kinds (see PROPS[kind].sized): width, height, depth before yaw. */
  w?: number;
  h?: number;
  d?: number;
}

/**
 * A raised driving surface: a stunt ramp (a wedge from 0 up to h), or one piece of a bridge (an
 * approach from h0 up to h, or a level deck where h0 = h). Open at the sides: drive off and you fall.
 * Boats and anything else low enough pass underneath a deck.
 */
export interface Ramp {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** Uphill direction: 0 +z, 1 +x, 2 -z, 3 -x. */
  dir: 0 | 1 | 2 | 3;
  /** Height at the low edge (0 for a stunt ramp) and at the high edge. */
  h0: number;
  h: number;
  kind: 'stunt' | 'bridge';
}

export type PoiKind = 'safehouse' | 'garage' | 'chopshop' | 'job' | 'landmark' | 'stunt' | 'spark' | 'vehicle' | 'dock' | 'checkpoint' | 'outpost' | 'viewpoint' | 'race';

/** A named place. Missions, the map and spawning read these. */
export interface Poi {
  id: string;
  kind: PoiKind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  name: string;
  district: DistrictId;
  /** kind 'vehicle': which vehicle is parked here. kind 'job': which contact. */
  tag?: string;
}

export type ColliderKind = 'building' | 'prop';

/** A solid axis-aligned box. Derived from buildings and solid props by core/query finalizeCity. */
export interface Collider extends Box {
  kind: ColliderKind;
  /** Building id, or index into CityMap.props. */
  ref: number;
}

/** A uniform grid index over items with bounds (compressed rows). Built by core/query buildGrid. */
export interface SpatialGrid {
  cell: number;
  n: number;
  start: Uint32Array;
  items: Uint32Array;
  /** Scratch for de-duplicating query results. */
  mark: Uint32Array;
  tick: number;
}

/** What src/world produces before core/query finalizeCity adds the derived parts. */
export interface CityDraft {
  seed: number;
  /** Side length in metres. A multiple of DISTRICT_CELL. */
  size: number;
  nodes: RoadNode[];
  edges: RoadEdge[];
  lanes: Lane[];
  walks: WalkSeg[];
  trails: Trail[];
  blocks: Block[];
  buildings: Building[];
  props: Prop[];
  ramps: Ramp[];
  pois: Poi[];
  /** Surface per cell, row-major (z * surfN + x), cell size SURF_CELL. */
  surface: Uint8Array;
  /** Index into DISTRICT_IDS per cell, cell size DISTRICT_CELL. */
  district: Uint8Array;
  /** Where a new game starts (on foot, outside the safehouse). */
  spawn: { x: number; z: number; yaw: number };
}

export interface CityMap extends CityDraft {
  surfN: number;
  districtN: number;
  colliders: Collider[];
  /** Grid over colliders. */
  grid: SpatialGrid;
  /** Grid over props (all of them, by position). */
  propGrid: SpatialGrid;
  /** Grid over lanes (by their bounds). */
  laneGrid: SpatialGrid;
}

export interface RayHit {
  /** Distance along the ray. */
  t: number;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  /** Index into CityMap.colliders. */
  collider: number;
}

// ---------------------------------------------------------------------------------------------
// The game (dynamic). Plain objects in fixed-size pools: never allocate per frame.
// ---------------------------------------------------------------------------------------------

export type VehicleKind = 'compact' | 'sedan' | 'sports' | 'super' | 'van' | 'truck' | 'buggy' | 'hauler' | 'bike' | 'boat' | 'police' | 'ranger' | 'swat';
export type VehicleRole = 'parked' | 'traffic' | 'player' | 'police' | 'mission' | 'wreck';

/** Scratch owned by src/ai. Nobody else writes it. */
export interface VehicleAI {
  lane: number;
  /** Metres travelled along the lane. */
  t: number;
  nextLane: number;
  targetSpeed: number;
  state: number;
  timer: number;
  tx: number;
  tz: number;
  aux: number;
}

export interface Vehicle {
  id: number;
  active: boolean;
  kind: VehicleKind;
  role: VehicleRole;
  /** Index into PAINTS. */
  paint: number;

  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  vx: number;
  vy: number;
  vz: number;
  yawRate: number;
  /** Signed speed along its own forward axis, m/s (sim derives it every step). */
  speed: number;
  /** 0..1: how much it is sliding sideways (for smoke, sound and scoring). */
  slip: number;

  // --- inputs for the next step: written by sim for the player's vehicle, by src/ai for the rest
  /** -1 (reverse) .. 1 (full ahead). */
  throttle: number;
  /** -1 (left) .. 1 (right). */
  steer: number;
  /** 0..1. */
  brake: number;
  handbrake: boolean;
  boost: boolean;

  onGround: boolean;
  /** Seconds since it left the ground (0 while on it). */
  airTime: number;
  /** 0 (wrecked) .. 100. */
  health: number;
  /** 0..1. */
  boostFuel: number;
  /** Seconds left disabled by a pulse (no power, no steering). */
  stunT: number;
  /** Someone is driving it (the player or an AI driver). */
  occupied: boolean;
  /** Look of the AI driver sitting in it, or -1 (the player, or nobody). */
  driverLook: number;
  /** Parked and locked: getting in takes a break-in and may set off the alarm. */
  locked: boolean;
  /** Seconds of alarm left. */
  alarmT: number;
  /** The surface under it (for spray, dust, wake and sound). */
  surface: Surface;
  /** Wheel rotation in radians (advances with distance), and the front wheels' steering angle. */
  wheelSpin: number;
  wheelSteer: number;
  /** Not moving and not simulated until something touches it. */
  asleep: boolean;
  lights: boolean;
  siren: boolean;
  /** game.time of the last impact (for sparks and sound). */
  hitT: number;
  ai: VehicleAI;
}

export type PedState = 'idle' | 'walk' | 'run' | 'flee' | 'cower' | 'talk' | 'down' | 'getup' | 'chase' | 'aim';
export type PedRole = 'civilian' | 'bot' | 'police' | 'mission';

/** Scratch owned by src/ai. */
export interface PedAI {
  seg: number;
  /** +1 walking a to b, -1 b to a. */
  dir: number;
  tx: number;
  tz: number;
  timer: number;
  aux: number;
}

export interface Ped {
  id: number;
  active: boolean;
  role: PedRole;
  /** Appearance: see core/defs lookType / lookTint. */
  look: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  speed: number;
  state: PedState;
  /** Seconds in the current state. */
  stateT: number;
  /** Animation phase (advances with distance walked). */
  anim: number;
  health: number;
  stunT: number;
  ai: PedAI;
}

export type PlayerMode = 'foot' | 'vehicle';
export type PlayerAnim = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'enter' | 'exit' | 'down' | 'pulse' | 'swim' | 'wade';
/** What the player carries. The pulse never runs out; the others have charges (Progress.gadgets). */
export type GadgetId = 'pulse' | 'emp' | 'smoke' | 'repair';

export interface Player {
  x: number;
  y: number;
  z: number;
  yaw: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  mode: PlayerMode;
  /** Vehicle id while driving (or getting in / out), else -1. */
  vehicle: number;
  /** 0..100. */
  health: number;
  /** 0..100: soaks up damage before health does. */
  armor: number;
  /** 0..1, drained by sprinting. */
  stamina: number;
  /** The gadget in hand (what `fire` uses). */
  gadget: GadgetId;
  anim: PlayerAnim;
  /** Seconds in the current anim. */
  animT: number;
  /** Animation phase (advances with distance walked). */
  phase: number;
  /** Seconds until the pulse can fire again. */
  pulseT: number;
  /** Seconds of invulnerability left (after a respawn). */
  safeT: number;
  /** Id of the nearest vehicle that can be entered right now, or -1 (sim sets it every step). */
  near: number;
  look: number;
}

export type DroneRole = 'courier' | 'police';

export interface Drone {
  id: number;
  active: boolean;
  role: DroneRole;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  state: number;
  stateT: number;
  health: number;
  stunT: number;
  /** Scratch owned by src/ai. */
  tx: number;
  ty: number;
  tz: number;
  timer: number;
}

export type CritterKind = 'gator' | 'heron' | 'deer';

/** Wildlife. src/ai moves them; they are scenery with a little behaviour. */
export interface Critter {
  id: number;
  active: boolean;
  kind: CritterKind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  state: number;
  stateT: number;
  /** Animation phase. */
  anim: number;
  tx: number;
  tz: number;
}

/** A smoke screen left by the smoke gadget: nobody sees through it. */
export interface Smoke {
  active: boolean;
  x: number;
  y: number;
  z: number;
  /** Seconds left. */
  life: number;
}

export type ShotKind = 'pulse' | 'stun';

export interface Shot {
  active: boolean;
  kind: ShotKind;
  /** True when the player fired it. */
  mine: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Seconds left. */
  life: number;
}

export type PickupKind = 'spark' | 'tokens' | 'health' | 'armor' | 'boost' | 'cargo';

export interface Pickup {
  active: boolean;
  kind: PickupKind;
  x: number;
  y: number;
  z: number;
  value: number;
  /** Poi id for sparks (so each is collected once), else ''. */
  poi: string;
}

/**
 * The Safety Flag level: how hard the police are looking for the player. 0 = nobody cares, 5 = everything
 * they have. (Called `heat` in code.)
 */
export interface Heat {
  /** 0..5 flags. */
  level: number;
  /** 0..1 progress towards the next level (or towards cooling off while hidden). */
  charge: number;
  /** A police unit can see the player right now. */
  seen: boolean;
  /** Seconds out of sight. */
  hiddenT: number;
  /** Where the player was last seen. */
  lastX: number;
  lastZ: number;
}

export type MarkerKind = 'job' | 'target' | 'dropoff' | 'checkpoint' | 'pickup' | 'enemy' | 'garage' | 'chopshop' | 'safehouse' | 'race' | 'convoy';

/** Something to show in the world and on the map. src/missions writes them; render and ui read them. */
export interface Marker {
  kind: MarkerKind;
  x: number;
  y: number;
  z: number;
  radius: number;
  label: string;
  /** Draw a tall light beam in the world. */
  beam: boolean;
  /** This is where the route line should lead. */
  route: boolean;
}

export interface MissionView {
  /** Id of the running mission, or '' when free-roaming. */
  active: string;
  title: string;
  /** One line telling the player what to do now. */
  objective: string;
  stage: number;
  /** Seconds left, or -1 when the mission is not timed. */
  timer: number;
  /** 0..1 for a progress bar, or -1 for none. */
  progress: number;
  markers: Marker[];
  /** Scratch owned by src/missions. */
  data: Record<string, number>;
}

/** Everything that is saved. */
export interface Progress {
  /** Money. The city runs on Tokens. */
  tokens: number;
  /** Ids of finished missions. */
  done: string[];
  /** Poi ids of collected sparks. */
  sparks: string[];
  owned: VehicleKind[];
  /** The vehicle waiting at the safehouse. */
  ride: VehicleKind;
  ridePaint: number;
  /** Charges left per gadget (pulse is unlimited and not listed). */
  gadgets: Record<string, number>;
  /** The operative's outfit: jacket colour (index into OUTFITS) and style (0 streetwear, 1 tactical...). */
  outfit: { colour: number; style: number };
  stats: Record<string, number>;
  flags: Record<string, number>;
}

export interface GameState {
  version: number;
  seed: number;
  /** Seconds simulated. */
  time: number;
  /** Time of day 0..1 (0 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset). */
  clock: number;
  player: Player;
  vehicles: Vehicle[];
  peds: Ped[];
  drones: Drone[];
  critters: Critter[];
  smokes: Smoke[];
  shots: Shot[];
  pickups: Pickup[];
  /** One byte per CityMap.props entry: 0 standing, 1 knocked over. */
  propsDown: Uint8Array;
  heat: Heat;
  mission: MissionView;
  progress: Progress;
}

// ---------------------------------------------------------------------------------------------
// Controls: what the player is asking for this frame, whatever the device (src/input fills it in)
// ---------------------------------------------------------------------------------------------

export type ControlScheme = 'touch' | 'kbm' | 'gamepad';

export interface Controls {
  scheme: ControlScheme;
  /** Stick / WASD. x: -1 left .. 1 right. y: -1 back .. 1 forward. On foot: move. Driving: x steers. */
  moveX: number;
  moveY: number;
  /** Camera turn asked for this frame, radians (already scaled by sensitivity). Consumed by src/camera. */
  lookX: number;
  lookY: number;
  /** Driving: 0..1. */
  gas: number;
  /** Driving: 0..1 (brakes, then reverses once stopped). */
  brake: number;
  handbrake: boolean;
  /** Driving: boost. On foot: sprint. */
  boost: boolean;
  jump: boolean;
  // --- pressed this frame (true for exactly one update)
  /** Get in the nearest vehicle / get out. */
  enter: boolean;
  /** Use the gadget in hand. */
  fire: boolean;
  /** Switch to the next gadget. */
  gadgetNext: boolean;
  /** Next radio station (while driving). */
  radio: boolean;
  /** Talk to a contact, accept a job, use a garage. */
  interact: boolean;
  horn: boolean;
  /** Cycle the camera distance. */
  camera: boolean;
  /** Look behind while held. */
  lookBack: boolean;
  /** Held: the gadget wheel is open (the ui draws it and picks with the stick or pointer). */
  wheel: boolean;
  map: boolean;
  pause: boolean;
  /** Camera heading, set by main from the camera rig before each sim step, so "forward" on the
   *  stick means "away from the camera" on foot. */
  camYaw: number;
}

/** Lighting facts for this frame. The scene renderer computes them; the city view follows them. */
export interface RenderEnv {
  /** game.clock. */
  clock: number;
  /** 0 full day .. 1 full night. */
  night: number;
  /** Unit vector towards the sun (or the moon at night). */
  sunX: number;
  sunY: number;
  sunZ: number;
  /** Seconds since start, for animation. */
  time: number;
  /** 0 dry .. 1 soaked (glossy streets). */
  wet: number;
  /** Fog colour (linear rgb 0..1) and range in metres. */
  fogR: number;
  fogG: number;
  fogB: number;
  fogNear: number;
  fogFar: number;
}
