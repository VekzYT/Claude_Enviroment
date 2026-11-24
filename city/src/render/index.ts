// OWNER: render agent. The 3D world. Keep these signatures.
//
// A bright voxel diorama: the map is a floating slab (grass top, strata on its sides) over a sky
// backdrop with clouds below. Ground and roads are chunked meshes using a pixel-art atlas; lots,
// buildings and trees are instanced per model; cars, lamps, smoke, icons, overlays and previews
// are each one or two draws. Everything is rebuilt only from state.dirty / state.rev changes.
import * as THREE from 'three';
import { carCount } from '../core/config';
import type { GameState, OverlayKind, Plan, Quality, TilePos } from '../core/types';
import { TileKind } from '../core/types';
import { createGroundAtlas } from './atlas';
import { CloudLayer } from './clouds';
import { FxLayer } from './fx';
import { GroundLayer } from './ground';
import { IconLayer } from './icons';
import { InstanceLayer } from './instances';
import { LampLayer, LightPools } from './lamps';
import { createModelMaterial, createModelUniforms, createWaterUniforms } from './materials';
import { OverlayLayer } from './overlay';
import { PreviewLayer } from './preview';
import { SkyLayer } from './sky';
import { TrafficLayer } from './traffic';
import { FACE_DX, FACE_DZ } from './util';

export { OVERLAY_COLORS } from './overlay';
export { toolColor } from './preview';

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

interface QualityProfile {
  /** Highest device pixel ratio rendered. */
  maxPixelRatio: number;
  shadows: boolean;
  shadowMapSize: number;
  shadowRadius: number;
  carShadows: boolean;
  smoke: number;
}

// High renders at 2.5× (on the 15 Pro's 460 ppi screen this is hard to tell from native 3×, and
// costs ~30% fewer pixels, which keeps 60 fps sustainable without heat throttling) with soft
// shadows and car shadows. Medium is the comfortable default for long sessions; low is for
// older phones (no shadow pass at all, which roughly halves the draw calls).
const QUALITY: Record<Quality, QualityProfile> = {
  low: { maxPixelRatio: 1.5, shadows: false, shadowMapSize: 1024, shadowRadius: 1, carShadows: false, smoke: 0.5 },
  medium: { maxPixelRatio: 2, shadows: true, shadowMapSize: 2048, shadowRadius: 2, carShadows: false, smoke: 0.8 },
  high: { maxPixelRatio: 2.5, shadows: true, shadowMapSize: 2048, shadowRadius: 2.5, carShadows: true, smoke: 1 },
};

