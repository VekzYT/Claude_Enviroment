// First-time tips: one at a time, driven by what the city has (or lacks), pointing at the dock
// button that helps. A tip is remembered in settings.seenTips once dismissed or once the player
// has done what it suggests, so it never nags twice.
import { BUILDINGS } from '../core/defs';
import type { GameState } from '../core/types';
import { TileKind, ZoneType } from '../core/types';
import type { Ctx } from './ctx';
import { btn, h, relRect, setHTML, toggleClass } from './dom';
import { icon } from './icons';

interface Facts {
  roads: number;
  zones: number;
  resZones: number;
  comZones: number;
  indZones: number;
  poweredHomes: number;
  powerPlants: number;
  waterBuildings: number;
  safety: number;
}

interface TipDef {
  id: string;
  text: string;
  /** Dock category id ('inspect' for Look) or 'budget' for the top-right budget button. */
  target: string;
  when(f: Facts, s: GameState): boolean;
  /** Advice that cannot be "done": it retires itself after being shown this long (s). */
  shownFor?: number;
}

const TIPS: TipDef[] = [
  { id: 'roads', target: 'roads', text: 'Tap <b>Roads</b>, then drag on the map to lay your first street.', when: (f) => f.roads === 0 },
  {
    id: 'zones',
    target: 'zones',
    text: 'Now tap <b>Zones</b>, pick <b>Homes</b> and drag beside your road. Houses grow there.',
    when: (f) => f.roads > 0 && f.zones === 0,
  },
  {
    id: 'power',
    target: 'utilities',
    text: 'Homes need power. Put a <b>Coal Power Plant</b> from <b>Utilities</b> near your zones.',
    when: (f) => f.zones > 0 && f.powerPlants === 0,
  },
  {
    id: 'water',
    target: 'utilities',
    text: 'The lights are on! A <b>Water Tower</b> from <b>Utilities</b> lets buildings grow bigger.',
    when: (f) => f.poweredHomes > 0 && f.waterBuildings === 0,
  },
  {
    id: 'shops',
    target: 'zones',
    text: 'People want somewhere to shop. Zone some <b>Shops</b> (blue) near the homes.',
    when: (f, s) => s.stats.population >= 30 && s.stats.demand.com > 0.25 && f.comZones === 0,
  },
  {
    id: 'industry',
    target: 'zones',
    text: 'Residents need jobs. Zone some <b>Industry</b> (yellow), a little away from homes.',
    when: (f, s) => s.stats.population >= 60 && s.stats.demand.ind > 0.25 && f.indZones === 0,
  },
  {
    id: 'look',
    target: 'inspect',
    text: 'Tap <b>Look</b>, then tap any building to see what it needs to grow.',
    when: (f) => f.poweredHomes >= 6,
    shownFor: 12,
  },
  {
    id: 'jobs',
    target: 'zones',
    text: 'Lots of people are out of work. Zone more <b>Shops</b> or <b>Industry</b>.',
    when: (_f, s) => s.stats.population >= 200 && s.stats.unemployment > 0.2,
    shownFor: 12,
  },
  {
    id: 'services',
    target: 'services',
    text: '<b>Police</b> and <b>Fire Stations</b> are open. Services near homes make people happier.',
    when: (f, s) => s.milestone >= 1 && f.safety === 0,
  },
  {
    id: 'money',
    target: 'budget',
    text: 'Money is running low. Open the <b>Budget</b> to check taxes and upkeep.',
    when: (_f, s) => s.money < 2000 && s.stats.income.total - s.stats.expenses.total < 0,
    shownFor: 12,
  },
];

/** Seconds a tip's condition must hold before it shows (so it never flashes up mid-action). */
const SETTLE = 1.4;

export interface Tips {
  update(state: GameState, dt: number): void;
  /** Forget the per-city state (new city / load). */
  reset(): void;
}

export interface TipTargets {
  dockButton(id: string): HTMLElement | null;
  budgetButton: HTMLElement;
  /** Left and right limits for the bubble (inside the safe area). */
  bounds(): { left: number; right: number };
  /** Top of the dock stack (dock plus chip/pill), relative to the root: bubbles sit above it. */
  dockTop(): number;
  /** True while something else needs the space or attention, or the player is already doing what a tip about `target` says. */
  blocked(target: string): boolean;
}

function scan(state: GameState): Facts {
  const T = state.tiles;
  const n = state.size * state.size;
  const f: Facts = { roads: 0, zones: 0, resZones: 0, comZones: 0, indZones: 0, poweredHomes: 0, powerPlants: 0, waterBuildings: 0, safety: 0 };
  for (let i = 0; i < n; i++) {
    const k = T.kind[i];
    if (k === TileKind.Road) f.roads++;
    else if (k === TileKind.Zone) {
      f.zones++;
      const z = T.zone[i];
      if (z === ZoneType.Res) {
        f.resZones++;
        if (T.level[i] >= 1 && T.power[i]) f.poweredHomes++;
      } else if (z === ZoneType.Com) f.comZones++;
      else if (z === ZoneType.Ind) f.indZones++;
    }
  }
  for (const b of state.buildings) {
    if (!b) continue;
    const def = BUILDINGS[b.type];
    if (!def) continue;
    if (def.power) f.powerPlants++;
    if (def.water) f.waterBuildings++;
    if (b.type === 'police' || b.type === 'fire') f.safety++;
  }
  return f;
}

