// Data overlays: one translucent sheet over the map whose per-tile colours live in a small data
// texture (cheap to refresh on rev.derived), plus faint rings showing the reach of producers.
import * as THREE from 'three';
import { BUILDINGS } from '../core/defs';
import type { GameState, OverlayKind } from '../core/types';
import { TileKind } from '../core/types';
import { isOpenWater } from './tiles';
import { linearRGB, ringGeometry, roundedRectRing } from './util';

type RGB = [number, number, number];
function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function ramp(stops: RGB[], t: number): RGB {
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const k = Math.min(stops.length - 2, Math.floor(x));
  const f = x - k;
  const a = stops[k];
  const b = stops[k + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Overlay colours; the UI may want to use the same ones in its legend. */
export const OVERLAY_COLORS = {
  power: '#ffcc2e',
  water: '#36a3ff',
  missing: '#ff4040',
  pollutionLow: '#d8b04a',
  pollutionHigh: '#5e2a6e',
  valueLow: '#e5483b',
  valueMid: '#ffd23f',
  valueHigh: '#33cf6a',
  police: '#3d7bff',
  fire: '#ff5a36',
  health: '#ff5fa2',
  education: '#9b6bff',
} as const;

export class OverlayLayer {
  readonly group = new THREE.Group();
  private tex: THREE.DataTexture | null = null;
  private sheet: THREE.Mesh | null = null;
  private rings: THREE.Mesh | null = null;
  private readonly sheetMat: THREE.MeshBasicMaterial;
  private readonly ringMat: THREE.MeshBasicMaterial;
  private kind: OverlayKind = 'none';
  private size = 0;
  dirty = true;

  constructor() {
    this.group.name = 'overlay';
    this.sheetMat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.ringMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide,
    });
    this.group.visible = false;
  }

  get current(): OverlayKind {
    return this.kind;
  }

  setKind(kind: OverlayKind): void {
    if (kind === this.kind) return;
    this.kind = kind;
    this.dirty = true;
    this.group.visible = kind !== 'none';
  }

  /** New city or map size. */
  setState(state: GameState): void {
    if (state.size !== this.size) {
      this.size = state.size;
      this.tex?.dispose();
      const data = new Uint8Array(state.size * state.size * 4);
      this.tex = new THREE.DataTexture(data, state.size, state.size, THREE.RGBAFormat);
      this.tex.colorSpace = THREE.SRGBColorSpace;
      this.tex.flipY = false;
      this.tex.generateMipmaps = false;
      this.sheetMat.map = this.tex;
      this.sheetMat.needsUpdate = true;
      if (this.sheet) {
        this.group.remove(this.sheet);
        this.sheet.geometry.dispose();
      }
      const n = state.size;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.025, 0, n, 0.025, 0, n, 0.025, n, 0, 0.025, n], 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geo.setIndex([0, 2, 1, 0, 3, 2]);
      geo.computeBoundingSphere();
      this.sheet = new THREE.Mesh(geo, this.sheetMat);
      this.sheet.renderOrder = 2;
      this.sheet.name = 'overlay-sheet';
      this.group.add(this.sheet);
    }
    this.dirty = true;
  }

  rebuild(state: GameState): void {
    this.dirty = false;
    if (this.kind === 'none' || !this.tex) return;
    const kind = this.kind;
    const t = state.tiles;
    const n = state.size * state.size;
    const data = this.tex.image.data as Uint8Array;
    const binary = kind === 'power' || kind === 'water';
    const filter = binary ? THREE.NearestFilter : THREE.LinearFilter;
    if (this.tex.magFilter !== filter) {
      this.tex.magFilter = filter;
      this.tex.minFilter = filter;
    }
    const C = OVERLAY_COLORS;
    const have: RGB = hex(kind === 'water' ? C.water : C.power);
    const missing = hex(C.missing);
    const polRamp = [hex(C.pollutionLow), hex('#b06a3a'), hex(C.pollutionHigh)];
    const valRamp = [hex(C.valueLow), hex(C.valueMid), hex(C.valueHigh)];
    const svc = kind === 'police' || kind === 'fire' || kind === 'health' || kind === 'education' ? hex(C[kind]) : null;

    for (let i = 0; i < n; i++) {
      let c: RGB = [0, 0, 0];
      let a = 0;
      const k = t.kind[i];
      const water = isOpenWater(state, i);
      if (water) {
        // nothing to say about open water
      } else if (binary) {
        const layer = kind === 'power' ? t.power : t.water;
        let needs = k === TileKind.Zone;
        if (k === TileKind.Building) {
          const b = state.buildings[t.bld[i]];
          const def = b ? BUILDINGS[b.type] : null;
          needs = !!def && (kind === 'power' ? def.needsPower || !!def.power : !!def.water || def.needsPower);
          if (def && ((kind === 'power' && def.power) || (kind === 'water' && def.water))) {
            // the producers themselves glow solid
            c = have;
            a = 215;
            setPx(data, i, c, a);
            continue;
          }
        }
        if (layer[i]) {
          c = have;
          a = needs ? 150 : k === TileKind.Road ? 0 : 42;
        } else if (needs) {
          c = missing;
          a = 170;
        }
      } else if (kind === 'pollution') {
        const p = t.pollution[i];
        // transparent texels keep the ramp's hue so linear filtering fades without dark fringes
        c = ramp(polRamp, p / 255);
        if (p > 4) a = Math.min(210, 40 + p * 1.2);
      } else if (kind === 'landValue') {
        c = ramp(valRamp, t.landValue[i] / 255);
        a = k === TileKind.Road ? 60 : 150;
      } else if (svc) {
        const v = t[kind as 'police'][i];
        c = svc;
        if (v > 0) {
          a = Math.min(190, 50 + v * 0.6);
        } else if (k === TileKind.Zone && t.level[i] > 0) {
          c = missing;
          a = 80;
        }
      }
      setPx(data, i, c, a);
    }
    this.tex.needsUpdate = true;
    this.buildRings(state);
  }

  private buildRings(state: GameState): void {
    if (this.rings) {
      this.group.remove(this.rings);
      this.rings.geometry.dispose();
      this.rings = null;
    }
    const kind = this.kind;
    const C = OVERLAY_COLORS;
    const data = { pos: [] as number[], col: [] as number[], idx: [] as number[] };
    for (const b of state.buildings) {
      if (!b) continue;
      const def = BUILDINGS[b.type];
      if (!def) continue;
      let radius = 0;
      let color: string = C.power;
      if (kind === 'power' && def.power) (radius = def.power.radius), (color = C.power);
      else if (kind === 'water' && def.water) (radius = def.water.radius), (color = C.water);
      else if (def.service && def.service.kind === kind) {
        radius = def.service.radius;
        color = C[kind as 'police'];
      }
      if (radius <= 0) continue;
      const lc = linearRGB(color);
      roundedRectRing(b.x, b.z, b.x + b.w, b.z + b.h, radius, 0.12, 0.03, data, [lc[0], lc[1], lc[2], 0.9]);
    }
    if (data.pos.length === 0) return;
    this.rings = new THREE.Mesh(ringGeometry(data), this.ringMat);
    this.rings.renderOrder = 3;
    this.rings.name = 'overlay-rings';
    this.group.add(this.rings);
  }

  dispose(): void {
    this.tex?.dispose();
    this.sheet?.geometry.dispose();
    this.rings?.geometry.dispose();
    this.sheetMat.dispose();
    this.ringMat.dispose();
  }
}

function setPx(data: Uint8Array, i: number, c: RGB, a: number): void {
  data[i * 4] = c[0];
  data[i * 4 + 1] = c[1];
  data[i * 4 + 2] = c[2];
  data[i * 4 + 3] = a;
}
