// OWNER: sim agent. What the player's tools do. Keep these signatures.
import {
  BULLDOZE_BUILDING_SHARE,
  COST_BULLDOZE_LOT_PER_LEVEL,
  COST_BULLDOZE_ROAD,
  COST_BULLDOZE_TREES,
  COST_CLEAR_TREES,
  COST_ROAD,
  COST_ZONE,
  MILESTONES,
  UNDO_STACK_SIZE,
} from '../core/config';
import { BUILDINGS, buildingTypeOf } from '../core/defs';
import { emit } from '../core/events';
import { hash01 } from '../core/rng';
import { markTile } from '../core/state';
import type { ApplyResult, BuildingType, GameState, PlacedBuilding, Plan, TilePos, ToolId, UndoRecord } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';
import { recompute } from './recompute';
import { clamp, footprintTouchesWater, formatCount } from './util';

const ZONE_OF_TOOL: Partial<Record<ToolId, ZoneType>> = {
  zone_res: ZoneType.Res,
  zone_com: ZoneType.Com,
  zone_ind: ZoneType.Ind,
};
const ZONE_WORD: Record<number, string> = { 1: 'homes', 2: 'shops', 3: 'industry' };

function emptyPlan(tool: ToolId, reason?: string): Plan {
  const p: Plan = { tool, tiles: [], ok: [], cost: 0, valid: false };
  if (reason) p.reason = reason;
  return p;
}

function clampPos(state: GameState, p: TilePos): TilePos {
  const fix = (v: number) => clamp(Number.isFinite(v) ? Math.round(v) : 0, 0, state.size - 1);
  return { x: fix(p?.x), z: fix(p?.z) };
}

/** L-shaped path from a to b: along the longer axis first, then the other. */
function roadPath(state: GameState, a: TilePos, b: TilePos): number[] {
  const size = state.size;
  const out: number[] = [];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const sx = Math.sign(dx);
  const sz = Math.sign(dz);
  if (Math.abs(dx) >= Math.abs(dz)) {
    for (let x = a.x; ; x += sx) {
      out.push(a.z * size + x);
      if (x === b.x) break;
    }
    for (let z = a.z + sz; sz !== 0; z += sz) {
      out.push(z * size + b.x);
      if (z === b.z) break;
    }
  } else {
    for (let z = a.z; ; z += sz) {
      out.push(z * size + a.x);
      if (z === b.z) break;
    }
    for (let x = a.x + sx; sx !== 0; x += sx) {
      out.push(b.z * size + x);
      if (x === b.x) break;
    }
  }
  return out;
}

function rectTiles(state: GameState, a: TilePos, b: TilePos): number[] {
  const out: number[] = [];
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const z0 = Math.min(a.z, b.z);
  const z1 = Math.max(a.z, b.z);
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) out.push(z * state.size + x);
  return out;
}

function finishMoney(state: GameState, plan: Plan): Plan {
  if (plan.valid && plan.cost > state.money) {
    plan.valid = false;
    plan.reason = 'Not enough money';
  }
  return plan;
}

// ---------- evaluators: judge a list of tiles against the current state ----------

function evalRoad(state: GameState, tiles: number[]): Plan {
  const T = state.tiles;
  const ok: boolean[] = [];
  let cost = 0;
  let changes = 0;
  let block: string | undefined;
  for (const i of tiles) {
    if (T.terrain[i] === Terrain.Water) {
      ok.push(false);
      block ??= "Roads can't cross water yet";
    } else if (T.kind[i] === TileKind.Building) {
      ok.push(false);
      block ??= 'A building is in the way';
    } else if (T.kind[i] === TileKind.Zone && T.level[i] > 0) {
      ok.push(false);
      block ??= 'Bulldoze the buildings in the way first';
    } else if (T.kind[i] === TileKind.Road) {
      ok.push(true); // already road: fine, and free
    } else {
      ok.push(true);
      cost += COST_ROAD + (T.trees[i] ? COST_CLEAR_TREES : 0);
      changes++;
    }
  }
  const plan: Plan = { tool: 'road', tiles, ok, cost, valid: true };
  if (block) {
    plan.valid = false;
    plan.reason = block;
  } else if (changes === 0) {
    plan.valid = false;
    plan.reason = 'Already a road';
  }
  return finishMoney(state, plan);
}

