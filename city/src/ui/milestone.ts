// The milestone celebration: a card with the new title, the reward, what it unlocked, and a shower
// of little CSS cubes.
import { BUILDINGS, ZONE_COLORS } from '../core/defs';
import type { BuildingType } from '../core/types';
import { Sheet, type Ctx } from './ctx';
import { accent, btn, esc, h } from './dom';
import { groupDigits, money } from './format';
import { buildingLook, icon } from './icons';
import { MILESTONES } from '../core/config';

export interface MilestoneEvent {
  index: number;
  name: string;
  reward: number;
  unlocked: BuildingType[];
}

export interface Celebration {
  show(e: MilestoneEvent): void;
  readonly sheet: Sheet;
  clear(): void;
}

const CONFETTI_COLORS = [ZONE_COLORS.res, ZONE_COLORS.com, ZONE_COLORS.ind, '#ff7a3d', '#ff5a7a', '#9b6bff', '#18a999'];
const CONFETTI = 34;

export function createCelebration(ctx: Ctx): Celebration {
  const sheet = new Sheet(ctx, { cls: 'celebrate', modal: true, backdropCloses: true, layer: 'celebrate' });
  const confetti = h('div', 'confetti');
  sheet.wrap.insertBefore(confetti, sheet.card);
  const queue: MilestoneEvent[] = [];

  const badge = h('div', 'cel-badge', `<span class="rays"></span><span class="star">${icon('star')}</span>`);
  const title = h('h2', 'cel-title');
  const line = h('p', 'cel-line');
  const reward = h('div', 'cel-reward');
  const unlockTitle = h('h4', 'cel-sub', 'Now you can build');
  const unlocks = h('div', 'cel-unlocks');
  const ok = btn('pbtn big primary', '<span>Keep building!</span>');
  sheet.card.append(badge, title, line, reward, unlockTitle, unlocks, ok);
  ok.addEventListener('click', () => {
    ctx.click();
    sheet.close();
  });
  sheet.onClose = () => {
    // Show the next one if several milestones were passed at once (e.g. a big loaded city).
    if (queue.length) window.setTimeout(next, 280);
    else window.setTimeout(() => (confetti.innerHTML = ''), 260);
  };

  function burst(): void {
    let html = '';
    for (let k = 0; k < CONFETTI; k++) {
      const c = CONFETTI_COLORS[k % CONFETTI_COLORS.length];
      const left = Math.random() * 100;
      const size = 7 + Math.random() * 7;
      const delay = Math.random() * 0.5;
      const dur = 1.6 + Math.random() * 1.3;
      const drift = (Math.random() - 0.5) * 120;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 480);
      html +=
        `<i style="left:${left.toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;background:${c};` +
        `animation-delay:${delay.toFixed(2)}s;animation-duration:${dur.toFixed(2)}s;--dx:${drift.toFixed(0)}px;--spin:${spin.toFixed(0)}deg"></i>`;
    }
    confetti.innerHTML = html;
  }

  function next(): void {
    const e = queue.shift();
    if (!e) return;
    title.textContent = `${e.name}!`;
    const m = MILESTONES[e.index];
    line.textContent = m ? `Your city reached ${groupDigits(m.population)} people.` : 'Your city keeps growing.';
    reward.innerHTML = e.reward > 0 ? `${icon('coin')}<span>Reward <b class="num">+${money(e.reward)}</b></span>` : '';
    reward.hidden = e.reward <= 0;
    unlocks.innerHTML = '';
    for (const t of e.unlocked) {
      const def = BUILDINGS[t];
      if (!def) continue;
      const look = buildingLook(t);
      const item = h('div', 'cel-item', `<span class="tile">${icon(look.icon)}</span><span>${esc(def.name)}</span>`);
      accent(item, look.color);
      unlocks.appendChild(item);
    }
    unlockTitle.hidden = unlocks.childElementCount === 0;
    unlocks.hidden = unlocks.childElementCount === 0;
    burst();
    sheet.open();
  }

  return {
    sheet,
    show(e) {
      queue.push(e);
      if (!sheet.isOpen) next();
    },
    clear() {
      queue.length = 0;
      confetti.innerHTML = '';
      sheet.closeNow();
    },
  };
}
