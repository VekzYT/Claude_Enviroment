// OWNER: integrator. Boots the game, wires the modules together and runs the frame loop.
//
//   world (render/)  draws the city;        input (input/)  turns touches into camera moves and plans;
//   sim (sim/)       runs the city;         ui (ui/)        the HTML interface over the canvas;
//   audio (audio/)   sound and music;       platform        saves, settings and haptics.
//
// Boot order: safe-area insets and error banner first (so even a failed start is visible), then
// settings, audio, a backdrop city for the title screen, the renderer, input and the interface.
// The game proper starts when the player picks New City / Continue / Restore.
import './ui/ui.css';
import './boot.css';

import { Vector3 } from 'three';
import { connectAudio, createAudio, type AudioEngine } from './audio';
import { DAY_CYCLE_SECONDS, DAY_SECONDS } from './core/config';
import { emit, on } from './core/events';
import { randomSeed } from './core/rng';
import { nightAmount } from './core/state';
import type { GameState, OverlayKind, Plan, Settings, Speed, TilePos, ToolId } from './core/types';
import { createInputController, type InputControllerFull, type InputHooks } from './input';
import { connectHaptics, haptic, loadSave, loadSettings, saveSettings, storeSave } from './platform/native';
import { createWorldRenderer, type WorldRenderer } from './render';
import { warmModels } from './render/models';
import {
  applyPlan,
  canUndo,
  describeTile,
  deserialize,
  newGame,
  planTool,
  serialize,
  setTax,
  simulateDay,
  undo as undoAction,
} from './sim';
import { createUI, type UI, type UIActions } from './ui';

/** The one save slot the game uses. */
const SLOT = 'city';
/** Longest frame step (seconds): a stall or a trip to the background never jumps the city ahead. */
const MAX_DT = 0.1;
/** Most game days simulated in one frame. */
const MAX_DAYS_PER_FRAME = 8;
/** How often the open inspect card gets fresh numbers (seconds). */
const INSPECT_REFRESH = 0.5;
/** Ambience follows the city a few times a second. */
const AMBIENCE_EVERY = 0.25;
/** Autosaves (monthly, or after building while paused) happen at most this often (ms). */
const AUTOSAVE_MIN_GAP_MS = 8000;
/** Changes made while paused are saved after this long without a month passing (ms). */
const AUTOSAVE_IDLE_MS = 20000;
/** The title screen slowly circles the backdrop city (radians per second). */
const TITLE_ORBIT_SPEED = 0.045;

// ---------------------------------------------------------------------------------------------
// Page setup: safe-area insets and the debug readout from the URL
// ---------------------------------------------------------------------------------------------

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';

/** ?safe=L,R,B (CSS px) stands in for the device's safe-area insets (Chromium cannot emulate them). */
function applySafeAreas(spec: string | null): void {
  if (!spec) return;
  const parts = spec.split(',').map((v) => Number(v));
  const names = ['--safe-left', '--safe-right', '--safe-bottom'];
  for (let k = 0; k < names.length; k++) {
    const v = parts[k];
    if (Number.isFinite(v) && v >= 0 && v <= 400) document.documentElement.style.setProperty(names[k], `${v}px`);
  }
}
applySafeAreas(params.get('safe'));

// ---------------------------------------------------------------------------------------------
// A friendly error banner for anything that goes wrong
// ---------------------------------------------------------------------------------------------

let banner: HTMLDivElement | null = null;
let bannerDetail: HTMLElement | null = null;
let bannerCount = 0;
const reported = new Set<string>();

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message || err.name || 'Unknown error';
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err) ?? String(err);
  } catch {
    return String(err);
  }
}

