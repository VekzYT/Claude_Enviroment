// Dev tool (sim): a bot that plays Cubopolis like a sensible new player, to check the balance.
// It lays a road grid of 5x5 blocks near the centre, builds a coal plant and a water tower, zones
// homes / shops / industry in roughly 5:2:2 as demand and money allow, adds power and water when they
// run short, and services as they unlock and become affordable. Taxes stay at the default 9%.
//
// Usage: npx tsx tools/dev/sim-balance.ts [years=15] [seeds=1,2,3,4,5] [--verbose] [--png]

import { DAYS_PER_MONTH, DEFAULT_TAX, MILESTONES, MONTHS_PER_YEAR } from '../../src/core/config';
import { BUILDINGS } from '../../src/core/defs';
import { clearListeners, on } from '../../src/core/events';
import type { BuildingType, GameState, ToolId } from '../../src/core/types';
import { Terrain, TileKind, ZoneType } from '../../src/core/types';
import { applyPlan, isUnlocked, planTool } from '../../src/sim/actions';
import { newGame, simulateDay } from '../../src/sim/index';
import { growthBlocker } from '../../src/sim/growth';
import { buildingTouchesRoad, getCache } from '../../src/sim/util';

const BLOCK = 6; // road every 6 tiles: 5x5 lots between
const RESERVE = 1500; // money the bot keeps back when expanding
const TICK_DAYS = 10;

type Zone = ZoneType.Res | ZoneType.Com | ZoneType.Ind;
const ZONE_TOOL: Record<Zone, ToolId> = { 1: 'zone_res', 2: 'zone_com', 3: 'zone_ind' };

interface Block {
  bx: number;
  bz: number;
  zone: Zone | 0;
}

class Bot {
  s: GameState;
  ox: number;
  oz: number;
  blocks = new Map<string, Block>();
  log: string[] = [];
  spent: Record<string, number> = {};
  verbose: boolean;
  /** Basic mode: roads, zones, power and water only (no services or parks). */
  basic = false;

  constructor(seed: number, verbose: boolean) {
    this.s = newGame(seed, `Bot ${seed}`);
    this.verbose = verbose;
    this.ox = Math.floor(this.s.size / 2) - 3;
    this.oz = Math.floor(this.s.size / 2) - 3;
  }

  note(msg: string) {
    if (this.verbose) console.log(`  [y${(this.s.day / 360 + 1) | 0} d${this.s.day}] ${msg}`);
  }

  apply(tool: ToolId, a: { x: number; z: number }, b = a): boolean {
    const plan = planTool(this.s, tool, a, b);
    if (!plan.valid) return false;
    const r = applyPlan(this.s, plan);
    if (r.ok) this.spent[tool] = (this.spent[tool] ?? 0) + r.spent;
    return r.ok;
  }

  // ---------- blocks ----------

  rect(bx: number, bz: number) {
    const x0 = this.ox + BLOCK * bx;
    const z0 = this.oz + BLOCK * bz;
    return { x0, z0, x1: x0 + BLOCK, z1: z0 + BLOCK };
  }

  blockUsable(bx: number, bz: number): boolean {
    const { x0, z0, x1, z1 } = this.rect(bx, bz);
    if (x0 < 0 || z0 < 0 || x1 >= this.s.size || z1 >= this.s.size) return false;
    // The road ring must be buildable (roads can't cross water).
    for (let t = 0; t <= BLOCK; t++) {
      for (const [x, z] of [[x0 + t, z0], [x0 + t, z1], [x0, z0 + t], [x1, z0 + t]]) {
        if (this.s.tiles.terrain[z * this.s.size + x] === Terrain.Water) return false;
      }
    }
    let wet = 0;
    let blocked = 0;
    for (let z = z0 + 1; z < z1; z++) {
      for (let x = x0 + 1; x < x1; x++) {
        const i = z * this.s.size + x;
        if (this.s.tiles.terrain[i] === Terrain.Water) wet++;
        if (this.s.tiles.kind[i] === TileKind.Building || (this.s.tiles.kind[i] === TileKind.Zone && this.s.tiles.level[i] > 0)) blocked++;
      }
    }
    return wet <= 7 && blocked <= 14;
  }

