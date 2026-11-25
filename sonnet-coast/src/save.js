// Save data in localStorage (wrapped: private windows and file:// can refuse storage).
import { G } from './state.js';

const KEY = 'sonnet-coast-save-v1';
export const defaultSave = () => ({
  version: 1,
  tokens: 500,
  outfit: null,
  missions: {},       // id -> times completed
  best: {},           // race id -> best time
  weights: [],        // collected Lost Weight ids
  stunts: [],         // stunt ramps landed
  stats: { jacked: 0, distance: 0, busted: 0, flatlined: 0, evaded: 0, earned: 0, contracts: 0, maxStars: 0 },
  ammo: { reserve: 60, emps: 3 },
  armor: 0,
  settings: null,
  started: false,
});

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const d = JSON.parse(raw);
    const base = defaultSave();
    return { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) }, ammo: { ...base.ammo, ...(d.ammo || {}) } };
  } catch (e) { return defaultSave(); }
}
export function writeSave() {
  try {
    const s = G.save;
    s.settings = { ...G.settings };
    if (G.player) { s.outfit = { ...G.player.outfit }; s.armor = Math.round(G.player.armor); }
    if (G.weapons) s.ammo = { reserve: G.weapons.reserve + G.weapons.clip, emps: G.weapons.emps };
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch (e) { return false; }
}
export function hasSave() {
  try { const raw = localStorage.getItem(KEY); return !!raw && JSON.parse(raw).started; } catch (e) { return false; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

export function addTokens(n, reason = '') {
  G.save.tokens = Math.max(0, Math.round(G.save.tokens + n));
  if (n > 0) G.save.stats.earned += n;
  if (G.hud) G.hud.tokenPop(n, reason);
}
