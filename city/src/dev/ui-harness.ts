// UI dev harness: the real interface over a hand-made GameState and fake UIActions, with a painted
// stand-in for the 3D world behind it. tools/dev/ui-shots.mjs drives it through every screen.
// Imports only core and ui (other modules are being edited in parallel).
import { DAYS_PER_MONTH, MILESTONES, START_MONEY } from '../core/config';
import { emit } from '../core/events';
import { makeRng } from '../core/rng';
import { createState, markTile } from '../core/state';
import type { GameState, MonthRecord, OverlayKind, Plan, Settings, Speed, TileInfo, ToolId } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';
import { createUI, type UIActions } from '../ui/index';
import '../ui/ui.css';

// ---------------------------------------------------------------- a painted "world"

function paintWorld(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const g = canvas.getContext('2d')!;
  g.scale(dpr, dpr);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#8ed0f5');
  sky.addColorStop(1, '#d9f0fb');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  const rnd = makeRng(7);
  const tw = 46;
  const th = 23;
  const ox = W / 2;
  const oy = -40;
  const N = 26;
  const block = (cx: number, cy: number, hgt: number, top: string, left: string, right: string) => {
    g.fillStyle = left;
    g.beginPath();
    g.moveTo(cx - tw / 2, cy);
    g.lineTo(cx, cy + th / 2);
    g.lineTo(cx, cy + th / 2 - hgt);
    g.lineTo(cx - tw / 2, cy - hgt);
    g.fill();
    g.fillStyle = right;
    g.beginPath();
    g.moveTo(cx + tw / 2, cy);
    g.lineTo(cx, cy + th / 2);
    g.lineTo(cx, cy + th / 2 - hgt);
    g.lineTo(cx + tw / 2, cy - hgt);
    g.fill();
    g.fillStyle = top;
    g.beginPath();
    g.moveTo(cx, cy - th / 2 - hgt);
    g.lineTo(cx + tw / 2, cy - hgt);
    g.lineTo(cx, cy + th / 2 - hgt);
    g.lineTo(cx - tw / 2, cy - hgt);
    g.fill();
  };
  const cols = [
    ['#f3f0e6', '#d9d2c2', '#c4bba8'],
    ['#ffb38a', '#e9906a', '#cf7a56'],
    ['#9fd0ff', '#78acdf', '#6496c8'],
    ['#ffe08a', '#e8c25f', '#cfab4c'],
  ];
  for (let s = 0; s < N * 2; s++) {
    for (let x = 0; x < N; x++) {
      const z = s - x;
      if (z < 0 || z >= N) continue;
      const cx = ox + (x - z) * (tw / 2);
      const cy = oy + (x + z) * (th / 2);
      const water = (x - 18) ** 2 + (z - 6) ** 2 < 22;
      const road = x % 6 === 0 || z % 5 === 0;
      const top = water ? '#4aa8e8' : road ? '#8a93a0' : (x + z) % 2 ? '#86cf62' : '#7cc95c';
      block(cx, cy, 6, top, water ? '#3a8fd0' : '#5e9e44', water ? '#2f7cb8' : '#4f8a38');
      if (!water && !road && rnd() < 0.55) {
        const c = cols[Math.floor(rnd() * cols.length)];
        if (rnd() < 0.3) block(cx, cy - 6, 14, '#3f9a46', '#2f7a36', '#286a2e');
        else block(cx, cy - 6, 12 + Math.floor(rnd() * 3) * 14, c[0], c[1], c[2]);
      }
    }
  }
}

// ---------------------------------------------------------------- a hand-made city

function fakeMap(seed: number, name = 'Preview'): GameState {
  const s = createState(64, seed, name);
  const rnd = makeRng(seed);
  // A few lakes and some woods from a cheap blob noise.
  const lakes = Array.from({ length: 2 + Math.floor(rnd() * 3) }, () => [rnd() * 64, rnd() * 64, 5 + rnd() * 8]);
  const woods = Array.from({ length: 6 }, () => [rnd() * 64, rnd() * 64, 4 + rnd() * 9]);
  for (let z = 0; z < 64; z++) {
    for (let x = 0; x < 64; x++) {
      const i = z * 64 + x;
      let w = 0;
      for (const [lx, lz, r] of lakes) w = Math.max(w, 1 - Math.hypot(x - lx, z - lz) / r);
      const wob = Math.sin(x * 0.7 + seed) * 0.08 + Math.cos(z * 0.6) * 0.08;
      if (w + wob > 0.2) s.tiles.terrain[i] = Terrain.Water;
      else if (w + wob > 0.05) s.tiles.terrain[i] = Terrain.Sand;
      else {
        let t = 0;
        for (const [wx, wz, r] of woods) t = Math.max(t, 1 - Math.hypot(x - wx, z - wz) / r);
        if (t > 0.15 && rnd() < t + 0.2) s.tiles.trees[i] = 1 + Math.floor(rnd() * 3);
      }
    }
  }
  return s;
}