  openBlock(bx: number, bz: number, zone: Zone | 0): boolean {
    const { x0, z0, x1, z1 } = this.rect(bx, bz);
    const before = this.s.money;
    this.apply('road', { x: x0, z: z0 }, { x: x1, z: z0 });
    this.apply('road', { x: x0, z: z1 }, { x: x1, z: z1 });
    this.apply('road', { x: x0, z: z0 }, { x: x0, z: z1 });
    this.apply('road', { x: x1, z: z0 }, { x: x1, z: z1 });
    if (zone) this.apply(ZONE_TOOL[zone], { x: x0 + 1, z: z0 + 1 }, { x: x1 - 1, z: z1 - 1 });
    this.blocks.set(`${bx},${bz}`, { bx, bz, zone });
    this.note(`opened ${['util', 'res', 'com', 'ind'][zone]} block ${bx},${bz} for $${before - this.s.money}`);
    return true;
  }

  /** Coal plants and industry the homes should keep away from. */
  dirtyNear(x: number, z: number, dist: number): boolean {
    for (const b of this.s.buildings) {
      if (!b || !BUILDINGS[b.type].pollution) continue;
      const dx = Math.max(b.x - x, 0, x - (b.x + b.w - 1));
      const dz = Math.max(b.z - z, 0, z - (b.z + b.h - 1));
      if (Math.hypot(dx, dz) < dist) return true;
    }
    return false;
  }

