// Everything that stands on the map and comes from the models API: developed lots, placed
// buildings and tree clumps. One InstancedMesh per model (body and glow share one geometry and one
// draw), rebuilt only for groups whose members changed.
import * as THREE from 'three';
import { BUILDINGS } from '../core/defs';
import { hash01 } from '../core/rng';
import type { GameState, PlacedBuilding } from '../core/types';
import { Terrain, TileKind } from '../core/types';
import { buildingModel, treeModel, zoneModel, ZONE_VARIANTS, type ModelParts } from './models';
import { lotFacing } from './tiles';
import { writeYRot } from './util';

/** Seconds a new building takes to grow out of the ground. */
const GROW_TIME = 0.55;
/** If more tiles than this change at once (a load, an undo of a huge drag), skip animations. */
const BULK_LIMIT = 160;

interface Inst {
  group: Group;
  index: number;
  /** World centre of the footprint and quarter turns. */
  x: number;
  z: number;
  rot: number;
  /** Seconds since growth started, or −1 when fully grown. */
  growT: number;
  /** Tile index for lots and trees, −1 for buildings. */
  tile: number;
  /** Building id, or −1. */
  bid: number;
  /** Working (powered lot / active building): only active ones smoke. */
  active: boolean;
}

interface SpinPart {
  geom: THREE.BufferGeometry;
  mesh: THREE.InstancedMesh | null;
  pivot: THREE.Vector3;
  axis: 'x' | 'y' | 'z';
  speed: number;
}

interface Group {
  key: string;
  parts: ModelParts;
  geom: THREE.BufferGeometry;
  mesh: THREE.InstancedMesh | null;
  members: Inst[];
  dirty: boolean;
  spin: SpinPart | null;
}

export interface DustSink {
  dust(x: number, z: number, w: number, h: number): void;
}

const geomCache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/**
 * One geometry holding a model's body and glow parts: position, normal, color and aGlow (1 on
 * glow vertices). Works whatever the models module hands over (indexed or not, with or without
 * normals or colours).
 */