function showBanner(title: string, detail: string): void {
  if (!document.body) return;
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'boot-banner';
    banner.setAttribute('role', 'alert');
    const icon =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 22 20H2z" fill="#fff" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M12 3.5 22 20H2z" fill="#e2453a" stroke="#e2453a" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M12 9.5v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.4" fill="#fff"/></svg>';
    banner.innerHTML =
      `<div class="bb-icon">${icon}</div>` +
      `<div class="bb-text"><b class="bb-title"></b><span class="bb-sub"></span><code class="bb-detail"></code></div>` +
      `<div class="bb-btns"><button type="button" class="bb-btn bb-reload">Reload</button>` +
      `<button type="button" class="bb-btn bb-close">Keep playing</button></div>`;
    banner.querySelector('.bb-reload')!.addEventListener('click', () => {
      saveCity('reload');
      location.reload();
    });
    banner.querySelector('.bb-close')!.addEventListener('click', () => {
      banner?.remove();
      banner = null;
      bannerCount = 0;
    });
    document.body.appendChild(banner);
    bannerDetail = banner.querySelector('.bb-detail');
  }
  bannerCount++;
  (banner.querySelector('.bb-title') as HTMLElement).textContent = title;
  (banner.querySelector('.bb-sub') as HTMLElement).textContent = playing
    ? 'Your city saves by itself, so reloading is safe. If it keeps happening, take a screenshot of this.'
    : 'Reloading usually fixes it. If it keeps happening, take a screenshot of this.';
  if (bannerDetail) bannerDetail.textContent = bannerCount > 1 ? `${detail} (+${bannerCount - 1} more)` : detail;
}

/** Report an unexpected error: once to the console per distinct message, and in the banner. */
function reportError(err: unknown, where = ''): void {
  const msg = errorText(err).slice(0, 300);
  const key = where + '|' + msg;
  if (!reported.has(key)) {
    reported.add(key);
    console.error('Cubopolis error' + (where ? ` (${where})` : '') + ':', err);
  }
  showBanner('Oops, something went wrong', msg);
}

window.addEventListener('error', (e) => {
  // Resource load errors (no e.error, target is an element) are not code errors.
  if (!e.error && !e.message) return;
  reportError(e.error ?? e.message, 'uncaught');
});
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'promise'));

// ---------------------------------------------------------------------------------------------
// Game state shared by everything below
// ---------------------------------------------------------------------------------------------

let settings: Settings = loadSettings();
/** The city on screen. Before a city is started it is a backdrop for the title screen. */
let state: GameState = newGame(randomSeed(), 'Cubopolis');
/** True once the player is in a real city (New City / Continue / Restore): only then do we save. */
let playing = false;
let tool: ToolId = 'inspect';
let overlay: OverlayKind = 'none';
let inspected: TilePos | null = null;
let pageHidden = document.visibilityState === 'hidden';
let unsaved = false;
let lastSaveAt = 0;
let lastChangeAt = 0;
let saveDue = false;
let lastSaveErrorAt = -Infinity;

let world: WorldRenderer;
let input: InputControllerFull;
let ui: UI;
let audio: AudioEngine;

// ---------------------------------------------------------------------------------------------
// Saving and loading
// ---------------------------------------------------------------------------------------------

/** Store the current city in the save slot. Resolves false (and warns once in a while) on failure. */
function saveCity(reason: string): Promise<boolean> {
  if (!playing) return Promise.resolve(false);
  let text: string;
  try {
    text = serialize(state);
  } catch (err) {
    reportError(err, 'save');
    return Promise.resolve(false);
  }
  lastSaveAt = performance.now();
  unsaved = false;
  saveDue = false;
  return storeSave(SLOT, text).then(
    () => true,
    (err) => {
      unsaved = true;
      const now = performance.now();
      if (reason !== 'manual' && now - lastSaveErrorAt > 60000) {
        lastSaveErrorAt = now;
        emit({ type: 'toast', text: 'Could not save your city. Free some space on the phone, then try Menu → Save now.', tone: 'bad' });
      }
      if (reason === 'manual') throw err;
      return false;
    },
  );
}