  blockScore(bx: number, bz: number, zone: Zone): number {
    let score = -Math.hypot(bx, bz) * 1.2;
    if (zone === ZoneType.Res) score -= Math.max(0, bx + 1) * 4;
    if (zone === ZoneType.Ind) score -= Math.max(0, 1 - bx) * 4;
    if (zone === ZoneType.Com) score -= Math.abs(bx) * 1.5;
    const { x0, z0 } = this.rect(bx, bz);
    const cx = x0 + 3;
    const cz = z0 + 3;
    if (zone === ZoneType.Res && this.dirtyNear(cx, cz, 10)) score -= 15;
    // Do not put homes right next to industry blocks.
    if (zone === ZoneType.Res || zone === ZoneType.Ind) {
      const other = zone === ZoneType.Res ? ZoneType.Ind : ZoneType.Res;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (this.blocks.get(`${bx + dx},${bz + dz}`)?.zone === other) score -= 6;
      }
    }
    // Trees cost extra.
    let trees = 0;
    for (let z = z0 + 1; z < z0 + BLOCK; z++) for (let x = x0 + 1; x < x0 + BLOCK; x++) if (this.s.tiles.trees[z * this.s.size + x]) trees++;
    return score - trees * 0.08;
  }

  expandFor(zone: Zone): boolean {
    let best: [number, number] | null = null;
    let bestScore = -Infinity;
    for (const b of this.blocks.values()) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const bx = b.bx + dx;
        const bz = b.bz + dz;
        if (this.blocks.has(`${bx},${bz}`) || !this.blockUsable(bx, bz)) continue;
        const sc = this.blockScore(bx, bz, zone);
        if (sc > bestScore) {
          bestScore = sc;
          best = [bx, bz];
        }
      }
    }
    if (!best) return false;
    return this.openBlock(best[0], best[1], zone);
  }

  // ---------- placing buildings ----------

  /** Best spot for a building by a score over zoned lots within `radius` of its footprint. */
  place(type: BuildingType, radius: number, weight: (i: number, d: number) => number, minScore = 1): boolean {
    const s = this.s;
    const def = BUILDINGS[type];
    const tool = `build:${type}` as ToolId;
    if (!isUnlocked(s, tool) || s.money < def.cost + RESERVE) return false;
    let best: { x: number; z: number } | null = null;
    let bestScore = minScore;
    const T = s.tiles;
    for (let z = 1; z < s.size - 1; z++) {
      for (let x = 1; x < s.size - 1; x++) {
        const rd = T.roadDist[z * s.size + x];
        if (def.needsRoad ? rd < 1 || rd > 2 : rd > 6) continue;
        const plan = planTool(s, tool, { x, z }, { x, z });
        if (!plan.valid || !plan.building) continue;
        const fb = plan.building;
        if (def.needsRoad && !buildingTouchesRoad(s, fb)) continue;
        let score = 0;
        const r = Math.ceil(radius);
        for (let zz = Math.max(0, fb.z - r); zz <= Math.min(s.size - 1, fb.z + fb.h - 1 + r); zz++) {
          for (let xx = Math.max(0, fb.x - r); xx <= Math.min(s.size - 1, fb.x + fb.w - 1 + r); xx++) {
            const dx = Math.max(fb.x - xx, 0, xx - (fb.x + fb.w - 1));
            const dz = Math.max(fb.z - zz, 0, zz - (fb.z + fb.h - 1));
            const d = Math.hypot(dx, dz);
            if (d > radius) continue;
            score += weight(zz * s.size + xx, d);
          }
        }
        // Do not swallow developed-looking lots: small preference for open land.
        let lots = 0;
        for (const i of plan.tiles) if (T.kind[i] === TileKind.Zone) lots++;
        score -= lots * 0.5;
        if (score > bestScore) {
          bestScore = score;
          best = { x, z };
        }
      }
    }
    if (!best) return false;
    const ok = this.apply(tool, best, best);
    if (ok) this.note(`built ${def.name} at ${best.x},${best.z} (score ${bestScore.toFixed(1)})`);
    return ok;
  }

  isLot(i: number) {
    return this.s.tiles.kind[i] === TileKind.Zone;
  }

  /** Returns true when power is needed (built or not), so the bot saves up instead of spending elsewhere. */
  /** Tiles that want power: unpowered lots, lots held back by a full plant, unpowered buildings. */
  powerWant(i: number): number {
    const s = this.s;
    const T = s.tiles;
    if (T.kind[i] === TileKind.Building) {
      const b = s.buildings[T.bld[i]];
      return b && !b.active && BUILDINGS[b.type].needsPower && buildingTouchesRoad(s, b) ? 3 : 0;
    }
    if (!this.isLot(i) || T.roadDist[i] > 3) return 0;
    if (!T.power[i]) return 1;
    return T.level[i] > 0 && T.level[i] < 3 && growthBlocker(s, this.cache, i) === 'powerCap' ? 0.8 : 0;
  }

  get cache() {
    return getCache(this.s);
  }

  ensurePower(): boolean {
    const s = this.s;
    const T = s.tiles;
    let want = 0;
    for (let i = 0; i < T.kind.length; i++) want += this.powerWant(i);
    const tight = s.stats.powerDemand > 0.8 * s.stats.powerSupply;
    if (want < 8 && !tight) return false;
    const weight = (i: number) => {
      let w = this.powerWant(i);
      if (this.isLot(i)) w += 0.1 + (tight && T.level[i] > 0 ? 0.3 : 0);
      return w;
    };
    const resNear = (i: number, d: number) => (this.isLot(i) && T.zone[i] === ZoneType.Res && d < 8 ? -6 : 0);
    // Clean power near homes once it unlocks, coal elsewhere.
    if (s.stats.population >= 2500 && this.place('power_solar', BUILDINGS.power_solar.power!.radius, weight, 20)) return false;
    if (this.place('power_coal', BUILDINGS.power_coal.power!.radius, (i, d) => weight(i) + resNear(i, d), 20)) return false;
    // Wind patches small gaps, and places where a smoky plant would sit next to homes.
    if (s.stats.population >= 400 && this.place('power_wind', BUILDINGS.power_wind.power!.radius, weight, 6)) return false;
    // Nothing placed: save up only if money is what is missing.
    return s.money < BUILDINGS.power_coal.cost + RESERVE;
  }

  ensureWater(): boolean {
    const s = this.s;
    const T = s.tiles;
    // A water building that is not working needs power or a road, not another water building.
    if (s.buildings.some((b) => b && BUILDINGS[b.type].water && !b.active)) return false;
    const c = this.cache;
    const want = (i: number) => {
      if (!this.isLot(i) || T.level[i] === 0) return 0;
      if (!T.water[i]) return 1;
      return T.level[i] < 3 && growthBlocker(s, c, i) === 'waterCap' ? 0.8 : 0;
    };
    let dry = 0;
    for (let i = 0; i < T.kind.length; i++) dry += want(i);
    const tight = s.stats.waterDemand > 0.8 * s.stats.waterSupply;
    if (dry < 6 && !tight) return false;
    const weight = (i: number) => (this.isLot(i) ? want(i) + 0.1 : 0);
    if (isUnlocked(s, 'build:water_pump') && this.place('water_pump', BUILDINGS.water_pump.water!.radius, weight, 25)) return false;
    if (this.place('water_tower', BUILDINGS.water_tower.water!.radius, weight, 6)) return false;
    return s.money < BUILDINGS.water_tower.cost + RESERVE;
  }

  /** Average coverage of a service over developed homes (0..1). */
  homeCoverage(layer: Uint8Array): { avg: number; homes: number } {
    const T = this.s.tiles;
    let sum = 0;
    let homes = 0;
    for (let i = 0; i < T.kind.length; i++) {
      if (this.isLot(i) && T.zone[i] === ZoneType.Res && T.level[i] > 0) {
        homes++;
        sum += layer[i] / 255;
      }
    }
    return { avg: homes ? sum / homes : 1, homes };
  }

  ensureServices(): boolean {
    if (this.basic) return false;
    const s = this.s;
    const T = s.tiles;
    const gap = (layer: Uint8Array) => (i: number) =>
      this.isLot(i) && T.zone[i] === ZoneType.Res ? Math.max(0, 1 - layer[i] / 255) * (T.level[i] > 0 ? 1 : 0.4) : 0;
    const wants: Array<[BuildingType, Uint8Array, number]> = [
      ['police', T.police, 0.45],
      ['fire', T.fire, 0.45],
      ['school', T.education, 0.4],
      ['clinic', T.health, 0.4],
      ['park_small', T.parks, 0.3],
    ];
    if (s.stats.population >= 2500) {
      wants.unshift(['hospital', T.health, 0.35], ['college', T.education, 0.35]);
    }
    if (s.stats.population >= 1000) wants.push(['park_plaza', T.parks, 0.4]);
    for (const [type, layer, target] of wants) {
      const { avg, homes } = this.homeCoverage(layer);
      if (homes < 15 || avg >= target) continue;
      const def = BUILDINGS[type];
      if (!isUnlocked(s, `build:${type}`) || s.money < def.cost + RESERVE * 2) continue;
      if (this.place(type, def.service!.radius, gap(layer), type === 'park_small' ? 4 : 12)) return true;
    }
    // A stadium once the city is big and rich.
    if (s.stats.population >= 6000 && s.money > 40000 && !s.buildings.some((b) => b?.type === 'stadium')) {
      return this.place('stadium', 12, (i) => (this.isLot(i) ? 1 : 0), 10);
    }
    return false;
  }

  availableLots(zone: Zone): number {
    const T = this.s.tiles;
    let n = 0;
    for (let i = 0; i < T.kind.length; i++) {
      if (this.isLot(i) && T.zone[i] === zone && T.level[i] === 0 && T.roadDist[i] <= 3 && T.power[i]) n++;
    }
    return n;
  }

  zonedLots(zone: Zone): number {
    const T = this.s.tiles;
    let n = 0;
    for (let i = 0; i < T.kind.length; i++) if (this.isLot(i) && T.zone[i] === zone) n++;
    return n;
  }

  start(): void {
    // Shops in the middle, homes to the west, industry and the coal plant to the east.
    this.openBlock(0, 0, ZoneType.Com);
    this.openBlock(-1, 0, ZoneType.Res);
    this.openBlock(-1, -1, ZoneType.Res);
    this.openBlock(1, 0, ZoneType.Ind);
    this.openBlock(1, -1, 0);
    const { x0, z0 } = this.rect(1, -1);
    if (!this.apply('build:power_coal', { x: x0 + 3, z: z0 + 4 })) {
      this.place('power_coal', 16, (i) => (this.isLot(i) ? 1 : 0), 1);
    }
    const r = this.rect(-1, 0);
    if (!this.apply('build:water_tower', { x: r.x1 - 1, z: r.z0 + 1 })) {
      this.place('water_tower', 9, (i) => (this.isLot(i) ? 1 : 0), 1);
    }
  }

  tick(): void {
    const s = this.s;
    // Utilities come first; if one is needed but unaffordable, save up for it.
    if (this.ensurePower()) return;
    if (this.ensureWater()) return;
    const d = s.stats.demand;
    // Zone in roughly 5:2:2 by lots, led by demand.
    const share = { 1: 5 / 9, 2: 2 / 9, 3: 2 / 9 } as Record<Zone, number>;
    const total = this.zonedLots(ZoneType.Res) + this.zonedLots(ZoneType.Com) + this.zonedLots(ZoneType.Ind) || 1;
    const order = ([ZoneType.Res, ZoneType.Com, ZoneType.Ind] as Zone[])
      .map((z) => ({ z, need: (z === 1 ? d.res : z === 2 ? d.com : d.ind) + (share[z] - this.zonedLots(z) / total) }))
      .sort((a, b) => b.need - a.need);
    let opened = 0;
    for (const { z } of order) {
      const dem = z === 1 ? d.res : z === 2 ? d.com : d.ind;
      // Keep a buffer of empty zoned lots that grows with the city, like a player zoning ahead.
      const buffer = Math.max(8, Math.round(this.zonedLots(z) * 0.15));
      if (dem < 0.15 || this.availableLots(z) >= buffer || s.money < RESERVE + 600) continue;
      if (this.expandFor(z)) opened++;
      if (opened >= 2) break;
    }
    this.ensureServices();
  }
}