export function createTips(ctx: Ctx, targets: TipTargets): Tips {
  const el = h('div', 'tip panel');
  el.hidden = true;
  el.setAttribute('role', 'status');
  const tile = h('span', 'tile xs', icon('bulb'));
  const text = h('p');
  const ok = btn('pbtn sm', 'Got it');
  const arrow = h('i', 'tip-arrow');
  el.append(tile, text, ok, arrow);
  ctx.root.appendChild(el);

  let facts: Facts | null = null;
  let factsRev = '';
  let scanWait = 0;
  let candidate: TipDef | null = null;
  let held = 0;
  let current: TipDef | null = null;
  let shown = 0;
  let pointed: HTMLElement | null = null;
  /** Seen this session, so we never rely on settings round-tripping instantly. */
  const seen = new Set<string>();
  let seenCount = -1;
  /** Tips that have been on screen; one that steps aside for the player still retires when done. */
  const shownOnce = new Set<string>();

  ok.addEventListener('click', () => {
    ctx.click();
    if (current) markSeen(current.id);
    hide();
  });

  function markSeen(id: string): void {
    if (seen.has(id)) return;
    seen.add(id);
    try {
      const s = ctx.actions.getSettings();
      if (!s.seenTips.includes(id)) ctx.actions.setSettings({ ...s, seenTips: [...s.seenTips, id] });
    } catch {
      /* settings unavailable: the session set still stops repeats */
    }
  }

  function isSeen(id: string, seenTips: string[]): boolean {
    return seen.has(id) || seenTips.includes(id);
  }

  function hide(): void {
    current = null;
    shown = 0;
    if (pointed) pointed.classList.remove('tip-target');
    pointed = null;
    if (!el.hidden) {
      el.classList.remove('is-open');
      el.hidden = true;
    }
  }

  function targetOf(t: TipDef): HTMLElement | null {
    return t.target === 'budget' ? targets.budgetButton : targets.dockButton(t.target);
  }

  function place(t: TipDef): void {
    const target = targetOf(t);
    if (!target) return;
    const root = ctx.root;
    const r = relRect(target, root);
    const { left, right } = targets.bounds();
    const w = el.offsetWidth || 300;
    const cx = r.x + r.w / 2;
    const x = Math.max(left, Math.min(right - w, cx - w / 2));
    el.style.left = `${Math.round(x)}px`;
    el.style.setProperty('--ax', `${Math.round(cx - x)}px`);
    const below = t.target === 'budget';
    toggleClass(el, 'below', below);
    if (below) {
      el.style.top = `${Math.round(r.y + r.h + 12)}px`;
      el.style.bottom = '';
    } else {
      el.style.top = '';
      el.style.bottom = `${Math.round(root.clientHeight - Math.min(r.y, targets.dockTop()) + 12)}px`;
    }
    if (pointed !== target) {
      if (pointed) pointed.classList.remove('tip-target');
      pointed = target;
      target.classList.add('tip-target');
    }
  }

  function show(t: TipDef): void {
    current = t;
    shown = 0;
    shownOnce.add(t.id);
    setHTML(text, t.text);
    el.hidden = false;
    place(t);
    void el.offsetWidth;
    el.classList.add('is-open');
  }

  function update(state: GameState, dt: number): void {
    let settings;
    try {
      settings = ctx.actions.getSettings();
    } catch {
      return;
    }
    if (!settings.tips) {
      if (current) hide();
      candidate = null;
      return;
    }
    // The player turned tips back on (which clears seenTips): forget this session's memory too.
    const n = settings.seenTips.length;
    if (n < seenCount) seen.clear();
    seenCount = n;

    // Re-scan the map only when it changed, and not more than twice a second.
    scanWait -= dt;
    const rev = `${state.rev.tiles}|${state.rev.buildings}|${state.rev.derived}`;
    if (!facts || (rev !== factsRev && scanWait <= 0)) {
      facts = scan(state);
      factsRev = rev;
      scanWait = 0.5;
    }

    // The tip on screen: retire it once done, hide it while blocked.
    if (current) {
      if (!current.when(facts, state)) {
        markSeen(current.id);
        hide();
      } else if (targets.blocked(current.target)) {
        // Out of the way for now; it comes back when the coast is clear.
        candidate = current;
        held = SETTLE;
        hide();
        return;
      } else {
        shown += dt;
        if (current.shownFor && shown >= current.shownFor) {
          markSeen(current.id);
          hide();
        } else {
          place(current);
        }
        return;
      }
    }

    // Choose the first unseen tip whose condition holds. A tip that was shown and then stepped
    // aside while the player followed it is retired once its condition is met.
    let next: TipDef | null = null;
    for (const t of TIPS) {
      if (isSeen(t.id, settings.seenTips)) continue;
      if (t.when(facts, state)) {
        if (!next) next = t;
      } else if (shownOnce.has(t.id)) {
        markSeen(t.id);
      }
    }
    if (next !== candidate) {
      candidate = next;
      held = 0;
    } else if (candidate) {
      held += dt;
    }
    if (candidate && held >= SETTLE && !targets.blocked(candidate.target)) show(candidate);
  }

  return {
    update,
    reset() {
      hide();
      facts = null;
      factsRev = '';
      candidate = null;
      held = 0;
    },
  };
}
