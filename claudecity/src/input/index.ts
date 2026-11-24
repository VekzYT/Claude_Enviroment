// OWNER: controls. Reads keyboard + mouse, touch and gamepads and turns them into one Controls
// object. Owns the on-screen touch controls (it creates them inside the element it is given).
import type { Controls } from '../core/types';

export interface ControlContext {
  /** What the player is doing: decides which buttons show and what the stick means. */
  mode: 'foot' | 'vehicle' | 'menu';
  /** A vehicle is in reach (show the get-in button). */
  canEnter: boolean;
  /** A contact / garage / job is in reach (show the interact button). */
  canInteract: boolean;
}

export interface ControlsSource {
  /** Live values, updated by update(). The same object every frame. */
  readonly controls: Controls;
  /** Call once per frame before using `controls`. Edge flags (enter, fire...) are true for one frame. */
  update(dt: number): void;
  setContext(ctx: ControlContext): void;
  setSensitivity(look: number, invertY: boolean): void;
  dispose(): void;
}

export function blankControls(): Controls {
  return {
    scheme: 'kbm', moveX: 0, moveY: 0, lookX: 0, lookY: 0, gas: 0, brake: 0, handbrake: false, boost: false, jump: false,
    enter: false, fire: false, interact: false, horn: false, camera: false, lookBack: false, map: false, pause: false, camYaw: 0,
  };
}

/**
 * `canvas` receives mouse look / camera drags; touch buttons are created inside `overlay`.
 * PLACEHOLDER: returns controls that never change.
 */
export function createControls(canvas: HTMLCanvasElement, overlay: HTMLElement): ControlsSource {
  void canvas; void overlay;
  const controls = blankControls();
  return { controls, update() {}, setContext() {}, setSensitivity() {}, dispose() {} };
}