interface YearRow {
  year: number;
  pop: number;
  money: number;
  res: number;
  com: number;
  ind: number;
  happy: number;
  milestone: string;
  net: number;
  income: number;
  roads: number;
  blds: number;
}

function run(seed: number, years: number, verbose: boolean, png: boolean, basic = false) {
  clearListeners();
  const bot = new Bot(seed, verbose);
  bot.basic = basic;
  const reached: Record<string, number> = {};
  let minMoney = Infinity;
  let firstProfitPop = -1;
  on('milestone', (e) => {
    reached[e.name] = bot.s.day / DAYS_PER_MONTH;
    if (verbose) console.log(`  ** ${e.name} at month ${(bot.s.day / DAYS_PER_MONTH).toFixed(1)}`);
  });
  on('toast', (e) => {
    if (verbose) console.log(`  toast(${e.tone}): ${e.text}`);
  });
  on('month', (e) => {
    if (firstProfitPop < 0 && e.record.income > e.record.expenses && e.record.population > 0) firstProfitPop = e.record.population;
  });
  bot.start();
  const rows: YearRow[] = [];
  const demandSamples: number[][] = [];
  const days = years * MONTHS_PER_YEAR * DAYS_PER_MONTH;
  for (let d = 1; d <= days; d++) {
    simulateDay(bot.s);
    bot.s.taxes = { res: DEFAULT_TAX, com: DEFAULT_TAX, ind: DEFAULT_TAX };
    minMoney = Math.min(minMoney, bot.s.money);
    if (d % TICK_DAYS === 0) bot.tick();
    if (d % DAYS_PER_MONTH === 0) {
      const dm = bot.s.stats.demand;
      demandSamples.push([dm.res, dm.com, dm.ind]);
    }
    if (d % (MONTHS_PER_YEAR * DAYS_PER_MONTH) === 0) {
      const st = bot.s.stats;
      const last = bot.s.history.slice(-12);
      const net = last.reduce((a, r) => a + r.income - r.expenses, 0) / Math.max(1, last.length);
      rows.push({
        year: d / 360,
        pop: st.population,
        money: bot.s.money,
        res: st.demand.res,
        com: st.demand.com,
        ind: st.demand.ind,
        happy: st.happiness,
        milestone: MILESTONES[bot.s.milestone].name,
        net,
        income: st.income.total,
        roads: st.expenses.roads,
        blds: st.expenses.buildings,
      });
    }
  }
  // How much of the time each demand bar sat pinned at an extreme.
  const pinned = [0, 1, 2].map((k) => demandSamples.filter((v) => Math.abs(v[k]) > 0.97).length / demandSamples.length);
  const flips = [0, 1, 2].map((k) => {
    let f = 0;
    for (let j = 1; j < demandSamples.length; j++) if (Math.sign(demandSamples[j][k]) !== Math.sign(demandSamples[j - 1][k])) f++;
    return f;
  });
  if (png) {
    import('./sim-mapdump').then((m) => m.renderSheet([bot.s], 1, 8, `.cache/sim/bot-${seed}.png`));
  }
  return { seed, rows, reached, minMoney, firstProfitPop, pinned, flips, bot };
}

