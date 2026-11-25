// Shared game context. Modules import G and read/write the parts they own.
// Objects on this layer are drawn by the main camera (and its shadows) but skipped by the
// reflection probe, whose blurry 128-pixel faces could never show them anyway.
export const DETAIL_LAYER = 1;

export const G = {
  scene: null,
  camera: null,
  renderer: null,
  time: 0,          // seconds since start (game time, paused excluded)
  dt: 0,
  paused: true,
  started: false,
  player: null,     // on-foot player controller
  vehicles: [],     // every live vehicle
  peds: null,       // pedestrian system
  police: null,     // wanted / police system
  traffic: null,
  missions: null,
  hud: null,
  audio: null,
  radio: null,
  fx: null,
  weapons: null,
  env: null,
  settings: {
    quality: 'high', // low | medium | high
    qualityChosen: false, // true once the player picks a preset; stops the automatic fallback
    sensitivity: 1,
    touchSize: 1, // scale of the on-screen buttons (phones)
    invertY: false,
    volume: 0.8,
    musicVolume: 0.6,
    showFps: false,
  },
  save: null,
  interact: { active: false },
  indoors: null,     // the interior the player is in, or null outdoors (ambient spawners pause while set)
  game: null,
  menus: null,
  mode: 'loading',
  events: new Map(),
};

// Feature modules plug into the game without editing game.js: each calls addPlugin() when it is
// imported (see src/plugins.js). Hooks, all optional:
//   init(game)        once, at the end of the Game constructor (world, player, systems all exist)
//   update(dt, t)     every frame in play, after the world has updated
//   lateUpdate(dt, t) every frame, after the camera and HUD (good for HUD widgets)
export const plugins = [];
export function addPlugin(p) { plugins.push(p); return p; }

export function on(name, fn) {
  if (!G.events.has(name)) G.events.set(name, []);
  G.events.get(name).push(fn);
}
export function emit(name, ...args) {
  const list = G.events.get(name);
  if (list) for (const fn of list) fn(...args);
}