function cityState(): GameState {
  const s = fakeMap(4242, 'Pebbleton');
  // A little street grid with zones and some buildings, enough for tips to have something to see.
  for (let x = 20; x < 44; x++) setRoad(s, x, 30);
  for (let z = 22; z < 40; z++) setRoad(s, 30, z);
  for (let x = 22; x < 30; x++) for (const z of [28, 29, 31, 32]) setZone(s, x, z, ZoneType.Res, 2);
  for (let x = 31; x < 40; x++) for (const z of [28, 29]) setZone(s, x, z, ZoneType.Com, 1);
  for (let x = 31; x < 40; x++) for (const z of [31, 32]) setZone(s, x, z, ZoneType.Ind, 1);
  s.buildings.push({ id: 0, type: 'power_coal', x: 40, z: 33, w: 3, h: 3, rot: 0, active: true });
  s.buildings.push({ id: 1, type: 'water_tower', x: 26, z: 33, w: 1, h: 1, rot: 0, active: true });
  s.day = DAYS_PER_MONTH * 14 + 12; // Mar, Year 2
  s.money = 18420;
  s.milestone = 2; // Village
  s.speed = 1;
  s.stats.population = 683;
  s.stats.workforce = 410;
  s.stats.jobsCom = 120;
  s.stats.jobsInd = 210;
  s.stats.unemployment = 0.12;
  s.stats.demand = { res: 0.62, com: 0.28, ind: -0.22 };
  s.stats.happiness = 71;
  s.stats.income = { res: 1240, com: 560, ind: 430, total: 2230 };
  s.stats.expenses = { roads: 140, buildings: 560, total: 700 };
  s.stats.developed = { res: 32, com: 18, ind: 18 };
  s.history = fakeHistory(15);
  return s;
}

function fakeHistory(months: number): MonthRecord[] {
  const out: MonthRecord[] = [];
  let money = START_MONEY;
  let pop = 0;
  for (let k = 1; k <= months; k++) {
    pop = Math.round(pop + 30 + k * 4 + Math.sin(k) * 10);
    const income = Math.round(pop * 2.6);
    const expenses = 500 + k * 12;
    money += income - expenses - (k < 5 ? 2600 : 300);
    out.push({ day: k * DAYS_PER_MONTH, population: pop, money, income, expenses, happiness: 60 + Math.sin(k) * 8 });
  }
  return out;
}

function setRoad(s: GameState, x: number, z: number) {
  const i = z * s.size + x;
  s.tiles.kind[i] = TileKind.Road;
  s.tiles.trees[i] = 0;
  s.tiles.terrain[i] = Terrain.Grass;
  markTile(s, i);
}
function setZone(s: GameState, x: number, z: number, zone: ZoneType, level: number) {
  const i = z * s.size + x;
  s.tiles.kind[i] = TileKind.Zone;
  s.tiles.zone[i] = zone;
  s.tiles.level[i] = level;
  s.tiles.power[i] = 1;
  s.tiles.trees[i] = 0;
  s.tiles.terrain[i] = Terrain.Grass;
  markTile(s, i);
}

// ---------------------------------------------------------------- fake actions

let state = cityState();
let tool: ToolId = 'inspect';
let overlay: OverlayKind = 'none';
let undoDepth = 2;
let settings: Settings = { quality: 'high', sfxVolume: 0.8, musicVolume: 0.5, haptics: true, tips: true, seenTips: ['roads', 'zones', 'power', 'water', 'shops', 'industry', 'look', 'jobs', 'services', 'money'] };
const log: string[] = [];
/** Harness switches for the title screen paths. */
const flags = { hasSave: true, continueOk: true };