/** Tally, per zone and level, what stops lots from growing (the same check growth uses). */
function diagnose(s: GameState): string {
  const c = getCache(s);
  const T = s.tiles;
  const out: string[] = [];
  for (const z of [1, 2, 3]) {
    const levels = [0, 0, 0, 0];
    const why: Record<string, number> = {};
    for (let i = 0; i < T.kind.length; i++) {
      if (T.kind[i] !== TileKind.Zone || T.zone[i] !== z) continue;
      levels[T.level[i]]++;
      if (T.level[i] >= 3) continue;
      const b = growthBlocker(s, c, i) ?? 'ok';
      const k = `L${T.level[i]}:${b}`;
      why[k] = (why[k] ?? 0) + 1;
    }
    out.push(`  ${['', 'res', 'com', 'ind'][z]} levels ${levels.join('/')}  ` + Object.entries(why).sort().map(([k, v]) => `${k} ${v}`).join(', '));
  }
  return out.join('\n');
}

const fmt = (n: number, w: number) => String(Math.round(n)).padStart(w);
const fd = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2);

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const png = args.includes('--png');
const diag = args.includes('--diag');
const basic = args.includes('--basic');
const pos = args.filter((a) => !a.startsWith('--'));
const years = Number(pos[0] ?? 15);
const seeds = (pos[1] ?? '1,2,3,4,5').split(',').map(Number);

