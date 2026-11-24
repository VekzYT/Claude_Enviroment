// OWNER: controls. The third-person camera: orbits the player on foot, chases the vehicle when
// driving, never clips through buildings.
import type { PerspectiveCamera } from 'three';
import type { CityMap, Controls, GameState } from '../core/types';

export interface CameraRig {
  /** Where the camera looks, as a heading (main copies it to controls.camYaw). */
  readonly yaw: number;
  readonly pitch: number;
  /** Follow the game. Reads controls.lookX / lookY / camera / lookBack. Call once per frame. */
  update(dt: number, game: GameState, map: CityMap, controls: Controls): void;
  /** Write position, rotation and field of view into the three.js camera. */
  apply(camera: PerspectiveCamera): void;
  /** Add a shake (0..1), e.g. on a crash. */
  shake(amount: number): void;
  /** Jump straight behind the player with no easing (after a teleport or respawn). */
  snap(game: GameState): void;
}

/** PLACEHOLDER: a fixed camera above and behind the player. */
export function createCameraRig(): CameraRig {
  let x = 0, y = 6, z = 0, tx = 0, tz = 0;
  return {
    yaw: 0,
    pitch: 0.3,
    update(_dt, game) {
      tx = game.player.x;
      tz = game.player.z;
      x = tx;
      z = tz - 10;
      y = 6;
    },
    apply(camera) {
      camera.position.set(x, y, z);
      camera.lookAt(tx, 1.2, tz);
    },
    shake() {},
    snap() {},
  };
}