/** Put a city on screen and start playing it. */
function startCity(s: GameState): void {
  state = s;
  playing = true;
  simAcc = 0;
  tool = 'inspect';
  inspected = null;
  overlay = 'none';
  input.cancel();
  input.setTool('inspect');
  input.setMapSize(s.size);
  input.rig.reset(true);
  world.setState(s);
  world.setOverlay('none');
  world.setPreview(null);
  world.setSelection(null);
  ui.setPreview(null);
  ui.showInspect(null);
  unsaved = false;
  emit({ type: 'reset' });
}

// ---------------------------------------------------------------------------------------------
// What the interface can ask for
// ---------------------------------------------------------------------------------------------

function closeInspect(): void {
  inspected = null;
  world.setSelection(null);
  ui.showInspect(null);
}

const actions: UIActions = {
  getState: () => state,
  setTool(t) {
    if (t === tool) return;
    tool = t;
    input.setTool(t);
    world.setPreview(null);
    ui.setPreview(null);
    if (t !== 'inspect') {
      audio.play('tool');
      if (inspected) closeInspect();
    }
  },
  getTool: () => tool,
  setSpeed(speed: Speed) {
    state.speed = speed;
  },
  setOverlay(kind) {
    overlay = kind;
    world.setOverlay(kind);
  },
  getOverlay: () => overlay,
  setTax(zone, percent) {
    setTax(state, zone, percent);
  },
  undo() {
    if (undoAction(state)) {
      lastChangeAt = performance.now();
      unsaved = true;
    }
  },
  canUndo: () => playing && canUndo(state),
  previewMap: (seed) => newGame(seed),
  startNewCity(seed, name) {
    startCity(newGame(seed, name));
    void saveCity('new');
  },
  async continueCity() {
    const text = await loadSave(SLOT);
    if (!text) return false;
    let s: GameState;
    try {
      s = deserialize(text);
    } catch (err) {
      console.warn('Cubopolis: the saved city could not be loaded:', errorText(err));
      return false;
    }
    startCity(s);
    return true;
  },
  async hasSave() {
    return (await loadSave(SLOT)) !== null;
  },
  async saveNow() {
    await saveCity('manual');
  },
  exportSave: () => serialize(state),
  async importSave(code) {
    let s: GameState;
    try {
      s = deserialize(code);
    } catch (err) {
      emit({ type: 'toast', text: errorText(err), tone: 'bad' });
      return false;
    }
    startCity(s);
    await saveCity('import');
    return true;
  },
  getSettings: () => settings,
  setSettings(next) {
    const prev = settings;
    settings = next;
    saveSettings(next);
    audio.setVolumes(next.sfxVolume, next.musicVolume);
    if (next.quality !== prev.quality) {
      world.setQuality(next.quality);
      resize();
    }
  },
  focusTile(x, z) {
    input.rig.focus(x, z);
  },
  click() {
    audio.play('click');
    haptic('selection');
  },
  inspectClosed() {
    inspected = null;
    world.setSelection(null);
  },
};

// ---------------------------------------------------------------------------------------------
// What the input module calls
// ---------------------------------------------------------------------------------------------

let lastPreviewTiles = -1;
const hooks: InputHooks = {
  plan: (t, a, b) => planTool(state, t, a, b),
  apply(plan: Plan) {
    // applyPlan emits 'applied' or 'denied'; sounds and haptics follow those events.
    applyPlan(state, plan);
    if (plan.valid) {
      lastChangeAt = performance.now();
      unsaved = true;
    }
  },
  preview(plan) {
    world.setPreview(plan);
    ui.setPreview(plan);
    // A light tick each time a drag grows or shrinks by a tile.
    const n = plan ? plan.tiles.length : -1;
    if (plan && lastPreviewTiles >= 0 && n !== lastPreviewTiles) haptic('selection');
    lastPreviewTiles = n;
  },
  inspect(tile) {
    if (!tile || !playing) {
      closeInspect();
      return;
    }
    inspected = { x: tile.x, z: tile.z };
    world.setSelection(inspected);
    ui.showInspect(describeTile(state, tile.x, tile.z));
  },
  pick: (x, y) => world.pickTile(x, y),
  touched: () => audio.unlock(),
};