const actions: UIActions = {
  getState: () => state,
  setTool: (t) => {
    tool = t;
    log.push('tool ' + t);
  },
  getTool: () => tool,
  setSpeed: (sp: Speed) => {
    state.speed = sp;
  },
  setOverlay: (o) => {
    overlay = o;
  },
  getOverlay: () => overlay,
  setTax: (zone, v) => {
    state.taxes[zone] = v;
    // Pretend the sim reacted: demand falls with tax, income rises.
    state.stats.demand[zone] = Math.max(-1, Math.min(1, 0.6 - (v - 9) * 0.08));
    state.stats.income[zone] = Math.round((zone === 'res' ? 138 : zone === 'com' ? 62 : 48) * v);
    state.stats.income.total = state.stats.income.res + state.stats.income.com + state.stats.income.ind;
  },
  undo: () => {
    undoDepth = Math.max(0, undoDepth - 1);
  },
  canUndo: () => undoDepth > 0,
  previewMap: (seed) => fakeMap(seed),
  startNewCity: (seed, name) => {
    log.push(`start ${seed} ${name}`);
    state = fakeMap(seed, name);
    tool = 'inspect';
    emit({ type: 'reset' });
  },
  continueCity: async () => flags.continueOk,
  hasSave: async () => flags.hasSave,
  saveNow: async () => {},
  exportSave: () => 'CUBO1.' + btoa(JSON.stringify({ name: state.name, day: state.day, money: state.money })).repeat(6),
  importSave: async (code) => code.startsWith('CUBO1.'),
  getSettings: () => settings,
  setSettings: (s) => {
    settings = s;
  },
  focusTile: (x, z) => log.push(`focus ${x},${z}`),
  click: () => {},
};

// ---------------------------------------------------------------- boot

