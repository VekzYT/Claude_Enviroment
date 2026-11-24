// Helpers for creating the game state and its pools. Pools are allocated once; entities are reused
// by flipping `active`.

import { MAX_DRONES, MAX_PEDS, MAX_PICKUPS, MAX_SHOTS, MAX_VEHICLES, SAVE_VERSION, START_CLOCK, START_CREDITS } from './config';
import { PLAYER_LOOK, VEHICLES } from './defs';
import type { CityMap, Drone, GameState, Ped, Pickup, Player, Progress, Shot, Vehicle } from './types';

export function blankVehicle(id: number): Vehicle {
  return {
    id, active: false, kind: 'pod', role: 'parked', paint: 0,
    x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, vx: 0, vy: 0, vz: 0, yawRate: 0, speed: 0, slip: 0,
    throttle: 0, steer: 0, brake: 0, handbrake: false, boost: false,
    onGround: true, airTime: 0, health: VEHICLES.pod.health, boostFuel: 1, stunT: 0,
    occupied: false, asleep: true, lights: false, siren: false, hitT: -100,
    ai: { lane: -1, t: 0, nextLane: -1, targetSpeed: 0, state: 0, timer: 0, tx: 0, tz: 0, aux: 0 },
  };
}

export function blankPed(id: number): Ped {
  return {
    id, active: false, role: 'civilian', look: 1, x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, speed: 0,
    state: 'idle', stateT: 0, anim: 0, health: 100, stunT: 0,
    ai: { seg: -1, dir: 1, tx: 0, tz: 0, timer: 0, aux: 0 },
  };
}

export function blankDrone(id: number): Drone {
  return { id, active: false, role: 'courier', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, state: 0, stateT: 0, health: 30, stunT: 0, tx: 0, ty: 0, tz: 0, timer: 0 };
}

export function blankShot(): Shot {
  return { active: false, kind: 'pulse', mine: true, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0 };
}

export function blankPickup(): Pickup {
  return { active: false, kind: 'credits', x: 0, y: 0, z: 0, value: 0, poi: '' };
}

export function newPlayer(map: CityMap): Player {
  return {
    x: map.spawn.x, y: 0, z: map.spawn.z, yaw: map.spawn.yaw, vx: 0, vy: 0, vz: 0, onGround: true,
    mode: 'foot', vehicle: -1, health: 100, stamina: 1, anim: 'idle', animT: 0, phase: 0, pulseT: 0, safeT: 2, near: -1, look: PLAYER_LOOK,
  };
}

export function newProgress(): Progress {
  return { credits: START_CREDITS, done: [], sparks: [], owned: ['pod'], ride: 'pod', ridePaint: 0, stats: {}, flags: {} };
}

/** An empty game in a city: the player at the spawn point, every pool inactive. */
export function createState(map: CityMap, seed: number): GameState {
  const vehicles: Vehicle[] = [];
  for (let i = 0; i < MAX_VEHICLES; i++) vehicles.push(blankVehicle(i));
  const peds: Ped[] = [];
  for (let i = 0; i < MAX_PEDS; i++) peds.push(blankPed(i));
  const drones: Drone[] = [];
  for (let i = 0; i < MAX_DRONES; i++) drones.push(blankDrone(i));
  const shots: Shot[] = [];
  for (let i = 0; i < MAX_SHOTS; i++) shots.push(blankShot());
  const pickups: Pickup[] = [];
  for (let i = 0; i < MAX_PICKUPS; i++) pickups.push(blankPickup());
  return {
    version: SAVE_VERSION,
    seed,
    time: 0,
    clock: START_CLOCK,
    player: newPlayer(map),
    vehicles,
    peds,
    drones,
    shots,
    pickups,
    propsDown: new Uint8Array(map.props.length),
    heat: { level: 0, charge: 0, seen: false, hiddenT: 0, lastX: 0, lastZ: 0 },
    mission: { active: '', title: '', objective: '', stage: 0, timer: -1, progress: -1, markers: [], data: {} },
    progress: newProgress(),
  };
}

/** 0 by day .. 1 at night, with soft dawn and dusk. `clock` is the time of day 0..1. */
export function nightAmount(clock: number): number {
  const sun = Math.sin((clock - 0.25) * Math.PI * 2); // 1 at noon, -1 at midnight
  const n = (0.12 - sun) / 0.34;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
