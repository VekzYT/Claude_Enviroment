// OWNER: sim agent. Save files are JSON text; typed arrays are stored as base64.
import { HISTORY_MONTHS, MAX_TAX, MILESTONES, SAVE_VERSION } from '../core/config';
import { BUILDINGS } from '../core/defs';
import { createState, markAll } from '../core/state';
import type { BuildingType, GameState, MonthRecord, PlacedBuilding, Speed } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';
import { recompute } from './recompute';

const FORMAT = 'cubopolis-save';
const MIN_SIZE = 8;
const MAX_SIZE = 256;
const MAX_NAME = 40;

// ---------- base64 (no reliance on btoa/Buffer, so it behaves the same in WebKit and Node) ----------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = new Int16Array(128).fill(-1);
for (let k = 0; k < B64.length; k++) B64_INDEX[B64.charCodeAt(k)] = k;

export function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  let chunk = '';
  for (let k = 0; k < bytes.length; k += 3) {
    const a = bytes[k];
    const b = k + 1 < bytes.length ? bytes[k + 1] : 0;
    const c = k + 2 < bytes.length ? bytes[k + 2] : 0;
    chunk += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    chunk += k + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : '=';
    chunk += k + 2 < bytes.length ? B64[c & 63] : '=';
    if (chunk.length >= 4096) {
      parts.push(chunk);
      chunk = '';
    }
  }
  parts.push(chunk);
  return parts.join('');
}