const canvas = document.getElementById('world') as HTMLCanvasElement;
paintWorld(canvas);
const root = document.getElementById('ui')!;
const ui = createUI(root, actions);

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  ui.update(state, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- scenarios for screenshots

const road: Plan = { tool: 'road', tiles: Array.from({ length: 14 }, (_, k) => k), ok: Array(14).fill(true), cost: 140, valid: true };
const badPlan: Plan = { tool: 'build:power_coal', tiles: [1, 2, 3], ok: [false, false, false], cost: 4000, valid: false, reason: 'Not enough money' };
const inspectInfo: TileInfo = {
  x: 24,
  z: 28,
  title: 'Apartments',
  subtitle: 'Homes, level 2 of 3',
  rows: [
    { label: 'Residents', value: '18' },
    { label: 'Land value', value: 'Medium', tone: 'neutral' },
    { label: 'Power', value: 'Yes', tone: 'good' },
    { label: 'Water', value: 'No', tone: 'bad' },
    { label: 'Pollution', value: 'Clean air', tone: 'good' },
    { label: 'Nearby', value: 'Police, Parks', tone: 'neutral' },
  ],
  problems: ['No water: build a water tower within reach, or this building will shrink.', 'Struggling: if this goes on it will drop a level.'],
};

function click(sel: string, n = 0) {
  const el = root.querySelectorAll<HTMLElement>(sel)[n];
  if (!el) throw new Error('no element ' + sel);
  el.click();
}
function dockBtn(label: string): HTMLElement {
  const el = [...root.querySelectorAll<HTMLElement>('.dock-btn')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error('no dock button ' + label);
  return el;
}

/** Put the UI into a clean in-game state (the shot script loads a fresh page per scenario). */
function base() {
  ui.showInspect(null);
  ui.setPreview(null);
  state = cityState();
  tool = 'inspect';
  overlay = 'none';
  undoDepth = 2;
  settings = { ...settings, tips: true, seenTips: ['roads', 'zones', 'power', 'water', 'shops', 'industry', 'look', 'jobs', 'services', 'money'] };
  emit({ type: 'reset' });
}

const scenarios: Record<string, () => void | Promise<void>> = {
  title: () => {
    ui.showTitle();
  },
  titleNoSave: () => {
    flags.hasSave = false;
    ui.showTitle();
  },
  titleBrokenSave: async () => {
    flags.continueOk = false;
    ui.showTitle();
    await new Promise((r) => setTimeout(r, 50));
    click('.title-btns .pbtn', 0);
  },
  newcity: () => {
    ui.showTitle();
    click('.title-btns .pbtn', 1);
  },
  hud: () => base(),
  empty: () => {
    base();
    state = fakeMap(99, 'Cloverby');
    state.money = START_MONEY;
    undoDepth = 0;
  },
  broke: () => {
    base();
    state.money = -1250;
    state.history[state.history.length - 1].income = 300;
    state.history[state.history.length - 1].expenses = 1900;
    state.stats.happiness = 31;
    state.stats.population = 1234567;
    state.day = DAYS_PER_MONTH * 12 * 11 + 3;
    state.milestone = MILESTONES.length - 1;
    state.speed = 0;
  },
  trayZones: () => {
    base();
    dockBtn('Zones').click();
  },
  trayUtil: () => {
    base();
    state.money = 2000;
    dockBtn('Utilities').click();
  },
  trayServices: () => {
    base();
    dockBtn('Services').click();
  },
  chip: () => {
    base();
    dockBtn('Zones').click();
    click('.card', 0);
  },
  chipBuild: () => {
    base();
    dockBtn('Utilities').click();
    click('.card', 0);
  },
  pill: () => {
    base();
    dockBtn('Roads').click();
    ui.setPreview(road);
  },
  pillBad: () => {
    base();
    dockBtn('Utilities').click();
    click('.card', 0);
    ui.setPreview(badPlan);
  },
  inspect: () => {
    base();
    ui.showInspect(inspectInfo);
  },
  inspectPlant: () => {
    base();
    ui.showInspect({
      x: 40,
      z: 33,
      title: 'Coal Power Plant',
      subtitle: 'Lots of power, lots of smoke.',
      buildingId: 0,
      rows: [
        { label: 'Status', value: 'Working', tone: 'good' },
        { label: 'Power supplied', value: '412 / 600', tone: 'neutral' },
        { label: 'Reach', value: '16 tiles' },
        { label: 'Pollution', value: 'Heavy', tone: 'bad' },
        { label: 'Upkeep', value: '$110 / month (up to $160 at full load)' },
      ],
      problems: [],
    });
  },
  budget: () => {
    base();
    click('.tools .tool-btn', 1);
  },
  budgetEmpty: () => {
    base();
    state.history = [];
    click('.tools .tool-btn', 1);
  },
  layers: () => {
    base();
    overlay = 'landValue';
    click('.tools .tool-btn', 0);
  },
  legend: () => {
    base();
    overlay = 'power';
  },
  legendRamp: () => {
    base();
    overlay = 'pollution';
    ui.showInspect(inspectInfo);
  },
  settings: () => {
    base();
    click('.tools .tool-btn', 2);
  },
  backup: () => {
    base();
    click('.tools .tool-btn', 2);
    click('.set-action', 1);
  },
  restoreBad: async () => {
    base();
    click('.tools .tool-btn', 2);
    click('.set-action', 2);
    (root.querySelector('.set-restore textarea') as HTMLTextAreaElement).value = 'garbage';
    click('.set-restore .pbtn');
  },
  confirm: () => {
    base();
    click('.tools .tool-btn', 2);
    click('.set-action', 3);
  },
  milestone: () => {
    base();
    emit({ type: 'milestone', index: 2, name: 'Village', reward: 2500, unlocked: ['power_wind', 'water_pump', 'clinic', 'school'] });
    emit({ type: 'toast', text: 'Pebbleton is now a Village! +$2,500. New: Wind Turbine, Water Pump, Clinic, School.', tone: 'good' });
  },
  tipRoads: () => {
    base();
    state = fakeMap(5, 'Cloverby');
    undoDepth = 0;
    settings = { ...settings, tips: true, seenTips: [] };
  },
  tipPower: () => {
    base();
    state = fakeMap(5, 'Cloverby');
    for (let x = 10; x < 20; x++) setRoad(state, x, 10);
    for (let x = 10; x < 20; x++) setZone(state, x, 11, ZoneType.Res, 0);
    settings = { ...settings, tips: true, seenTips: [] };
  },
  tipZones: () => {
    base();
    state = fakeMap(5, 'Cloverby');
    for (let x = 10; x < 20; x++) setRoad(state, x, 10);
    settings = { ...settings, tips: true, seenTips: ['roads'] };
    dockBtn('Roads').click();
  },
  tipBudget: () => {
    base();
    state.money = 1200;
    state.stats.income.total = 300;
    settings = { ...settings, tips: true, seenTips: ['roads', 'zones', 'power', 'water', 'shops', 'industry', 'look', 'jobs', 'services'] };
  },
  toasts: () => {
    base();
    emit({ type: 'toast', text: 'Not enough money', tone: 'bad' });
    emit({ type: 'toast', text: 'Pebbleton now has 600 people.', tone: 'good' });
    emit({ type: 'toast', text: 'Homes near the coal plant are unhappy about the smoke. Move industry away from homes.', tone: 'info' });
  },
};

(window as unknown as { __ui: unknown }).__ui = {
  ready: true,
  log,
  async run(name: string) {
    const fn = scenarios[name];
    if (!fn) throw new Error('unknown scenario ' + name);
    await fn();
  },
  names: Object.keys(scenarios),
  state: () => state,
  /** What the fake game has been told, for tools/dev/ui-interact.mjs. */
  probe: () => ({
    tool,
    overlay,
    speed: state.speed,
    taxes: { ...state.taxes },
    modal: ui.isModalOpen(),
    settings,
    undoDepth,
    name: state.name,
    log: [...log],
  }),
  setUndo: (n: number) => {
    undoDepth = n;
  },
  preview: (on: boolean) => ui.setPreview(on ? road : null),
  inspect: (on: boolean) => ui.showInspect(on ? inspectInfo : null),
  emitToast: (text: string) => emit({ type: 'toast', text, tone: 'info' }),
  buildRoad: () => {
    for (let x = 30; x < 36; x++) setRoad(state, x, 40);
  },
};
