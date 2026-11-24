// The inspect card on the right: what a tapped tile is, how it is doing, and what to do about problems.
import { ZONE_COLORS } from '../core/defs';
import type { GameState, TileInfo } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';
import type { Ctx } from './ctx';
import { accent, btn, esc, h, setHTML, toggleClass } from './dom';
import { buildingLook, icon, type Look } from './icons';

export interface Inspect {
  show(info: TileInfo | null): void;
  isOpen(): boolean;
}

/** Pick an icon and colour for the header from what is on the tile. */
function lookOf(state: GameState | null, info: TileInfo): Look {
  if (state && info.buildingId !== undefined) {
    const b = state.buildings[info.buildingId];
    if (b) return buildingLook(b.type);
  }
  if (!state || info.x < 0 || info.z < 0 || info.x >= state.size || info.z >= state.size) return { icon: 'look', color: '#18a999' };
  const i = info.z * state.size + info.x;
  const T = state.tiles;
  switch (T.kind[i]) {
    case TileKind.Road:
      return { icon: 'road', color: '#687789' };
    case TileKind.Zone:
      if (T.zone[i] === ZoneType.Res) return { icon: 'house', color: ZONE_COLORS.res };
      if (T.zone[i] === ZoneType.Com) return { icon: 'shop', color: ZONE_COLORS.com };
      return { icon: 'factory', color: ZONE_COLORS.ind };
    case TileKind.Building: {
      const b = state.buildings[T.bld[i]];
      if (b) return buildingLook(b.type);
      break;
    }
  }
  if (T.terrain[i] === Terrain.Water) return { icon: 'drop', color: '#36a3ff' };
  if (T.trees[i]) return { icon: 'tree', color: '#4caf3c' };
  return { icon: 'map', color: '#8fae5a' };
}

export function createInspect(ctx: Ctx): Inspect {
  const card = h('div', 'inspect panel');
  card.hidden = true;
  const head = h('div', 'in-head');
  // The icon doubles as a "centre the map here" button, handy after panning away.
  const tile = btn('tile sm in-locate', '', 'Centre the map here');
  const titles = h('div', 'in-titles');
  const title = h('h3');
  const sub = h('p');
  titles.append(title, sub);
  const close = btn('round xs', icon('close'), 'Close');
  head.append(tile, titles, close);
  const body = h('div', 'in-body');
  card.append(head, body);
  ctx.root.appendChild(card);

  let current: TileInfo | null = null;
  let lastKey = '';

  // A soft fade at the bottom says "there is more below" when the card has to scroll.
  const updateFade = () => toggleClass(body, 'more', body.scrollHeight - body.scrollTop - body.clientHeight > 4);
  body.addEventListener('scroll', updateFade, { passive: true });

  tile.addEventListener('click', () => {
    ctx.click();
    if (current) ctx.actions.focusTile(current.x, current.z);
  });
  close.addEventListener('click', () => {
    ctx.click();
    show(null);
    ctx.actions.inspectClosed?.();
  });

  function show(info: TileInfo | null): void {
    if (!info) {
      current = null;
      lastKey = '';
      if (!card.hidden) {
        card.classList.remove('is-open');
        card.hidden = true;
      }
      return;
    }
    const sameTile = current !== null && current.x === info.x && current.z === info.z;
    current = info;
    let state: GameState | null = null;
    try {
      state = ctx.actions.getState();
    } catch {
      state = null;
    }
    const look = lookOf(state, info);
    accent(card, look.color);
    setHTML(tile, icon(look.icon));
    title.textContent = info.title || 'Here';
    sub.textContent = info.subtitle ?? '';
    sub.hidden = !info.subtitle;

    let html = '';
    if (info.problems.length) {
      html += '<ul class="in-problems">';
      for (const p of info.problems) {
        // Problems read "What: what to do". Bold the first part so the eye finds it.
        const k = p.indexOf(':');
        const text = k > 0 && k < 40 ? `<b>${esc(p.slice(0, k))}</b>${esc(p.slice(k))}` : esc(p);
        html += `<li>${icon('warn')}<span>${text}</span></li>`;
      }
      html += '</ul>';
    }
    if (info.rows.length) {
      // Two columns of small stat cells; long values get a full-width cell.
      html += '<dl class="in-grid">';
      for (const r of info.rows) {
        const wide = r.value.length > 14 || r.label.length > 16 ? ' wide' : '';
        html += `<div class="in-cell tone-${r.tone ?? 'neutral'}${wide}"><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`;
      }
      html += '</dl>';
    }
    if (!info.problems.length && !info.rows.length) html = '<p class="in-empty">Nothing to report here.</p>';
    const key = html + '|' + info.title;
    if (key !== lastKey) {
      lastKey = key;
      const keep = sameTile ? body.scrollTop : 0;
      body.innerHTML = html;
      body.scrollTop = keep;
    }
    if (card.hidden) {
      card.hidden = false;
      void card.offsetWidth;
      card.classList.add('is-open');
      updateFade();
    } else if (!sameTile) {
      // A different tile: give a little bump so the change is noticed.
      card.classList.remove('bump');
      void card.offsetWidth;
      card.classList.add('bump');
    }
    updateFade();
  }

  return { show, isOpen: () => current !== null };
}
