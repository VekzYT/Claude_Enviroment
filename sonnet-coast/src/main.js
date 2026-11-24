import * as THREE from 'three';
import { G } from './state.js';
import { createRenderer } from './render.js';
import { buildWorld } from './world/world.js';
import { groundHeight } from './world/roads.js';

async function boot() {
  const canvas = document.getElementById('game');
  const R = createRenderer(canvas);
  const params = new URLSearchParams(location.search);
  if (params.get('q')) G.settings.quality = params.get('q');
  const world = await buildWorld(R.scene, R.renderer, G.settings.quality, (label, f) => console.log('[load]', label, f));
  G.env = world.env;
  G.world = world;
  R.applyQuality();
  world.props.setQuality(G.settings.quality);
  if (params.get('hour')) world.env.setHour(parseFloat(params.get('hour')));

  // temporary debug camera
  const cam = R.camera;
  const view = (params.get('view') || '-250,40,60,150,60,-50').split(',').map(Number);
  cam.position.set(view[0], view[1], view[2]);
  cam.lookAt(view[3], view[4], view[5]);
  window.__dbg = { G, R, world, THREE, groundHeight };
  R.renderer.info.autoReset = false;
  let last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    world.update(dt, t, cam.position);
    window.__info = { calls: R.renderer.info.render.calls, tris: R.renderer.info.render.triangles };
    R.renderer.info.reset();
    R.render();
    window.__frames = (window.__frames || 0) + 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__ready = true;
}
boot().catch((e) => { console.error(e); window.__error = String(e && e.stack || e); });