// ---------------------------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------------------------

let canvas: HTMLCanvasElement;
let sizedW = 0;
let sizedH = 0;
let sizedDpr = 0;

function resize(): void {
  if (!world) return;
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  sizedW = w;
  sizedH = h;
  sizedDpr = dpr;
  world.resize(w, h, dpr);
}

// ---------------------------------------------------------------------------------------------
// The frame loop
// ---------------------------------------------------------------------------------------------

let last = performance.now();
let simAcc = 0;
let inspectAcc = 0;
let ambienceAcc = AMBIENCE_EVERY;
let inputBlocked = false;
let booted = false;
let loopErrors = 0;

// debug readout
let debugEl: HTMLDivElement | null = null;
let fpsFrames = 0;
let fpsTime = 0;

function tick(dt: number): void {
  const modal = ui.isModalOpen();
  if (modal !== inputBlocked) {
    inputBlocked = modal;
    input.setEnabled(!modal);
    if (modal) input.cancel();
  }

  // ---- the city
  const running = playing && state.speed > 0 && !modal;
  if (running) {
    const per = DAY_SECONDS[state.speed];
    simAcc += dt;
    let days = 0;
    while (simAcc >= per && days < MAX_DAYS_PER_FRAME) {
      simulateDay(state);
      simAcc -= per;
      days++;
    }
    // Too far behind (a slow device at top speed): drop the backlog rather than spiral.
    if (simAcc > per) simAcc = per;
    state.timeOfDay = (state.timeOfDay + (dt * state.speed) / DAY_CYCLE_SECONDS) % 1;
  }

  // ---- the title backdrop circles slowly
  if (!playing) input.rig.yaw = input.rig.yaw + dt * TITLE_ORBIT_SPEED;

  // ---- camera and world
  input.update(dt);
  input.rig.apply(world.camera);
  world.update(dt, state);

  // ---- the open inspect card follows the tile as it changes
  if (inspected) {
    if (!ui.isInspectOpen()) {
      inspected = null;
      world.setSelection(null);
    } else {
      inspectAcc += dt;
      if (inspectAcc >= INSPECT_REFRESH) {
        inspectAcc = 0;
        ui.refreshInspect(describeTile(state, inspected.x, inspected.z));
      }
    }
  }

  ui.update(state, dt);

  ambienceAcc += dt;
  if (ambienceAcc >= AMBIENCE_EVERY) {
    ambienceAcc = 0;
    audio.setAmbience({ population: state.stats.population, night: nightAmount(state.timeOfDay), paused: !running });
  }

  world.render();
  if (!booted) {
    booted = true;
    console.log('CUBOPOLIS_BOOT_OK');
    // Build every model while the title screen is up, so nothing stalls a frame later.
    setTimeout(() => {
      try {
        warmModels();
      } catch (err) {
        reportError(err, 'models');
      }
    }, 300);
  }

  // ---- autosave: once a month (sim 'month' event sets saveDue), or a while after changes made while paused
  if (playing) {
    const now = performance.now();
    if ((saveDue || (unsaved && now - lastChangeAt > AUTOSAVE_IDLE_MS)) && now - lastSaveAt > AUTOSAVE_MIN_GAP_MS) {
      void saveCity('auto');
    }
  }

  if (debugEl) updateDebug(dt);
}

function updateDebug(dt: number): void {
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime < 0.5 || !debugEl) return;
  const fps = fpsFrames / fpsTime;
  fpsFrames = 0;
  fpsTime = 0;
  const s = world.stats();
  debugEl.textContent = `${fps.toFixed(0)} fps · ${s.drawCalls} draws · ${(s.triangles / 1000).toFixed(0)}k tris · day ${state.day}`;
}