function evalZone(state: GameState, tool: ToolId, zt: ZoneType, tiles: number[]): Plan {
  const T = state.tiles;
  const ok: boolean[] = [];
  let cost = 0;
  let changes = 0;
  let same = 0;
  let built = 0;
  let wet = 0;
  for (const i of tiles) {
    const k = T.kind[i];
    if (T.terrain[i] === Terrain.Water) {
      ok.push(false);
      wet++;
    } else if (k === TileKind.Road || k === TileKind.Building) {
      ok.push(false);
      built++;
    } else if (k === TileKind.Zone) {
      if (T.level[i] > 0) {
        ok.push(false);
        built++;
      } else if (T.zone[i] === zt) {
        ok.push(false);
        same++;
      } else {
        ok.push(true);
        cost += COST_ZONE;
        changes++;
      }
    } else {
      ok.push(true);
      cost += COST_ZONE + (T.trees[i] ? COST_CLEAR_TREES : 0);
      changes++;
    }
  }
  const plan: Plan = { tool, tiles, ok, cost, valid: changes > 0 };
  if (!changes) {
    if (same) plan.reason = `Already zoned for ${ZONE_WORD[zt]}`;
    else if (built) plan.reason = 'Something is already built here';
    else if (wet) plan.reason = "Can't zone on water";
    else plan.reason = 'Nothing here can be zoned';
  }
  return finishMoney(state, plan);
}

function evalBulldoze(state: GameState, tiles: number[]): Plan {
  const T = state.tiles;
  const size = state.size;
  // A building goes as a whole: add the rest of its footprint to the plan.
  const all = tiles.slice();
  const inPlan = new Set(tiles);
  const seen = new Set<number>();
  for (const i of tiles) {
    if (T.kind[i] !== TileKind.Building) continue;
    const b = state.buildings[T.bld[i]];
    if (!b || seen.has(b.id)) continue;
    seen.add(b.id);
    for (let z = b.z; z < b.z + b.h; z++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        const t = z * size + x;
        if (!inPlan.has(t)) {
          inPlan.add(t);
          all.push(t);
        }
      }
    }
  }
  const ok: boolean[] = [];
  let cost = 0;
  let changes = 0;
  const charged = new Set<number>();
  for (const i of all) {
    const k = T.kind[i];
    if (k === TileKind.Road) {
      ok.push(true);
      cost += COST_BULLDOZE_ROAD;
    } else if (k === TileKind.Zone) {
      ok.push(true);
      cost += T.level[i] * COST_BULLDOZE_LOT_PER_LEVEL;
    } else if (k === TileKind.Building) {
      ok.push(true);
      const b = state.buildings[T.bld[i]];
      if (b && !charged.has(b.id)) {
        charged.add(b.id);
        cost += Math.round(BUILDINGS[b.type].cost * BULLDOZE_BUILDING_SHARE);
      }
    } else if (T.trees[i]) {
      ok.push(true);
      cost += COST_BULLDOZE_TREES;
    } else {
      ok.push(false);
      continue;
    }
    changes++;
  }
  const plan: Plan = { tool: 'bulldoze', tiles: all, ok, cost, valid: changes > 0 };
  if (!changes) plan.reason = 'Nothing to clear here';
  return finishMoney(state, plan);
}