export function base64ToBytes(text: string, what: string): Uint8Array {
  if (typeof text !== 'string' || text.length % 4 !== 0) throw new Error(`Save is damaged: ${what} data is not valid.`);
  let pad = 0;
  if (text.endsWith('==')) pad = 2;
  else if (text.endsWith('=')) pad = 1;
  const out = new Uint8Array((text.length / 4) * 3 - pad);
  let o = 0;
  for (let k = 0; k < text.length; k += 4) {
    const v: number[] = [0, 0, 0, 0];
    for (let j = 0; j < 4; j++) {
      const ch = text.charCodeAt(k + j);
      if (ch === 61 /* = */ && k + j >= text.length - pad) {
        v[j] = 0;
        continue;
      }
      const d = ch < 128 ? B64_INDEX[ch] : -1;
      if (d < 0) throw new Error(`Save is damaged: ${what} data is not valid.`);
      v[j] = d;
    }
    const n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}

function int32ToBytes(a: Int32Array): Uint8Array {
  const out = new Uint8Array(a.length * 4);
  const dv = new DataView(out.buffer);
  for (let k = 0; k < a.length; k++) dv.setInt32(k * 4, a[k], true);
  return out;
}

function bytesToInt32(b: Uint8Array): Int32Array {
  const out = new Int32Array(b.length / 4);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  for (let k = 0; k < out.length; k++) out[k] = dv.getInt32(k * 4, true);
  return out;
}

// ---------- serialize ----------

const BYTE_LAYERS = ['terrain', 'trees', 'kind', 'zone', 'level', 'variant', 'distress'] as const;

export function serialize(state: GameState): string {
  const T = state.tiles;
  const layers: Record<string, string> = {};
  for (const name of BYTE_LAYERS) layers[name] = bytesToBase64(T[name]);
  layers.bld = bytesToBase64(int32ToBytes(T.bld));
  const data = {
    format: FORMAT,
    version: SAVE_VERSION,
    name: state.name,
    seed: state.seed,
    size: state.size,
    day: state.day,
    timeOfDay: state.timeOfDay,
    speed: state.speed,
    money: state.money,
    taxes: { res: state.taxes.res, com: state.taxes.com, ind: state.taxes.ind },
    milestone: state.milestone,
    monthsInDebt: state.monthsInDebt,
    happiness: state.stats.happiness,
    buildings: state.buildings.map((b) =>
      b ? { id: b.id, type: b.type, x: b.x, z: b.z, w: b.w, h: b.h, rot: b.rot, active: b.active } : null,
    ),
    history: state.history.map((r) => ({ ...r })),
    layers,
  };
  return JSON.stringify(data);
}

// ---------- deserialize ----------

function fail(msg: string): never {
  throw new Error(msg);
}

function num(v: unknown, what: string, min: number, max: number, integer = false): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(`Save is damaged: ${what} is missing or not a number.`);
  if (integer && !Number.isInteger(v)) fail(`Save is damaged: ${what} must be a whole number.`);
  if (v < min || v > max) fail(`Save is damaged: ${what} is out of range.`);
  return v;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Rebuilds a full GameState (derived layers recomputed). Throws an Error with a readable message if the text is not a valid save. */
export function deserialize(text: string): GameState {
  if (typeof text !== 'string' || !text.trim()) fail('This save is empty.');
  let data: unknown;
  try {
    data = JSON.parse(text.trim());
  } catch {
    fail('This is not a Cubopolis save (it could not be read).');
  }
  if (!isObj(data)) fail('This is not a Cubopolis save.');
  if (data.format !== FORMAT) fail('This is not a Cubopolis save.');
  const version = num(data.version, 'version', 1, Number.MAX_SAFE_INTEGER, true);
  if (version > SAVE_VERSION) fail('This save was made by a newer version of Cubopolis.');

  const size = num(data.size, 'map size', MIN_SIZE, MAX_SIZE, true);
  const n = size * size;
  const seed = num(data.seed, 'map seed', -0x80000000, 0xffffffff, true);
  let name = typeof data.name === 'string' ? data.name.trim().slice(0, MAX_NAME) : '';
  if (!name) name = 'New City';
  const state = createState(size, seed, name);
  state.version = SAVE_VERSION;
  state.day = num(data.day, 'day', 0, 1e9, true);
  state.timeOfDay = data.timeOfDay === undefined ? 0.35 : num(data.timeOfDay, 'time of day', 0, 1);
  const speed = data.speed === undefined ? 1 : num(data.speed, 'speed', 0, 3, true);
  state.speed = speed as Speed;
  state.money = num(data.money, 'money', -1e12, 1e12);
  if (!isObj(data.taxes)) fail('Save is damaged: taxes are missing.');
  state.taxes = {
    res: num(data.taxes.res, 'homes tax', 0, MAX_TAX),
    com: num(data.taxes.com, 'shops tax', 0, MAX_TAX),
    ind: num(data.taxes.ind, 'industry tax', 0, MAX_TAX),
  };
  state.milestone = num(data.milestone, 'milestone', 0, MILESTONES.length - 1, true);
  state.monthsInDebt = num(data.monthsInDebt, 'months in debt', 0, 1e9, true);
  state.stats.happiness = data.happiness === undefined ? 50 : num(data.happiness, 'happiness', 0, 100);

  // Layers.
  if (!isObj(data.layers)) fail('Save is damaged: the map is missing.');
  const L = data.layers;
  const T = state.tiles;
  for (const layer of BYTE_LAYERS) {
    const bytes = base64ToBytes(L[layer] as string, layer);
    if (bytes.length !== n) fail(`Save is damaged: the ${layer} map has the wrong size.`);
    T[layer].set(bytes);
  }
  const bldBytes = base64ToBytes(L.bld as string, 'building map');
  if (bldBytes.length !== n * 4) fail('Save is damaged: the building map has the wrong size.');
  T.bld.set(bytesToInt32(bldBytes));

  // Buildings.
  if (!Array.isArray(data.buildings)) fail('Save is damaged: the building list is missing.');
  if (data.buildings.length > n) fail('Save is damaged: too many buildings.');
  const buildings: Array<PlacedBuilding | null> = [];
  data.buildings.forEach((raw: unknown, id: number) => {
    if (raw === null) {
      buildings.push(null);
      return;
    }
    if (!isObj(raw)) fail(`Save is damaged: building ${id} is not valid.`);
    if (raw.id !== id) fail(`Save is damaged: building ${id} has the wrong id.`);
    const type = raw.type as BuildingType;
    if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(BUILDINGS, type)) {
      fail(`Save is damaged: building ${id} has an unknown type.`);
    }
    const s = BUILDINGS[type].size;
    const x = num(raw.x, `building ${id} position`, 0, size - s, true);
    const z = num(raw.z, `building ${id} position`, 0, size - s, true);
    if (raw.w !== s || raw.h !== s) fail(`Save is damaged: building ${id} has the wrong size.`);
    const rot = num(raw.rot, `building ${id} rotation`, 0, 3, true);
    buildings.push({ id, type, x, z, w: s, h: s, rot, active: raw.active === true });
  });
  state.buildings = buildings;

  // Tile values and consistency between tiles and buildings.
  for (let i = 0; i < n; i++) {
    const terrain = T.terrain[i];
    const kind = T.kind[i];
    if (terrain > Terrain.Sand) fail('Save is damaged: unknown terrain.');
    if (T.trees[i] > 3) fail('Save is damaged: unknown trees.');
    if (kind > TileKind.Building) fail('Save is damaged: unknown tile kind.');
    if (T.level[i] > 3) fail('Save is damaged: a lot level is out of range.');
    if (terrain === Terrain.Water && (kind !== TileKind.Empty || T.trees[i])) fail('Save is damaged: something stands on water.');
    if (T.trees[i] && kind !== TileKind.Empty) fail('Save is damaged: trees on a built tile.');
    if (kind === TileKind.Zone) {
      if (T.zone[i] < ZoneType.Res || T.zone[i] > ZoneType.Ind) fail('Save is damaged: a zone has an unknown type.');
    } else if (T.zone[i] !== 0 || T.level[i] !== 0) {
      fail('Save is damaged: zone data on a tile that is not zoned.');
    }
    if (kind === TileKind.Building) {
      const b = buildings[T.bld[i]];
      if (T.bld[i] < 0 || !b) fail('Save is damaged: a building tile points at no building.');
      const x = i % size;
      const z = (i - x) / size;
      if (x < b.x || x >= b.x + b.w || z < b.z || z >= b.z + b.h) fail('Save is damaged: a building tile is outside its building.');
    } else if (T.bld[i] !== -1) {
      fail('Save is damaged: a building id on a tile with no building.');
    }
  }
  for (const b of buildings) {
    if (!b) continue;
    for (let z = b.z; z < b.z + b.h; z++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        const i = z * size + x;
        if (T.kind[i] !== TileKind.Building || T.bld[i] !== b.id) fail(`Save is damaged: building ${b.id} is missing from the map.`);
      }
    }
  }

  // History.
  if (!Array.isArray(data.history)) fail('Save is damaged: the history is missing.');
  const history: MonthRecord[] = [];
  for (const raw of data.history.slice(-HISTORY_MONTHS)) {
    if (!isObj(raw)) fail('Save is damaged: a history entry is not valid.');
    history.push({
      day: num(raw.day, 'history day', 0, 1e9, true),
      population: num(raw.population, 'history population', 0, 1e9),
      money: num(raw.money, 'history money', -1e12, 1e12),
      income: num(raw.income, 'history income', -1e12, 1e12),
      expenses: num(raw.expenses, 'history expenses', -1e12, 1e12),
      happiness: num(raw.happiness, 'history happiness', 0, 100),
    });
  }
  state.history = history;

  // Derived layers (and each building's 'active' flag) are rebuilt from the primary data.
  recompute(state);
  markAll(state);
  return state;
}