function frame(now: number): void {
  requestAnimationFrame(frame);
  if (pageHidden) {
    last = now;
    return;
  }
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 0;
  if (dt > MAX_DT) dt = MAX_DT;
  try {
    tick(dt);
    loopErrors = 0;
  } catch (err) {
    reportError(err, 'frame');
    // A frame that keeps failing would flood the page; after a few in a row, slow the city down.
    if (++loopErrors > 30 && playing) state.speed = 0;
  }
}

// ---------------------------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------------------------

function boot(): void {
  canvas = document.getElementById('world') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui') as HTMLElement;
  if (!canvas || !uiRoot) throw new Error('The page is missing its game elements.');

  audio = createAudio();
  audio.setVolumes(settings.sfxVolume, settings.musicVolume);

  try {
    world = createWorldRenderer(canvas, state, settings.quality);
  } catch (err) {
    console.error('Cubopolis: 3D graphics failed to start:', err);
    showBanner('Cubopolis could not start its 3D graphics', 'This device or browser has WebGL switched off or unavailable. ' + errorText(err));
    return;
  }
  resize();
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.clientWidth !== sizedW || canvas.clientHeight !== sizedH || dpr !== sizedDpr) resize();
    }).observe(canvas);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => {
    resize();
    setTimeout(resize, 250);
  });

  input = createInputController(canvas, hooks, state.size);
  input.rig.reset(true);

  ui = createUI(uiRoot, actions);

  // Sounds and haptics for game events (applied, denied, undo, milestone, month, lots growing).
  connectAudio(audio);
  connectHaptics();
  on('month', () => {
    if (playing) saveDue = true;
  });

  // iOS starts audio only inside a gesture, and again after interruptions: unlock on every one.
  const unlock = () => audio.unlock();
  window.addEventListener('touchend', unlock, { capture: true, passive: true });
  window.addEventListener('pointerup', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true });

  // Escape (keyboards) closes the topmost panel, then drops the tool in hand.
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
      t.blur();
      return;
    }
    if (ui.back()) return;
    if (playing && !ui.isModalOpen() && tool !== 'inspect') actions.setTool('inspect');
  });

  // Background: save, silence, and stop the clock until we are back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pageHidden = true;
      void saveCity('hidden');
      audio.suspend();
    } else {
      pageHidden = false;
      last = performance.now();
      audio.resume();
      resize();
    }
  });
  window.addEventListener('pagehide', () => {
    void saveCity('pagehide');
  });

  if (DEBUG) {
    debugEl = document.createElement('div');
    debugEl.className = 'boot-debug';
    document.body.appendChild(debugEl);
  }
  // A small read-only window into the game for the smoke test and the browser console.
  const proj = new Vector3();
  (window as unknown as Record<string, unknown>).cubopolis = {
    get state() {
      return state;
    },
    get playing() {
      return playing;
    },
    get tool() {
      return tool;
    },
    /** Screen point (CSS px) of a tile's centre on the ground. */
    tileToScreen(x: number, z: number) {
      proj.set(x + 0.5, 0, z + 0.5).project(world.camera);
      return { x: ((proj.x + 1) / 2) * sizedW, y: ((1 - proj.y) / 2) * sizedH, inFront: proj.z < 1 };
    },
    view() {
      const v = input.rig.current;
      return { tx: v.tx, tz: v.tz, yaw: v.yaw, pitch: v.pitch, distance: v.distance };
    },
    stats: () => world.stats(),
  };

  ui.showTitle();

  // Show the saved city behind the title screen when there is one.
  loadSave(SLOT)
    .then((text) => {
      if (!text || playing) return;
      try {
        const s = deserialize(text);
        if (playing) return;
        state = s;
        world.setState(s);
        input.setMapSize(s.size);
        input.rig.reset(true);
      } catch {
        // A damaged save: the title keeps the fresh map, and Continue explains the problem.
      }
    })
    .catch(() => {});

  last = performance.now();
  requestAnimationFrame(frame);
}

try {
  boot();
} catch (err) {
  reportError(err, 'boot');
}