export function combineParts(parts: { body: THREE.BufferGeometry; glow: THREE.BufferGeometry | null }): THREE.BufferGeometry {
  const cachedG = geomCache.get(parts.body);
  if (cachedG && (cachedG.userData.glowSrc ?? null) === parts.glow) return cachedG;
  const srcs: Array<[THREE.BufferGeometry, number]> = [[parts.body, 0]];
  if (parts.glow) srcs.push([parts.glow, 1]);
  const flat: Array<[THREE.BufferGeometry, number, boolean]> = [];
  let total = 0;
  for (const [g, glow] of srcs) {
    let ng = g.index ? g.toNonIndexed() : g;
    let owned = ng !== g;
    if (!ng.getAttribute('normal')) {
      if (!owned) {
        ng = ng.clone();
        owned = true;
      }
      ng.computeVertexNormals();
    }
    flat.push([ng, glow, owned]);
    total += ng.getAttribute('position').count;
  }
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const glw = new Float32Array(total);
  let o = 0;
  for (const [g, glow, owned] of flat) {
    const p = g.getAttribute('position');
    const nr = g.getAttribute('normal');
    const c = g.getAttribute('color');
    for (let k = 0; k < p.count; k++, o++) {
      pos[o * 3] = p.getX(k);
      pos[o * 3 + 1] = p.getY(k);
      pos[o * 3 + 2] = p.getZ(k);
      nor[o * 3] = nr.getX(k);
      nor[o * 3 + 1] = nr.getY(k);
      nor[o * 3 + 2] = nr.getZ(k);
      if (c) {
        col[o * 3] = c.getX(k);
        col[o * 3 + 1] = c.getY(k);
        col[o * 3 + 2] = c.getZ(k);
      } else if (glow) {
        col[o * 3] = 1;
        col[o * 3 + 1] = 0.85;
        col[o * 3 + 2] = 0.55;
      } else {
        col[o * 3] = col[o * 3 + 1] = col[o * 3 + 2] = 0.8;
      }
      glw[o] = glow;
    }
    if (owned) g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('aGlow', new THREE.BufferAttribute(glw, 1));
  out.computeBoundingSphere();
  out.computeBoundingBox();
  out.userData.glowSrc = parts.glow;
  geomCache.set(parts.body, out);
  return out;
}

export class InstanceLayer {
  readonly group = new THREE.Group();
  private groups = new Map<string, Group>();
  /** The same groups as a plain array, for allocation-free per-frame loops. */
  private groupList: Group[] = [];
  private tileInst: Array<Inst | null> = [];
  private bldInst = new Map<number, Inst>();
  private growing: Inst[] = [];
  private spinGroups: Group[] = [];
  private state: GameState | null = null;
  private shadows = true;
  /** Smoke emitter positions (x, y, z) of active smoking models, refreshed on change. */
  emitters = new Float32Array(0);
  emitterCount = 0;
  private emittersDirty = true;

  // scratch
  private readonly mBase = new THREE.Matrix4();
  private readonly mLocal = new THREE.Matrix4();
  private readonly mOut = new THREE.Matrix4();
  private readonly arr = new Float32Array(16);

  constructor(
    private readonly material: THREE.Material,
    private readonly dustSink: DustSink,
  ) {
    this.group.name = 'models';
  }

  setShadows(on: boolean): void {
    this.shadows = on;
    for (const g of this.groups.values()) {
      if (g.mesh) g.mesh.castShadow = on;
      if (g.spin?.mesh) g.spin.mesh.castShadow = on;
    }
  }

  /** Throw everything away and place the whole city again, without animation. */
  setState(state: GameState): void {
    this.state = state;
    for (const g of this.groups.values()) {
      if (g.mesh) {
        this.group.remove(g.mesh);
        g.mesh.dispose();
      }
      if (g.spin?.mesh) {
        this.group.remove(g.spin.mesh);
        g.spin.mesh.dispose();
      }
    }
    this.groups.clear();
    this.groupList = [];
    this.spinGroups = [];
    this.growing = [];
    this.bldInst.clear();
    const n = state.size * state.size;
    this.tileInst = new Array(n).fill(null);
    for (let i = 0; i < n; i++) this.updateTile(i, false);
    this.syncBuildings(false);
    this.flush();
  }

  /** How many tiles changed at once decides whether changes animate. */
  static animateFor(changed: number): boolean {
    return changed <= BULK_LIMIT;
  }

  /** Re-evaluate the lot or tree on tile i. */
  updateTile(i: number, animate: boolean): void {
    const s = this.state;
    if (!s) return;
    const t = s.tiles;
    const x = i % s.size;
    const z = (i / s.size) | 0;
    let parts: ModelParts | null = null;
    let key = '';
    let rot = 0;
    const kind = t.kind[i];
    if (kind === TileKind.Zone && t.level[i] > 0 && t.zone[i] >= 1 && t.zone[i] <= 3) {
      const lvl = Math.min(3, t.level[i]);
      const v = t.variant[i] % ZONE_VARIANTS;
      key = `z${t.zone[i]}-${lvl}-${v}`;
      parts = this.groups.get(key)?.parts ?? zoneModel(t.zone[i], lvl, v);
      rot = lotFacing(s, x, z);
    } else if (kind === TileKind.Empty && t.trees[i] > 0 && t.terrain[i] !== Terrain.Water) {
      const v = Math.min(3, t.trees[i]);
      key = `t${v}`;
      parts = this.groups.get(key)?.parts ?? treeModel(v);
      rot = (hash01(x, z, 17) * 4) | 0;
    }
    const cur = this.tileInst[i];
    if (cur && cur.group.key === key) {
      if (cur.rot !== rot) {
        cur.rot = rot;
        cur.group.dirty = true;
      }
      return;
    }
    if (cur) {
      this.removeInst(cur);
      this.tileInst[i] = null;
      // a lot that lost its building (bulldozed or declined to empty) kicks up dust
      if (animate && !parts && cur.group.key[0] === 'z') this.dustSink.dust(x, z, 1, 1);
    }
    if (parts) {
      const inst = this.addInst(key, parts, x + 0.5, z + 0.5, rot, i, -1);
      this.tileInst[i] = inst;
      if (animate) {
        this.startGrow(inst);
        if (key[0] === 'z') this.dustSink.dust(x, z, 1, 1);
      }
    }
  }

  /** Placed buildings changed (state.rev.buildings): add, move or remove instances. */
  syncBuildings(animate: boolean): void {
    const s = this.state;
    if (!s) return;
    const seen = new Set<number>();
    // a load or a big undo changes many buildings at once: place those without fanfare
    let changes = 0;
    for (const b of s.buildings) {
      if (!b || !BUILDINGS[b.type]) continue;
      const cur = this.bldInst.get(b.id);
      if (!cur || cur.group.key !== `b-${b.type}` || cur.x !== b.x + b.w / 2 || cur.z !== b.z + b.h / 2) changes++;
    }
    if (changes > 12) animate = false;
    for (const b of s.buildings) {
      if (!b || !BUILDINGS[b.type]) continue;
      seen.add(b.id);
      const key = `b-${b.type}`;
      const cx = b.x + b.w / 2;
      const cz = b.z + b.h / 2;
      const rot = ((b.rot % 4) + 4) % 4;
      const cur = this.bldInst.get(b.id);
      if (cur && cur.group.key === key && cur.x === cx && cur.z === cz) {
        if (cur.rot !== rot) {
          cur.rot = rot;
          cur.group.dirty = true;
        }
        continue;
      }
      if (cur) this.removeInst(cur);
      const parts = this.groups.get(key)?.parts ?? buildingModel(b.type);
      const inst = this.addInst(key, parts, cx, cz, rot, -1, b.id);
      inst.active = b.active;
      this.bldInst.set(b.id, inst);
      if (animate) {
        this.startGrow(inst);
        this.dustSink.dust(b.x, b.z, b.w, b.h);
      }
    }
    for (const [id, inst] of this.bldInst) {
      if (seen.has(id)) continue;
      const g = inst.group;
      this.removeInst(inst);
      this.bldInst.delete(id);
      if (animate) {
        const size = BUILDINGS[g.key.slice(2) as PlacedBuilding['type']]?.size ?? 1;
        this.dustSink.dust(inst.x - size / 2, inst.z - size / 2, size, size);
      }
    }
    this.emittersDirty = true;
  }

  /** Derived layers changed: which lots are powered and which buildings work (for smoke). */
  refreshActivity(): void {
    const s = this.state;
    if (!s) return;
    for (const g of this.groups.values()) {
      if (!g.parts.smoke || g.parts.smoke.length === 0) continue;
      for (const inst of g.members) {
        if (inst.tile >= 0) inst.active = s.tiles.power[inst.tile] === 1;
        else {
          const b = s.buildings[inst.bid];
          inst.active = !!b && b.active;
        }
      }
    }
    this.emittersDirty = true;
  }

  /** Height of whatever stands on tile i (0 if nothing), for floating icons. */
  heightAt(i: number): number {
    const inst = this.tileInst[i];
    if (inst) return inst.group.parts.height;
    const s = this.state;
    if (s && s.tiles.kind[i] === TileKind.Building) {
      const b = this.bldInst.get(s.tiles.bld[i]);
      if (b) return b.group.parts.height;
    }
    return 0;
  }

  /** Rebuild the instance buffers of groups whose members changed. */
  flush(): void {
    for (let k = 0; k < this.groupList.length; k++) {
      const g = this.groupList[k];
      if (!g.dirty) continue;
      g.dirty = false;
      this.writeGroup(g);
    }
    if (this.emittersDirty) this.rebuildEmitters();
  }

  /** Per frame: growth animations and spinning rotors. No allocation. */
  tick(dt: number, time: number): void {
    if (this.growing.length) {
      for (let k = this.growing.length - 1; k >= 0; k--) {
        const inst = this.growing[k];
        inst.growT += dt;
        if (inst.growT >= GROW_TIME || inst.index < 0) {
          inst.growT = -1;
          this.growing[k] = this.growing[this.growing.length - 1];
          this.growing.pop();
        }
        if (inst.index < 0) continue;
        const m = inst.group.mesh;
        if (!m) continue;
        this.writeInst(inst, m.instanceMatrix.array as Float32Array);
        m.instanceMatrix.needsUpdate = true;
      }
    }
    for (let gi = 0; gi < this.spinGroups.length; gi++) {
      const g = this.spinGroups[gi];
      const sp = g.spin;
      if (!sp || !sp.mesh || g.members.length === 0) continue;
      const arr = sp.mesh.instanceMatrix.array as Float32Array;
      for (let mi = 0; mi < g.members.length; mi++) {
        const inst = g.members[mi];
        const phase = hash01(inst.x * 7, inst.z * 3, 5) * 6.28;
        const ang = time * sp.speed + phase;
        this.writeInst(inst, this.arr, 0);
        this.mBase.fromArray(this.arr);
        if (sp.axis === 'x') this.mLocal.makeRotationX(ang);
        else if (sp.axis === 'y') this.mLocal.makeRotationY(ang);
        else this.mLocal.makeRotationZ(ang);
        this.mLocal.setPosition(sp.pivot);
        this.mOut.multiplyMatrices(this.mBase, this.mLocal);
        this.mOut.toArray(arr, inst.index * 16);
      }
      sp.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /** Combined body + glow geometry of a building type (used by the preview ghost). */
  ghostGeometry(type: PlacedBuilding['type']): THREE.BufferGeometry {
    return combineParts(buildingModel(type));
  }

  dispose(): void {
    // geometries stay cached (and usable: three re-uploads on next use); free their GPU buffers
    for (const g of this.groups.values()) {
      if (g.mesh) g.mesh.dispose();
      if (g.spin?.mesh) g.spin.mesh.dispose();
      g.geom.dispose();
      g.spin?.geom.dispose();
    }
    this.groups.clear();
    this.groupList = [];
  }

  // ------------------------------------------------------------------ internals

  private getGroup(key: string, parts: ModelParts): Group {
    let g = this.groups.get(key);
    if (!g) {
      g = {
        key,
        parts,
        geom: combineParts(parts),
        mesh: null,
        members: [],
        dirty: true,
        spin: parts.spinner
          ? {
              geom: combineParts({ body: parts.spinner.geometry, glow: null }),
              mesh: null,
              pivot: parts.spinner.pivot.clone(),
              axis: parts.spinner.axis,
              speed: parts.spinner.speed,
            }
          : null,
      };
      this.groups.set(key, g);
      this.groupList.push(g);
      if (g.spin) this.spinGroups.push(g);
    }
    return g;
  }

  private addInst(key: string, parts: ModelParts, x: number, z: number, rot: number, tile: number, bid: number): Inst {
    const g = this.getGroup(key, parts);
    const inst: Inst = { group: g, index: g.members.length, x, z, rot, growT: -1, tile, bid, active: true };
    if (tile >= 0 && this.state) inst.active = this.state.tiles.power[tile] === 1;
    g.members.push(inst);
    g.dirty = true;
    if (parts.smoke && parts.smoke.length) this.emittersDirty = true;
    return inst;
  }

  private removeInst(inst: Inst): void {
    const g = inst.group;
    const last = g.members.pop()!;
    if (last !== inst) {
      g.members[inst.index] = last;
      last.index = inst.index;
    }
    inst.index = -1;
    g.dirty = true;
    if (g.parts.smoke && g.parts.smoke.length) this.emittersDirty = true;
  }

  private startGrow(inst: Inst): void {
    inst.growT = 0;
    this.growing.push(inst);
  }

  /** Instance transform, including the grow-from-the-ground animation. */
  private writeInst(inst: Inst, arr: Float32Array, offset = inst.index * 16): void {
    let sy = 1;
    let sxz = 1;
    if (inst.growT >= 0) {
      const p = Math.min(1, inst.growT / GROW_TIME);
      // ease-out-back: a little overshoot, then settle
      const c1 = 1.9;
      const q = p - 1;
      sy = Math.max(0.02, 1 + (c1 + 1) * q * q * q + c1 * q * q);
      sxz = 0.82 + 0.18 * (1 - (1 - p) * (1 - p));
    }
    writeYRot(arr, offset, inst.x, 0, inst.z, inst.rot * (Math.PI / 2), sxz, sy);
  }

  private writeGroup(g: Group): void {
    const count = g.members.length;
    if (count === 0) {
      if (g.mesh) g.mesh.visible = false;
      if (g.spin?.mesh) g.spin.mesh.visible = false;
      return;
    }
    if (!g.mesh || g.mesh.instanceMatrix.count < count) {
      const cap = Math.max(8, Math.ceil(count * 1.5));
      if (g.mesh) {
        this.group.remove(g.mesh);
        g.mesh.dispose();
      }
      g.mesh = this.makeMesh(g.geom, cap, `m-${g.key}`);
      if (g.spin) {
        if (g.spin.mesh) {
          this.group.remove(g.spin.mesh);
          g.spin.mesh.dispose();
        }
        g.spin.mesh = this.makeMesh(g.spin.geom, cap, `s-${g.key}`);
      }
    }
    const arr = g.mesh.instanceMatrix.array as Float32Array;
    for (const inst of g.members) this.writeInst(inst, arr);
    g.mesh.count = count;
    g.mesh.visible = true;
    g.mesh.instanceMatrix.needsUpdate = true;
    g.mesh.computeBoundingSphere();
    if (g.spin?.mesh) {
      g.spin.mesh.count = count;
      g.spin.mesh.visible = true;
      // the rotor's matrices are written every frame in tick(); the sphere only needs the spread
      const sa = g.spin.mesh.instanceMatrix.array as Float32Array;
      for (const inst of g.members) this.writeInst(inst, sa);
      g.spin.mesh.computeBoundingSphere();
      if (g.spin.mesh.boundingSphere) g.spin.mesh.boundingSphere.radius += 2;
    }
  }

  private makeMesh(geom: THREE.BufferGeometry, cap: number, name: string): THREE.InstancedMesh {
    const m = new THREE.InstancedMesh(geom, this.material, cap);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.castShadow = this.shadows;
    m.receiveShadow = true;
    m.count = 0;
    m.name = name;
    m.matrixAutoUpdate = false;
    this.group.add(m);
    return m;
  }

  private rebuildEmitters(): void {
    this.emittersDirty = false;
    let n = 0;
    for (const g of this.groups.values()) if (g.parts.smoke) n += g.parts.smoke.length * g.members.length;
    if (this.emitters.length < n * 3) this.emitters = new Float32Array(Math.max(48, n * 3));
    let k = 0;
    for (const g of this.groups.values()) {
      const pts = g.parts.smoke;
      if (!pts || !pts.length) continue;
      for (const inst of g.members) {
        if (!inst.active) continue;
        const a = inst.rot * (Math.PI / 2);
        const c = Math.cos(a);
        const s = Math.sin(a);
        for (const p of pts) {
          // rotate the local point like the model: x' = x cos + z sin, z' = −x sin + z cos
          this.emitters[k * 3] = inst.x + p.x * c + p.z * s;
          this.emitters[k * 3 + 1] = p.y;
          this.emitters[k * 3 + 2] = inst.z - p.x * s + p.z * c;
          k++;
        }
      }
    }
    this.emitterCount = k;
  }
}
