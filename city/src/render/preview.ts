// What a drag would do (tinted tiles, a see-through ghost of the building, and a ring showing its
// reach) and the outline around the inspected tile or building.
import * as THREE from 'three';
import { BUILDINGS, ZONE_COLORS, buildingTypeOf } from '../core/defs';
import type { BuildingType, GameState, Plan, TilePos, ToolId } from '../core/types';
import { TileKind } from '../core/types';
import { applyGlowPatch, type ModelUniforms } from './materials';
import { OVERLAY_COLORS } from './overlay';
import { linearRGB, ringGeometry, roundedRectRing } from './util';

const BAD = new THREE.Color('#ff3b30');

export function toolColor(tool: ToolId): string {
  switch (tool) {
    case 'road':
      return '#f4f1e8';
    case 'zone_res':
      return ZONE_COLORS.res;
    case 'zone_com':
      return ZONE_COLORS.com;
    case 'zone_ind':
      return ZONE_COLORS.ind;
    case 'bulldoze':
      return '#ff8a3d';
    case 'inspect':
      return '#ffffff';
    default:
      return '#5fd4ff';
  }
}

/** The colour and radius of the reach ring shown while placing a building, if it has one. */
function reachOf(type: BuildingType): { radius: number; color: string } | null {
  const def = BUILDINGS[type];
  if (def.power) return { radius: def.power.radius, color: OVERLAY_COLORS.power };
  if (def.water) return { radius: def.water.radius, color: OVERLAY_COLORS.water };
  if (def.service) {
    const k = def.service.kind;
    const color = k === 'parks' ? '#3ccf6a' : OVERLAY_COLORS[k];
    return { radius: def.service.radius, color };
  }
  if (def.landValue) return { radius: def.landValue.radius, color: '#3ccf6a' };
  return null;
}

function cursorTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = 12;
  const path = (x: number, y: number, w: number, h: number) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  path(4, 4, 56, 56);
  g.fillStyle = 'rgba(255,255,255,0.42)';
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class PreviewLayer {
  readonly group = new THREE.Group();
  private tiles: THREE.InstancedMesh;
  private tileCap = 64;
  private readonly tileGeo: THREE.PlaneGeometry;
  private readonly tileMat: THREE.MeshBasicMaterial;
  private readonly ghost: THREE.Mesh;
  private readonly ghostDepth: THREE.Mesh;
  private readonly ghostMat: THREE.MeshLambertMaterial;
  private ghostKey = '';
  private reach: THREE.Mesh | null = null;
  private reachKey = '';
  private readonly ringMat: THREE.MeshBasicMaterial;
  private selection: THREE.Mesh | null = null;
  private selKey = '';
  private readonly selMat: THREE.MeshBasicMaterial;
  private selTile: TilePos | null = null;
  private readonly tmpColor = new THREE.Color();
  private readonly tmpMat = new THREE.Matrix4();

  constructor(
    private readonly ghostGeometry: (type: BuildingType) => THREE.BufferGeometry,
    modelUniforms: ModelUniforms,
  ) {
    this.group.name = 'preview';
    this.tileGeo = new THREE.PlaneGeometry(1, 1);
    this.tileGeo.rotateX(-Math.PI / 2);
    this.tileMat = new THREE.MeshBasicMaterial({
      map: cursorTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    this.tiles = this.makeTiles(this.tileCap);

    this.ghostMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      emissive: new THREE.Color('#1d4a66'),
    });
    applyGlowPatch(this.ghostMat, modelUniforms);
    const empty = new THREE.BufferGeometry();
    // depth-only pass first, so the see-through ghost only shows its outer surface
    this.ghostDepth = new THREE.Mesh(empty, new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, depthWrite: true }));
    this.ghostDepth.renderOrder = 8;
    this.ghost = new THREE.Mesh(empty, this.ghostMat);
    this.ghost.renderOrder = 9;
    this.ghost.visible = this.ghostDepth.visible = false;
    this.group.add(this.ghostDepth, this.ghost);

    this.ringMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide,
    });
    this.selMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide,
    });
  }

  private makeTiles(cap: number): THREE.InstancedMesh {
    const m = new THREE.InstancedMesh(this.tileGeo, this.tileMat, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 6;
    m.name = 'preview-tiles';
    m.visible = false;
    this.group.add(m);
    return m;
  }

  setPreview(plan: Plan | null, state: GameState | null): void {
    if (!plan || !state || plan.tiles.length === 0) {
      this.tiles.visible = false;
      this.hideGhost();
      return;
    }
    const n = plan.tiles.length;
    if (n > this.tileCap) {
      this.group.remove(this.tiles);
      this.tiles.dispose();
      this.tileCap = Math.ceil(n * 1.5);
      this.tiles = this.makeTiles(this.tileCap);
    }
    const good = new THREE.Color(toolColor(plan.tool));
    const size = state.size;
    for (let k = 0; k < n; k++) {
      const i = plan.tiles[k];
      const x = i % size;
      const z = (i / size) | 0;
      this.tmpMat.makeTranslation(x + 0.5, 0.035, z + 0.5);
      this.tiles.setMatrixAt(k, this.tmpMat);
      const ok = plan.ok[k] !== false;
      this.tmpColor.copy(ok ? good : BAD);
      this.tiles.setColorAt(k, this.tmpColor);
    }
    this.tiles.count = n;
    this.tiles.visible = true;
    this.tiles.instanceMatrix.needsUpdate = true;
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;

    const type = plan.building?.type ?? buildingTypeOf(plan.tool);
    if (plan.building && type && BUILDINGS[type]) this.showGhost(plan.building, plan.valid);
    else this.hideGhost();
  }

  private showGhost(b: NonNullable<Plan['building']>, valid: boolean): void {
    if (this.ghostKey !== b.type) {
      this.ghostKey = b.type;
      const geo = this.ghostGeometry(b.type);
      this.ghost.geometry = geo;
      this.ghostDepth.geometry = geo;
    }
    const cx = b.x + b.w / 2;
    const cz = b.z + b.h / 2;
    for (const m of [this.ghost, this.ghostDepth]) {
      m.position.set(cx, 0.02, cz);
      m.rotation.set(0, (((b.rot % 4) + 4) % 4) * (Math.PI / 2), 0);
      m.visible = true;
    }
    this.ghostMat.color.set(valid ? '#ffffff' : '#ff9a90');
    this.ghostMat.emissive.set(valid ? '#1d4a66' : '#6a1010');

    const reach = reachOf(b.type);
    const key = reach ? `${b.x},${b.z},${b.w},${b.h},${reach.radius},${valid}` : '';
    if (key !== this.reachKey) {
      this.reachKey = key;
      if (this.reach) {
        this.group.remove(this.reach);
        this.reach.geometry.dispose();
        this.reach = null;
      }
      if (reach) {
        const data = { pos: [] as number[], col: [] as number[], idx: [] as number[] };
        const c = linearRGB(valid ? reach.color : '#ff3b30');
        roundedRectRing(b.x, b.z, b.x + b.w, b.z + b.h, reach.radius, 0.12, 0.04, data, [c[0], c[1], c[2], 0.9], 0.1);
        this.reach = new THREE.Mesh(ringGeometry(data), this.ringMat);
        this.reach.renderOrder = 5;
        this.reach.name = 'preview-reach';
        this.group.add(this.reach);
      }
    }
    if (this.reach) this.reach.visible = true;
  }

  private hideGhost(): void {
    this.ghost.visible = false;
    this.ghostDepth.visible = false;
    if (this.reach) this.reach.visible = false;
  }

  setSelection(tile: TilePos | null, state: GameState | null): void {
    this.selTile = tile ? { x: tile.x, z: tile.z } : null;
    this.refreshSelection(state);
  }

  /** Recompute the outline footprint (the building under the selection may have changed). */
  refreshSelection(state: GameState | null): void {
    const tile = this.selTile;
    if (!tile || !state || tile.x < 0 || tile.z < 0 || tile.x >= state.size || tile.z >= state.size) {
      if (this.selection) this.selection.visible = false;
      return;
    }
    let x0 = tile.x, z0 = tile.z, w = 1, h = 1;
    const i = tile.z * state.size + tile.x;
    if (state.tiles.kind[i] === TileKind.Building) {
      const b = state.buildings[state.tiles.bld[i]];
      if (b) (x0 = b.x), (z0 = b.z), (w = b.w), (h = b.h);
    }
    const key = `${x0},${z0},${w},${h}`;
    if (key !== this.selKey || !this.selection) {
      this.selKey = key;
      if (this.selection) {
        this.group.remove(this.selection);
        this.selection.geometry.dispose();
      }
      const data = { pos: [] as number[], col: [] as number[], idx: [] as number[] };
      roundedRectRing(x0, z0, x0 + w, z0 + h, 0.06, 0.09, 0.05, data, [1, 1, 1, 1], 0.12);
      this.selection = new THREE.Mesh(ringGeometry(data), this.selMat);
      this.selection.renderOrder = 10;
      this.selection.name = 'selection';
      this.group.add(this.selection);
    }
    this.selection.visible = true;
  }

  update(time: number): void {
    // gentle pulses so the player's eye finds them
    this.selMat.opacity = 0.75 + 0.25 * Math.sin(time * 4);
    this.ghostMat.opacity = 0.55 + 0.1 * Math.sin(time * 3);
  }

  dispose(): void {
    this.tiles.dispose();
    this.tileGeo.dispose();
    this.tileMat.map?.dispose();
    this.tileMat.dispose();
    this.ghostMat.dispose();
    (this.ghostDepth.material as THREE.Material).dispose();
    this.reach?.geometry.dispose();
    this.selection?.geometry.dispose();
    this.ringMat.dispose();
    this.selMat.dispose();
  }
}