/** Which way a building at (x0, z0) of size s should face: the side with most road, else the nearest road. */
function chooseRot(state: GameState, x0: number, z0: number, s: number): number {
  const size = state.size;
  const T = state.tiles;
  const sides: Array<Array<[number, number]>> = [[], [], [], []];
  for (let k = 0; k < s; k++) {
    sides[0].push([x0 + k, z0 + s]); // rot 0 faces +z
    sides[1].push([x0 + s, z0 + k]); // rot 1 faces +x
    sides[2].push([x0 + k, z0 - 1]); // rot 2 faces -z
    sides[3].push([x0 - 1, z0 + k]); // rot 3 faces -x
  }
  let best = 0;
  let bestRoads = 0;
  let bestDist = 256;
  let bestDistRot = 0;
  for (let r = 0; r < 4; r++) {
    let roads = 0;
    let dist = 256;
    for (const [x, z] of sides[r]) {
      if (x < 0 || z < 0 || x >= size || z >= size) continue;
      const i = z * size + x;
      if (T.kind[i] === TileKind.Road) roads++;
      dist = Math.min(dist, T.roadDist[i]);
    }
    if (roads > bestRoads) {
      bestRoads = roads;
      best = r;
    }
    if (dist < bestDist) {
      bestDist = dist;
      bestDistRot = r;
    }
  }
  if (bestRoads > 0) return best;
  return bestDist < 255 ? bestDistRot : 0;
}

function evalBuild(state: GameState, tool: ToolId, type: BuildingType, centre: TilePos): Plan {
  const def = BUILDINGS[type];
  const T = state.tiles;
  const size = state.size;
  const s = def.size;
  const off = Math.floor((s - 1) / 2);
  const x0 = centre.x - off;
  const z0 = centre.z - off;
  const tiles: number[] = [];
  const ok: boolean[] = [];
  let cost = def.cost;
  let block: string | undefined;
  for (let z = z0; z < z0 + s; z++) {
    for (let x = x0; x < x0 + s; x++) {
      if (x < 0 || z < 0 || x >= size || z >= size) {
        block ??= 'Too close to the edge of the map';
        continue;
      }
      const i = z * size + x;
      tiles.push(i);
      const k = T.kind[i];
      if (T.terrain[i] === Terrain.Water) {
        ok.push(false);
        block ??= "Can't build on water";
      } else if (k === TileKind.Road) {
        ok.push(false);
        block ??= 'A road is in the way';
      } else if (k === TileKind.Building) {
        ok.push(false);
        block ??= 'Another building is in the way';
      } else if (k === TileKind.Zone && T.level[i] > 0) {
        ok.push(false);
        block ??= 'Bulldoze the buildings here first';
      } else {
        ok.push(true);
        if (T.trees[i]) cost += COST_CLEAR_TREES;
      }
    }
  }
  const plan: Plan = {
    tool,
    tiles,
    ok,
    cost,
    valid: true,
    building: { type, x: x0, z: z0, w: s, h: s, rot: chooseRot(state, x0, z0, s) },
  };
  if (!isUnlocked(state, tool)) {
    plan.valid = false;
    plan.reason = `Unlocks at ${formatCount(def.unlockPop)} people`;
  } else if (block) {
    plan.valid = false;
    plan.reason = block;
  } else if (def.needsWaterEdge && !footprintTouchesWater(state, x0, z0, s, s)) {
    plan.valid = false;
    plan.reason = 'Must touch a lake or river';
  }
  return finishMoney(state, plan);
}

/**
 * What `tool` would do if dragged from `a` to `b` (a == b for a tap). Pure: does not change state.
 * road: L-shaped path (long axis first). zones/bulldoze: the rectangle a..b. build:*: footprint
 * centred on b. inspect: empty plan.
 */
