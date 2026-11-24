// OWNER: render agent. The 3D world. Keep these signatures.
import * as THREE from 'three';
import type { GameState, OverlayKind, Plan, Quality, TilePos } from '../core/types';

export interface WorldRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  /** Size of the drawing area in CSS pixels, and the device pixel ratio to render at. */
  resize(width: number, height: number, pixelRatio: number): void;
  setQuality(quality: Quality): void;
  setOverlay(overlay: OverlayKind): void;
  /** Ghost of what the current drag would do (null to clear). Also shows coverage radius for buildings. */
  setPreview(plan: Plan | null): void;
  /** Highlight one tile (the inspected one), or null. */
  setSelection(tile: TilePos | null): void;
  /** Replace the whole city (new game / load). Rebuilds everything. */
  setState(state: GameState): void;
  /** Advance animations and pull in changes (state.dirty, state.rev). dt in real seconds. */
  update(dt: number, state: GameState): void;
  render(): void;
  /** The ground tile under a screen point (CSS pixels relative to the canvas), or null if off the map. */
  pickTile(clientX: number, clientY: number): TilePos | null;
  /** Number of draw calls in the last frame (for the debug overlay and perf tests). */
  stats(): { drawCalls: number; triangles: number };
  dispose(): void;
}

export function createWorldRenderer(canvas: HTMLCanvasElement, _state: GameState, _quality: Quality): WorldRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
  return {
    renderer,
    scene,
    camera,
    resize(w, h, pr) {
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    setQuality() {},
    setOverlay() {},
    setPreview() {},
    setSelection() {},
    setState() {},
    update() {},
    render() {
      renderer.render(scene, camera);
    },
    pickTile() {
      return null;
    },
    stats() {
      return { drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },
    dispose() {
      renderer.dispose();
    },
  };
}
