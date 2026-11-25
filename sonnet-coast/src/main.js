import * as THREE from 'three';
import { G, emit } from './state.js';
import { Input } from './input.js';
import { createRenderer } from './render.js';
import { buildWorld } from './world/world.js';
import { Game } from './game.js';
import { HUD } from './ui/hud.js';
import { Menus } from './ui/menus.js';
import { AudioSystem } from './audio/audio.js';
import { Radio } from './audio/radio.js';
import { loadSave, writeSave, hasSave, clearSave, defaultSave } from './save.js';
import { Vehicle } from './entities/vehicle.js';
import { groundHeight } from './world/roads.js';
import { POI } from './world/layout.js';
import { Touch } from './touch.js';
import './plugins.js';

async function boot() {
  const canvas = document.getElementById('game');
  const ui = document.getElementById('ui');
  const params = new URLSearchParams(location.search);
  const hadSave = hasSave();
  G.save = loadSave();
  if (G.save.settings) Object.assign(G.settings, G.save.settings);
  if (params.get('q')) { G.settings.quality = params.get('q'); G.settings.qualityChosen = true; }

  Touch.init(ui, params);
  // phones start one preset down; the automatic fallback can still drop it further
  if (Touch.on && !G.settings.qualityChosen && !hadSave) G.settings.quality = 'medium';
  const R = createRenderer(canvas);
  Input.init(canvas);
  let game = null, world = null;
  const tick = () => new Promise((r) => setTimeout(r, 0));

  const applySettings = (recompile) => {
    G.audio.setVolumes(G.settings.volume, G.settings.musicVolume);
    if (recompile && world) { R.applyQuality(); world.props.setQuality(G.settings.quality); world.quality = G.settings.quality; }
  };
  const lock = () => { Input.lock(); };
  const resume = () => {
    G.menus.close(true);
    G.mode = 'play';
    G.audio.resume();
    lock();
    Touch.fullscreen();
  };
  const start = (fresh) => {
    if (fresh) {
      clearSave();
      const settings = { ...G.settings };
      G.save = defaultSave();
      G.save.settings = settings;
      game.applySave();
      G.missions.resetWeights();
    }
    G.save.started = true;
    G.menus.close(true);
    G.hud.show(true);
    G.mode = 'play';
    G.audio.unlock();
    G.audio.setVolumes(G.settings.volume, G.settings.musicVolume);
    G.audio.resume();
    R.camera.fov = 62; R.camera.updateProjectionMatrix();
    G.cam.first = true; G.cam.yaw = Math.PI / 2;
    lock();
    Touch.fullscreen();
    if (!G.missions.done('intro')) game.introT = 1.2;
    else G.hud.toast('Welcome back, Kestrel. Jobs are marked on your map.');
    writeSave();
  };
  const pause = () => {
    if (G.mode !== 'play') return;
    G.mode = 'pause';
    Input.unlock();
    G.audio.suspend();
    G.menus.pause();
  };

  G.hooks = { applySettings };
  Touch.hooks.pause = pause;
  G.audio = new AudioSystem();
  G.radio = new Radio(G.audio);
  G.menus = new Menus(ui, { resume, startNew: () => start(true), startContinue: () => start(false), applySettings, quit: () => location.reload() });
  const progress = G.menus.loading();
  await tick();

  world = await buildWorld(R.scene, R.renderer, G.settings.quality, progress);
  progress('Drawing the map', 0.93); await tick();
  G.hud = new HUD(ui);
  G.radio.onChange = (np) => {
    if (!G.hud || !G.player || !G.player.vehicle) return;
    G.hud.radioPopup(np);
    // the phone layout has no room for the radio card, so the station shows as a toast
    if (Touch.on) G.hud.toast(np ? `♪ ${np.station} ${np.freq} · ${np.track}` : '♪ Radio off', np ? np.color : '');
  };
  progress('Waking the city', 0.97); await tick();
  game = new Game(R, world);
  R.applyQuality();
  world.props.setQuality(G.settings.quality);
  world.quality = G.settings.quality;
  G.fx.setScale(window.innerHeight);
  window.addEventListener('resize', () => G.fx.setScale(window.innerHeight));
  // Compile every shader up front so the first minute of play does not hitch.
  progress('Compiling shaders', 0.99); await tick();
  try {
    await Promise.race([R.renderer.compileAsync(R.scene, R.camera), new Promise((r) => setTimeout(r, 12000))]);
  } catch (e) { /* the renderer will compile lazily instead */ }
  if (params.get('hour')) world.env.setHour(parseFloat(params.get('hour')));

  G.mode = 'title';
  G.menus.title(hadSave);
  canvas.addEventListener('click', () => { if (G.mode === 'play') lock(); });
  Input.onUnlock = () => { if (G.mode === 'play' && !window.__dbg.noAutoPause) pause(); };
  window.addEventListener('beforeunload', () => { if (G.save.started) writeSave(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') pause(); });

  R.renderer.info.autoReset = false;
  window.__dbg = { G, R, world, game, THREE, Input, Touch, Vehicle, groundHeight, POI, emit, freeze: false, fixedDt: 0, noRender: false, noAutoPause: false };
  let last = performance.now(), t = 0;
  const handleKeys = () => {
    if (G.mode === 'play') {
      if (Input.rawHit('Escape', 'KeyP')) pause();
      else if (Input.rawHit('KeyM')) { G.mode = 'map'; Input.unlock(); G.menus.map(); }
    } else if (G.mode === 'map') {
      if (Input.rawHit('Escape', 'KeyM')) resume();
    } else if (G.mode === 'pause' || G.mode === 'menu') {
      if (Input.rawHit('Escape')) { if (G.menus.kind === 'sub' && G.menus.back) G.menus.back(); else resume(); }
    }
  };
  function frame(now) {
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (window.__dbg.fixedDt) dt = window.__dbg.fixedDt;
    handleKeys();
    Touch.update(dt);
    Input.setEnabled(G.mode === 'play');
    if (!window.__dbg.freeze) {
      if (G.mode === 'play') { t += dt; game.update(dt, t); }
      else if (G.mode === 'title' || G.mode === 'loading') { t += dt; game.titleUpdate(dt, t); }
      else if (G.mode === 'map') G.menus.drawMap();
    }
    window.__info = { calls: R.renderer.info.render.calls, tris: R.renderer.info.render.triangles };
    R.renderer.info.reset();
    if (!window.__dbg.noRender) R.render();
    Input.endFrame();
    window.__frames = (window.__frames || 0) + 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Test hooks: start without the title screen and advance the simulation by hand.
  window.__dbg.start = (fresh = true) => { window.__dbg.noAutoPause = true; start(fresh); Input.mouse.locked = true; };
  window.__dbg.step = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) { t += dt; Input.setEnabled(true); game.update(dt, t); Input.endFrame(); } return t; };
  window.__dbg.time = () => t;
  window.__ready = true;
}
boot().catch((e) => { console.error(e); window.__error = String((e && e.stack) || e); });