export function planTool(state: GameState, tool: ToolId, a: TilePos, b: TilePos): Plan {
  if (tool === 'inspect') return emptyPlan(tool);
  const pa = clampPos(state, a);
  const pb = clampPos(state, b);
  if (tool === 'road') return evalRoad(state, roadPath(state, pa, pb));
  const zt = ZONE_OF_TOOL[tool];
  if (zt !== undefined) return evalZone(state, tool, zt, rectTiles(state, pa, pb));
  if (tool === 'bulldoze') return evalBulldoze(state, rectTiles(state, pa, pb));
  const type = buildingTypeOf(tool);
  if (type && BUILDINGS[type]) return evalBuild(state, tool, type, pb);
  return emptyPlan(tool, 'Unknown tool');
}

/** Plan tiles from outside, cleaned: in range, whole numbers, no repeats (order kept). */
function cleanTiles(state: GameState, tiles: unknown): number[] {
  if (!Array.isArray(tiles)) return [];
  const n = state.size * state.size;
  const seen = new Set<number>();
  const out: number[] = [];
  for (const t of tiles) {
    if (typeof t !== 'number' || !Number.isInteger(t) || t < 0 || t >= n || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Re-check a plan against the state as it is now. */
function replan(state: GameState, plan: Plan): Plan {
  const tool = plan.tool;
  if (tool === 'road') return evalRoad(state, cleanTiles(state, plan.tiles));
  const zt = ZONE_OF_TOOL[tool];
  if (zt !== undefined) return evalZone(state, tool, zt, cleanTiles(state, plan.tiles));
  if (tool === 'bulldoze') return evalBulldoze(state, cleanTiles(state, plan.tiles));
  const type = buildingTypeOf(tool);
  if (type && BUILDINGS[type]) {
    const b = plan.building;
    if (!b || !Number.isFinite(b.x) || !Number.isFinite(b.z)) return emptyPlan(tool, 'Pick a spot to build');
    const off = Math.floor((BUILDINGS[type].size - 1) / 2);
    return evalBuild(state, tool, type, { x: b.x + off, z: b.z + off });
  }
  return emptyPlan(tool, 'Unknown tool');
}

function tileVariant(state: GameState, i: number): number {
  return Math.floor(hash01(state.seed ^ 0x9b05688c, state.rev.tiles, i) * 256);
}

/** Carry out a plan made by planTool: spends money, changes tiles, pushes an undo record, emits 'applied'. */
export function applyPlan(state: GameState, plan: Plan): ApplyResult {
  if (!plan || typeof plan !== 'object' || plan.tool === 'inspect') return { ok: false, spent: 0, changed: [] };
  const fresh = replan(state, plan);
  if (!fresh.valid) {
    const reason = fresh.reason ?? "That can't be done here";
    emit({ type: 'denied', tool: plan.tool, reason });
    return { ok: false, spent: 0, message: reason, changed: [] };
  }

  const T = state.tiles;
  const size = state.size;
  const tool = fresh.tool;
  const rec: UndoRecord = { tool, spent: fresh.cost, tiles: [], removedBuildings: [], addedBuildingIds: [] };
  const changed: number[] = [];
  const snap = (i: number) => {
    rec.tiles.push({
      i,
      terrain: T.terrain[i],
      trees: T.trees[i],
      kind: T.kind[i],
      zone: T.zone[i],
      level: T.level[i],
      variant: T.variant[i],
      bld: T.bld[i],
      distress: T.distress[i],
    });
  };
  /** Snapshot, then set a tile to a fresh kind with nothing else on it. */
  const setTile = (i: number, kind: TileKind, zone: number, bld: number) => {
    snap(i);
    T.kind[i] = kind;
    T.zone[i] = zone;
    T.level[i] = 0;
    T.trees[i] = 0;
    T.bld[i] = bld;
    T.distress[i] = 0;
    T.variant[i] = tileVariant(state, i);
    markTile(state, i);
    changed.push(i);
  };

  const zt = ZONE_OF_TOOL[tool];
  if (tool === 'road') {
    fresh.tiles.forEach((i, k) => {
      if (fresh.ok[k] && T.kind[i] !== TileKind.Road) setTile(i, TileKind.Road, ZoneType.None, -1);
    });
  } else if (zt !== undefined) {
    fresh.tiles.forEach((i, k) => {
      if (fresh.ok[k]) setTile(i, TileKind.Zone, zt, -1);
    });
  } else if (tool === 'bulldoze') {
    fresh.tiles.forEach((i, k) => {
      if (!fresh.ok[k]) return;
      if (T.kind[i] === TileKind.Building) {
        const b = state.buildings[T.bld[i]];
        if (b) {
          rec.removedBuildings.push({ ...b });
          state.buildings[b.id] = null;
        }
      }
      setTile(i, TileKind.Empty, ZoneType.None, -1);
    });
    if (rec.removedBuildings.length) state.rev.buildings++;
  } else if (fresh.building) {
    const fb = fresh.building;
    const id = state.buildings.length;
    const b: PlacedBuilding = { id, type: fb.type, x: fb.x, z: fb.z, w: fb.w, h: fb.h, rot: fb.rot, active: false };
    state.buildings.push(b);
    rec.addedBuildingIds.push(id);
    for (let z = fb.z; z < fb.z + fb.h; z++) {
      for (let x = fb.x; x < fb.x + fb.w; x++) setTile(z * size + x, TileKind.Building, ZoneType.None, id);
    }
    state.rev.buildings++;
  }

  state.money -= fresh.cost;
  state.needsRecompute = true;
  recompute(state);
  state.undo.push(rec);
  if (state.undo.length > UNDO_STACK_SIZE) state.undo.splice(0, state.undo.length - UNDO_STACK_SIZE);
  emit({ type: 'applied', tool, tiles: changed, spent: fresh.cost });
  return { ok: true, spent: fresh.cost, changed };
}

export function canUndo(state: GameState): boolean {
  return state.undo.length > 0;
}

/** Take back the most recent action and refund it. Returns false if there was nothing to undo. */
export function undo(state: GameState): boolean {
  const rec = state.undo.pop();
  if (!rec) return false;
  const T = state.tiles;
  let buildingsChanged = false;
  // Buildings the action created: they were appended last, so popping restores the array exactly.
  const added = rec.addedBuildingIds.slice().sort((a, b) => b - a);
  for (const id of added) {
    if (id === state.buildings.length - 1) state.buildings.pop();
    else if (id >= 0 && id < state.buildings.length) state.buildings[id] = null;
    buildingsChanged = true;
  }
  for (const b of rec.removedBuildings) {
    while (state.buildings.length <= b.id) state.buildings.push(null);
    state.buildings[b.id] = { ...b };
    buildingsChanged = true;
  }
  // Restore tiles newest-first so a tile recorded twice ends at its oldest value.
  for (let k = rec.tiles.length - 1; k >= 0; k--) {
    const t = rec.tiles[k];
    T.terrain[t.i] = t.terrain;
    T.trees[t.i] = t.trees;
    T.kind[t.i] = t.kind;
    T.zone[t.i] = t.zone;
    T.level[t.i] = t.level;
    T.variant[t.i] = t.variant;
    T.bld[t.i] = t.bld;
    T.distress[t.i] = t.distress;
    markTile(state, t.i);
  }
  if (buildingsChanged) state.rev.buildings++;
  state.money += rec.spent;
  state.needsRecompute = true;
  recompute(state);
  emit({ type: 'undo', tool: rec.tool, refund: rec.spent });
  return true;
}

/** True if the city's population has reached what this tool needs. */
export function isUnlocked(state: GameState, tool: ToolId): boolean {
  const type = buildingTypeOf(tool);
  if (!type) return true;
  const def = BUILDINGS[type];
  if (!def) return false;
  if (state.stats.population >= def.unlockPop) return true;
  // Unlocks never re-lock: a milestone once reached keeps its buildings available.
  const reached = MILESTONES[state.milestone];
  return !!reached && reached.population >= def.unlockPop;
}
