// OWNER: scene-render. The renderer, sky and lighting, everything that moves (vehicles, people,
// wildlife, drones, shots, pickups, markers) and effects. The static world comes from ./city (roads,
// buildings, street furniture) and ./terrain (ground, water, vegetation).
import * as THREE from 'three';
import { VEHICLES } from '../core/defs';
import { nightAmount } from '../core/state';
import type { CityMap, GameState, Quality, RenderEnv } from '../core/types';
import { createCityView, type CityView } from './city';
import { createTerrainView, type TerrainView } from './terrain';

export interface RenderStats {
  drawCalls: number;
  triangles: number;
}

export interface GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  /** The camera rig (src/camera) positions this; the renderer only draws through it. */
  readonly camera: THREE.PerspectiveCamera;
  readonly env: RenderEnv;
  readonly city: CityView;
  readonly terrain: TerrainView;
  /** Size in CSS pixels and the device pixel ratio. Does not touch canvas.style. */
  resize(width: number, height: number, pixelRatio: number): void;
  setQuality(quality: Quality): void;
  /** Sync what is drawn with the game (after the sim step, before render): entities, markers,
   *  effects, and the lighting for game.clock. */
  update(dt: number, game: GameState): void;
  render(): void;
  stats(): RenderStats;
  dispose(): void;
}

/** PLACEHOLDER: flat lighting and boxes for the player and vehicles. */
export function createGameRenderer(canvas: HTMLCanvasElement, map: CityMap, quality: Quality): GameRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8ecbf0);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 1500);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(0.4, 1, 0.3);
  scene.add(sun);
  const city = createCityView(map, quality);
  scene.add(city.object);
  const terrain = createTerrainView(map, quality);
  scene.add(terrain.object);
  const env: RenderEnv = { clock: 0.5, night: 0, sunX: 0.4, sunY: 0.8, sunZ: 0.3, time: 0, wet: 0, fogR: 0.6, fogG: 0.8, fogB: 0.95, fogNear: 200, fogFar: 1200 };
  const playerBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.4), new THREE.MeshLambertMaterial({ color: 0xd97757 }));
  scene.add(playerBox);
  const cars: THREE.Mesh[] = [];
  return {
    renderer, scene, camera, env, city, terrain,
    resize(w, h, pr) {
      renderer.setPixelRatio(Math.min(pr, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    setQuality(q) {
      city.setQuality(q);
      terrain.setQuality(q);
    },
    update(dt, game) {
      env.clock = game.clock;
      env.night = nightAmount(game.clock);
      env.time += dt;
      playerBox.visible = game.player.mode === 'foot';
      playerBox.position.set(game.player.x, game.player.y + 0.9, game.player.z);
      playerBox.rotation.y = game.player.yaw;
      for (let i = 0; i < game.vehicles.length; i++) {
        const v = game.vehicles[i];
        let mesh = cars[i];
        if (!mesh) {
          mesh = cars[i] = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x2fc4b2 }));
          scene.add(mesh);
        }
        mesh.visible = v.active;
        if (!v.active) continue;
        const d = VEHICLES[v.kind];
        mesh.scale.set(d.w, d.h, d.l);
        mesh.position.set(v.x, v.y + d.ride + d.h / 2, v.z);
        mesh.rotation.set(v.pitch, v.yaw, v.roll, 'YXZ');
      }
      city.update(dt, camera, env, game);
      terrain.update(dt, camera, env, game);
    },
    render() {
      renderer.render(scene, camera);
    },
    stats() {
      return { drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },
    dispose() {
      city.dispose();
      terrain.dispose();
      renderer.dispose();
    },
  };
}