export function createWorldRenderer(canvas: HTMLCanvasElement, initialState: GameState, initialQuality: Quality): WorldRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 400);
  camera.name = 'world-camera';

  // ---- shared materials and uniforms
  const modelU = createModelUniforms();
  const waterU = createWaterUniforms();
  const modelMat = createModelMaterial(modelU);
  const atlas = createGroundAtlas();
  atlas.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // ---- layers
  const sky = new SkyLayer();
  scene.fog = sky.fog;
  scene.add(sky.backdrop, sky.sun, sky.sun.target, sky.hemi);

  const clouds = new CloudLayer();
  scene.add(clouds.mesh);

  const ground = new GroundLayer(atlas, waterU);
  scene.add(ground.group);

  const fx = new FxLayer();
  scene.add(fx.mesh);

  const instances = new InstanceLayer(modelMat, fx);
  scene.add(instances.group);

  const pools = new LightPools(512);
  scene.add(pools.mesh);
  const lamps = new LampLayer(modelMat, pools, (old, m) => {
    scene.remove(old);
    scene.add(m);
  });
  scene.add(lamps.group);

  const traffic = new TrafficLayer(modelMat);
  scene.add(traffic.group);

  const icons = new IconLayer();
  scene.add(icons.mesh);

  const overlay = new OverlayLayer();
  scene.add(overlay.group);

  const preview = new PreviewLayer((type) => instances.ghostGeometry(type), modelU);
  scene.add(preview.group);

  // ---- bookkeeping
  let state: GameState = initialState;
  let quality: Quality = initialQuality;
  let profile = QUALITY[quality];
  let cssW = Math.max(1, canvas.clientWidth || 852);
  let cssH = Math.max(1, canvas.clientHeight || 393);
  let devicePR = 1;
  let time = 0;
  let lastBuildingsRev = -1;
  let lastDerivedRev = -1;
  let iconsDirty = true;
  /** Our own record of which tiles were roads, to tell when the road network changed. */
  let wasRoad = new Uint8Array(0);
  let disposed = false;

  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();

  function placeDefaultCamera(): void {
    const n = state.size;
    const yaw = Math.PI / 4;
    const pitch = 0.9;
    const dist = Math.max(20, n * 0.65);
    const h = Math.cos(pitch) * dist;
    camera.position.set(n / 2 + Math.sin(yaw) * h, Math.sin(pitch) * dist, n / 2 + Math.cos(yaw) * h);
    camera.lookAt(n / 2, 0, n / 2);
    camera.updateMatrixWorld();
  }

  function applyQuality(): void {
    profile = QUALITY[quality];
    renderer.setPixelRatio(Math.min(devicePR, profile.maxPixelRatio));
    renderer.setSize(cssW, cssH, false);
    const shadowsChanged = renderer.shadowMap.enabled !== profile.shadows;
    renderer.shadowMap.enabled = profile.shadows;
    sky.sun.castShadow = profile.shadows;
    if (sky.sun.shadow.mapSize.x !== profile.shadowMapSize) {
      sky.sun.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize);
      sky.sun.shadow.map?.dispose();
      sky.sun.shadow.map = null;
    }
    sky.sun.shadow.radius = profile.shadowRadius;
    instances.setShadows(profile.shadows);
    traffic.setShadows(profile.shadows && profile.carShadows);
    ground.setShadows(profile.shadows);
    fx.density = profile.smoke;
    if (shadowsChanged) {
      // shadow sampling is compiled into the shaders: recompile everything once
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (Array.isArray(m)) m.forEach((x) => (x.needsUpdate = true));
        else if (m) m.needsUpdate = true;
      });
    }
  }

  function snapshotRoads(s: GameState): void {
    const n = s.size * s.size;
    wasRoad = new Uint8Array(n);
    for (let i = 0; i < n; i++) wasRoad[i] = s.tiles.kind[i] === TileKind.Road ? 1 : 0;
  }

  function loadState(s: GameState): void {
    state = s;
    s.dirty.clear();
    ground.setState(s);
    instances.setState(s);
    traffic.setState(s);
    lamps.rebuild(s);
    overlay.setState(s);
    sky.setMapSize(s.size);
    clouds.build(s.size);
    fx.clear();
    snapshotRoads(s);
    lastBuildingsRev = s.rev.buildings;
    lastDerivedRev = s.rev.derived;
    instances.refreshActivity();
    instances.flush();
    ground.update();
    iconsDirty = true;
    overlay.dirty = true;
    preview.setPreview(null, s);
    preview.refreshSelection(s);
  }

  /** Pull in tile changes the simulation recorded since last frame. */
  function consumeDirty(s: GameState): void {
    const dirty = s.dirty;
    if (dirty.size === 0) return;
    const animate = InstanceLayer.animateFor(dirty.size);
    let roadsChanged = false;
    const size = s.size;
    for (const i of dirty) {
      if (i < 0 || i >= size * size) continue;
      ground.markTile(i);
      instances.updateTile(i, animate);
      const isRoad = s.tiles.kind[i] === TileKind.Road ? 1 : 0;
      if (isRoad !== wasRoad[i]) {
        wasRoad[i] = isRoad;
        roadsChanged = true;
        // lots up to three tiles away may now face a different road
        const x = i % size;
        const z = (i / size) | 0;
        for (let r = 0; r < 4; r++) {
          for (let d = 1; d <= 3; d++) {
            const nx = x + FACE_DX[r] * d;
            const nz = z + FACE_DZ[r] * d;
            if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue;
            const j = nz * size + nx;
            if (s.tiles.kind[j] !== TileKind.Zone) continue;
            instances.updateTile(j, false);
            ground.markChunkAt(nx, nz);
          }
        }
      }
    }
    dirty.clear();
    if (roadsChanged) {
      traffic.rebuildRoads();
      lamps.rebuild(s);
    }
    iconsDirty = true;
  }

  const world: WorldRenderer = {
    renderer,
    scene,
    camera,

    resize(width, height, pixelRatio) {
      cssW = Math.max(1, Math.floor(width));
      cssH = Math.max(1, Math.floor(height));
      devicePR = pixelRatio > 0 ? pixelRatio : 1;
      renderer.setPixelRatio(Math.min(devicePR, profile.maxPixelRatio));
      renderer.setSize(cssW, cssH, false);
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
    },

    setQuality(q) {
      if (!QUALITY[q]) return;
      quality = q;
      applyQuality();
    },

    setOverlay(kind) {
      overlay.setKind(kind);
      if (overlay.dirty) overlay.rebuild(state);
    },

    setPreview(plan) {
      preview.setPreview(plan, state);
    },

    setSelection(tile) {
      preview.setSelection(tile, state);
    },

    setState(s) {
      loadState(s);
    },

    update(dt, s) {
      if (disposed) return;
      // a different city, or the same object resized by a load: rebuild from scratch
      if (s !== state || s.size * s.size !== wasRoad.length) loadState(s);
      const step = Math.max(0, Math.min(0.25, Number.isFinite(dt) ? dt : 0));
      time += step;

      // light and colour for the time of day
      sky.setTime(s.timeOfDay);
      modelU.uNight.value = sky.night;
      modelU.uGlass.value.copy(sky.glass);
      waterU.uTime.value = time;
      waterU.uNight.value = sky.night;

      // changes from the simulation
      consumeDirty(s);
      if (s.rev.buildings !== lastBuildingsRev) {
        lastBuildingsRev = s.rev.buildings;
        instances.syncBuildings(true);
        iconsDirty = true;
        preview.refreshSelection(s);
      }
      if (s.rev.derived !== lastDerivedRev) {
        lastDerivedRev = s.rev.derived;
        instances.refreshActivity();
        iconsDirty = true;
        overlay.dirty = true;
      }
      ground.update();
      instances.flush();
      if (iconsDirty) {
        iconsDirty = false;
        icons.rebuild(s, (i) => instances.heightAt(i));
      }
      if (overlay.dirty) overlay.rebuild(s);

      // animation
      instances.tick(step, time);
      fx.update(step, instances.emitters, instances.emitterCount, sky.night);
      traffic.target = carCount(s.stats.population, s.stats.jobsCom + s.stats.jobsInd);
      const lights = traffic.update(step, pools, sky.night);
      pools.commit(sky.night, lights);
      icons.update(time, sky.viewDistance);
      preview.update(time);
      clouds.update(step);
    },

    render() {
      if (disposed) return;
      camera.updateMatrixWorld();
      sky.prepare(camera, profile.shadows, profile.shadowMapSize);
      icons.update(time, sky.viewDistance);
      renderer.render(scene, camera);
    },

    pickTile(clientX, clientY) {
      const w = cssW || canvas.clientWidth;
      const h = cssH || canvas.clientHeight;
      if (!w || !h) return null;
      ndc.set((clientX / w) * 2 - 1, -(clientY / h) * 2 + 1);
      camera.updateMatrixWorld();
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(groundPlane, hit)) return null;
      const x = Math.floor(hit.x);
      const z = Math.floor(hit.z);
      if (x < 0 || z < 0 || x >= state.size || z >= state.size) return null;
      return { x, z };
    },

    stats() {
      return { drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      ground.dispose();
      instances.dispose();
      traffic.dispose();
      lamps.dispose();
      pools.dispose();
      fx.dispose();
      icons.dispose();
      overlay.dispose();
      preview.dispose();
      clouds.dispose();
      sky.dispose();
      modelMat.dispose();
      atlas.texture.dispose();
      renderer.dispose();
    },
  };

  placeDefaultCamera();
  applyQuality();
  loadState(initialState);
  sky.setTime(initialState.timeOfDay);
  return world;
}
