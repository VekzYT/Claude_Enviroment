// OWNER: input agent. Touch/mouse gestures, the camera rig, and turning drags into tool plans.
import * as THREE from 'three';
import type { Plan, TilePos, ToolId } from '../core/types';

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
  let tool: ToolId = 'inspect';
  const target = new THREE.Vector3(mapSize / 2, 0, mapSize / 2);
  const rig: CameraRig = {
    target,
    yaw: Math.PI / 4,
    pitch: 0.9,
    distance: 40,
    focus(x, z) {
      target.set(x + 0.5, 0, z + 0.5);
    },
    update() {},
    apply(camera) {
      const h = Math.cos(rig.pitch) * rig.distance;
      camera.position.set(target.x + Math.sin(rig.yaw) * h, Math.sin(rig.pitch) * rig.distance, target.z + Math.cos(rig.yaw) * h);
      camera.lookAt(target);
    },
  };
  return {
    rig,
    setTool(t) {
      tool = t;
    },
    getTool() {
      return tool;
    },
    cancel() {},
    update() {},
    setMapSize() {},
    dispose() {},
  };
}