const summaries: string[] = [];
for (const seed of seeds) {
  const t0 = performance.now();
  const r = run(seed, years, verbose, png, basic);
  console.log(`\nSeed ${seed}  (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
  console.log(' year     pop    money   net/mo  income  roads  bldgs   res   com   ind  happy  milestone');
  for (const y of r.rows) {
    console.log(
      `${fmt(y.year, 5)} ${fmt(y.pop, 7)} ${fmt(y.money, 8)} ${fmt(y.net, 8)} ${fmt(y.income, 7)} ${fmt(y.roads, 6)} ${fmt(y.blds, 6)} ${fd(y.res)} ${fd(y.com)} ${fd(y.ind)} ${fmt(y.happy, 6)}  ${y.milestone}`,
    );
  }
  const m = (name: string) => (r.reached[name] !== undefined ? `${(r.reached[name] / 12).toFixed(1)}y` : '-');
  console.log(
    `  reached: Hamlet ${r.reached.Hamlet !== undefined ? r.reached.Hamlet.toFixed(1) + 'mo' : '-'}, Village ${m('Village')}, Town ${m('Town')}, Small City ${m('Small City')}, City ${m('City')}, Metropolis ${m('Metropolis')}`,
  );
  console.log(
    `  lowest money $${Math.round(r.minMoney)}, first profitable month at ${r.firstProfitPop} people, demand pinned share r/c/i ${r.pinned.map((p) => p.toFixed(2)).join('/')}, sign flips ${r.flips.join('/')}`,
  );
  const blds: Record<string, number> = {};
  for (const b of r.bot.s.buildings) if (b) blds[b.type] = (blds[b.type] ?? 0) + 1;
  console.log(`  buildings: ${Object.entries(blds).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`  developed lots r/c/i: ${r.bot.s.stats.developed.res}/${r.bot.s.stats.developed.com}/${r.bot.s.stats.developed.ind}, unemployment ${(r.bot.s.stats.unemployment * 100).toFixed(0)}%, power ${r.bot.s.stats.powerDemand}/${r.bot.s.stats.powerSupply}, water ${r.bot.s.stats.waterDemand}/${r.bot.s.stats.waterSupply}`);
  if (diag) console.log(diagnose(r.bot.s));
  summaries.push(
    `${String(seed).padStart(4)}  ${(r.reached.Hamlet ?? NaN).toFixed(1).padStart(6)}mo ${m('Village').padStart(6)} ${m('Town').padStart(6)} ${m('Small City').padStart(6)} ${m('City').padStart(6)} ${m('Metropolis').padStart(6)}  ${fmt(r.rows.at(-1)?.pop ?? 0, 7)} ${fmt(r.minMoney, 8)} ${fmt(r.rows.at(-1)?.money ?? 0, 9)}`,
  );
}
console.log('\nseed   Hamlet  Village   Town  SmCity   City  Metro   final pop  min $   final $');
for (const l of summaries) console.log(l);
