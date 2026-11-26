// Shared bits for the people indoors and out: dressing someone for their job, paying for things,
// and the useful things people tell you (a rumour about a Lost Weight, a tip about a job).
import { G, emit } from '../state.js';
import { PED_LOOKS } from '../entities/pedlooks.js';
import { addTokens, writeSave } from '../save.js';
import { formatTokens } from '../util/math.js';
import { pick } from '../util/rng.js';

// A crowd look (by seed) with some of its clothes swapped for a uniform.
export function look(seed, over = {}) {
  const L = { ...PED_LOOKS[seed % PED_LOOKS.length], ...over };
  delete L._kit;
  return L;
}

export const price = (n) => `${formatTokens(n)} ◈`;
// Take payment; false (with a word from the till) if the player cannot cover it.
export function pay(n) {
  if (G.save.tokens < n) { emit('sfx', 'uiError'); return false; }
  addTokens(-n);
  emit('sfx', 'token');
  writeSave();
  return true;
}
export function heal(n) {
  const pl = G.player;
  const before = pl.health;
  pl.health = Math.min(pl.maxHealth, pl.health + n);
  const got = Math.round(pl.health - before);
  if (got > 0) G.hud.toast(`+${got} health`, '#8fd66a');
}

// Where the nearest Lost Weight still out there is, as a waypoint. Returns a line about it.
export function weightRumour() {
  const M = G.missions, p = G.player.worldPos;
  const left = M.weights.filter((w) => !w.got);
  if (!left.length) return null;
  left.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  const w = left[Math.min(left.length - 1, Math.floor(Math.random() * Math.min(3, left.length)))];
  emit('waypoint', { x: w.x, z: w.z });
  return `${G.hud.placeName(w.x, w.z)}. I marked it on your map.`;
}
// A job you could start now, as a waypoint. Returns its title, or null.
export function jobTip() {
  const M = G.missions;
  const open = M.markers.filter((m) => m.job && !M.done(m.job.id) && (!m.show || m.show()));
  const any = open.length ? open : M.markers.filter((m) => m.job && (!m.show || m.show()));
  if (!any.length) return null;
  const m = pick(any);
  emit('waypoint', { x: m.x, z: m.z });
  return m.job.title;
}
// A place (one of the interiors' doors) as a waypoint.
export function pointTo(x, z) { emit('waypoint', { x, z }); }
