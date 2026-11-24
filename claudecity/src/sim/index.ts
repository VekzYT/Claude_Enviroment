// OWNER: sim. The physical game: the player on foot, every vehicle, collisions, the pulse, pickups.
// It does not decide what AI drivers want (src/ai sets their inputs) or what missions do.
import { createState } from '../core/state';
import type { CityMap, Controls, GameState, Ped, PedRole, Vehicle, VehicleKind, VehicleRole } from '../core/types';

/** A fresh game in this city: player on foot at map.spawn, the 'vehicle' POIs parked, sparks out. */
export function createGame(map: CityMap, seed: number): GameState {
  return createState(map, seed);
}

/**
 * Advance the game by one fixed step (dt = SIM_DT). Reads `controls` for the player; reads
 * throttle / steer / brake / handbrake / boost on every other vehicle as set by src/ai.
 * PLACEHOLDER: does nothing.
 */
export function stepGame(game: GameState, map: CityMap, controls: Controls, dt: number): void {
  void map; void controls;
  game.time += dt;
}

/** Take a free vehicle from the pool and place it. Returns null when the pool is full. PLACEHOLDER. */
export function spawnVehicle(game: GameState, map: CityMap, kind: VehicleKind, x: number, z: number, yaw: number, role: VehicleRole): Vehicle | null {
  void game; void map; void kind; void x; void z; void yaw; void role;
  return null;
}

export function despawnVehicle(game: GameState, v: Vehicle): void {
  void game;
  v.active = false;
}

/** Take a free person from the pool and place them. Returns null when the pool is full. PLACEHOLDER. */
export function spawnPed(game: GameState, map: CityMap, look: number, x: number, z: number, yaw: number, role: PedRole): Ped | null {
  void game; void map; void look; void x; void z; void yaw; void role;
  return null;
}

/** Put the player on foot at a point (out of any vehicle). */
export function teleportPlayer(game: GameState, map: CityMap, x: number, z: number, yaw: number): void {
  void map;
  const p = game.player;
  p.mode = 'foot';
  p.vehicle = -1;
  p.x = x;
  p.y = 0;
  p.z = z;
  p.yaw = yaw;
  p.vx = p.vy = p.vz = 0;
}

/** Seat the player in a vehicle at once (no animation). PLACEHOLDER. */
export function putPlayerInVehicle(game: GameState, v: Vehicle): void {
  void game; void v;
}
