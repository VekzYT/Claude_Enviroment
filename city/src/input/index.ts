// OWNER: input agent. Touch/mouse gestures, the camera rig, and turning drags into tool plans.
//
// main.ts, once per frame:  input.update(dt); input.rig.apply(world.camera); world.render();
// input.update advances the camera rig itself, so do not also call rig.update.
// The pieces: controller.ts (gestures), rig.ts (the camera), math.ts (pure camera and gesture
// math), tiles.ts (drag tile tracking and plan shapes).
import * as THREE from 'three';
import type { Plan, TilePos, ToolId } from '../core/types';
import { createInputController } from './controller';

export type { InputControllerFull, InputOptions } from './controller';
export { createInputController } from './controller';
export { OrbitRig } from './rig';

/** An orbiting camera looking at a point on the ground. */
export interface CameraRig {
  /** Point on the ground (y = 0) the camera looks at, in world units (1 tile = 1 unit). */
  readonly target: THREE.Vector3;
  /** Radians around the vertical axis. */
  yaw: number;
  /** Radians above the ground plane (clamped, roughly 0.5..1.35). */
  pitch: number;
  /** Distance from target (clamped). */
  distance: number;
  /** Smoothly move the view to centre on a tile. */
  focus(x: number, z: number): void;
  update(dt: number): void;
  apply(camera: THREE.PerspectiveCamera): void;
}

export interface InputHooks {
  /** planTool bound to the current state. */
  plan(tool: ToolId, a: TilePos, b: TilePos): Plan;
  /** Carry out a plan (main applies it, plays sound and haptics). */
  apply(plan: Plan): void;
  /** Show or clear the ghost preview of a drag in progress. */
  preview(plan: Plan | null): void;
  /** The player tapped a tile with the inspect tool. */
  inspect(tile: TilePos | null): void;
  /** Ground tile under a point given in CSS pixels relative to the canvas. */
  pick(clientX: number, clientY: number): TilePos | null;
  /** Any touch began (used to unlock audio on iOS). */
  touched(): void;
}

export interface InputController {
  readonly rig: CameraRig;
  setTool(tool: ToolId): void;
  getTool(): ToolId;
  /** Abandon a drag in progress (clears the preview). */
  cancel(): void;
  update(dt: number): void;
  /** Change the map size the camera is clamped to (new city / load). */
  setMapSize(size: number): void;
  dispose(): void;
}

export function createInput(_el: HTMLElement, _hooks: InputHooks, mapSize: number): InputController {
  return createInputController(_el, _hooks, mapSize);
}
