// Top-left city stats (money, people, date, happiness, demand) and top-right controls
// (speed, map layers, budget, menu).
import { ZONE_COLORS } from '../core/defs';
import type { GameState, Speed } from '../core/types';
import type { Ctx } from './ctx';
import { btn, h, setHTML, setStyle, setText, toggleClass } from './dom';
import { count, dateLabel, money, nextMilestone, signedMoney } from './format';
import { icon } from './icons';

export interface Hud {
  update(state: GameState): void;
  readonly layersBtn: HTMLButtonElement;
  readonly budgetBtn: HTMLButtonElement;
  readonly menuBtn: HTMLButtonElement;
}

export interface HudHooks {
  openBudget(): void;
  toggleLayers(): void;
  openMenu(): void;
}

const SPEEDS: Array<[Speed, string, string]> = [
  [0, 'pause', 'Pause'],
  [1, 'speed1', 'Normal speed'],
  [2, 'speed2', 'Fast'],
  [3, 'speed3', 'Fastest'],
];

export function createHud(ctx: Ctx, hooks: HudHooks): Hud {
  // ---------- left: city stats ----------
  const stats = h('div', 'hud panel');

  const moneyCell = btn('hud-cell hud-money', '', 'Money. Opens the budget');
  const moneyBig = h('span', 'hud-big num');
  const moneyNet = h('span', 'hud-sub num');
  moneyCell.append(moneyBig, moneyNet);
  moneyCell.addEventListener('click', () => {
    ctx.click();
    hooks.openBudget();
  });

  const popCell = h('div', 'hud-cell hud-pop');
  const popLine = h('span', 'hud-line', icon('people', 'hud-ic'));
  const popBig = h('span', 'hud-big num');
  popLine.appendChild(popBig);
  const progLine = h('span', 'hud-line hud-prog');
  const bar = h('span', 'bar');
  const barFill = h('i');
  bar.appendChild(barFill);
  const progLabel = h('span', 'hud-sub');
  progLine.append(bar, progLabel);
  popCell.append(popLine, progLine);

  const whenCell = h('div', 'hud-cell hud-when');
  const dateEl = h('span', 'hud-mid');
  const happyLine = h('span', 'hud-line hud-happy');
  const face = h('span', 'face');
  const happyPct = h('span', 'hud-mid num');
  happyLine.append(face, happyPct);
  whenCell.append(dateEl, happyLine);

  const rciCell = btn('hud-cell hud-rci', '', 'Demand for homes, shops and industry. Opens the budget');
  const rciFills: HTMLElement[] = [];
  const rciBars = h('span', 'rci-bars');
  const rciLetters = h('span', 'rci-letters');
  for (const [key, letter] of [
    ['res', 'H'],
    ['com', 'S'],
    ['ind', 'I'],
  ] as const) {
    const col = h('span', 'rci-bar');
    col.style.setProperty('--c', ZONE_COLORS[key]);
    const fill = h('i');
    col.appendChild(fill);
    rciBars.appendChild(col);
    rciFills.push(fill);
    const l = h('b');
    l.textContent = letter;
    l.style.color = ZONE_COLORS[key];
    rciLetters.appendChild(l);
  }
  rciCell.append(rciBars, rciLetters);
  rciCell.addEventListener('click', () => {
    ctx.click();
    hooks.openBudget();
  });

  const div = () => h('i', 'hud-div');
  stats.append(moneyCell, div(), popCell, div(), whenCell, div(), rciCell);

  // ---------- right: controls ----------
  const right = h('div', 'hud-right');
  const speed = h('div', 'speed panel');
  speed.setAttribute('role', 'radiogroup');
  const speedBtns = SPEEDS.map(([s, ic, label]) => {
    const b = btn('speed-btn', icon(ic), label);
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => {
      ctx.click();
      ctx.actions.setSpeed(s);
      ctx.invalidate();
    });
    speed.appendChild(b);
    return b;
  });
  const tools = h('div', 'tools panel');
  const layersBtn = btn('tool-btn', icon('layers'), 'Map layers');
  const budgetBtn = btn('tool-btn', icon('coins'), 'Budget');
  const menuBtn = btn('tool-btn', icon('menu'), 'Menu');
  tools.append(layersBtn, budgetBtn, menuBtn);
  layersBtn.addEventListener('click', () => {
    ctx.click();
    hooks.toggleLayers();
  });
  budgetBtn.addEventListener('click', () => {
    ctx.click();
    hooks.openBudget();
  });
  menuBtn.addEventListener('click', () => {
    ctx.click();
    hooks.openMenu();
  });
  right.append(speed, tools);

  ctx.root.append(stats, right);

  let lastFace = '';
  let fitLevel = 0;
  let fitKey = '';

  /**
   * Long numbers (a $1.2M treasury, "Small City", Year 12) could push the stats under the speed
   * buttons. When the text changes, step through tighter layouts until the two clusters clear.
   */
  function fit(): void {
    const key = `${moneyBig.textContent}|${moneyNet.textContent}|${popBig.textContent}|${progLabel.textContent}|${dateEl.textContent}`;
    if (key === fitKey) return;
    // Not laid out (hidden, or not attached yet): try again on a later update.
    if (!right.offsetWidth) return;
    fitKey = key;
    const limit = () => right.getBoundingClientRect().left - 8;
    for (let level = 0; level <= 2; level++) {
      if (level !== fitLevel) {
        stats.classList.toggle('fit1', level >= 1);
        stats.classList.toggle('fit2', level >= 2);
        fitLevel = level;
      }
      if (stats.getBoundingClientRect().right <= limit()) break;
    }
  }

  function update(state: GameState): void {
    const s = state.stats;

    // Money and last month's net (or this month's projection before the first month ends).
    setText(moneyBig, money(state.money));
    const last = state.history[state.history.length - 1];
    const net = last ? last.income - last.expenses : s.income.total - s.expenses.total;
    setText(moneyNet, `${signedMoney(net)}/mo`);
    toggleClass(moneyNet, 'bad', net < 0);
    toggleClass(moneyNet, 'good', net > 0);
    toggleClass(moneyBig, 'bad', state.money < 0);

    // Population and progress to the next milestone.
    setText(popBig, count(s.population));
    const next = nextMilestone(state);
    if (next) {
      const p = (s.population - next.from) / Math.max(1, next.population - next.from);
      setStyle(barFill, 'width', `${Math.round(Math.max(0.04, Math.min(1, p)) * 100)}%`);
      setText(progLabel, next.name);
      progLine.title = `${next.name} at ${count(next.population)} people`;
      toggleClass(progLine, 'max', false);
    } else {
      setStyle(barFill, 'width', '100%');
      setText(progLabel, 'Top city!');
      toggleClass(progLine, 'max', true);
    }

    // Date and happiness.
    setText(dateEl, dateLabel(state.day));
    const happy = Math.round(Math.max(0, Math.min(100, s.happiness)));
    setText(happyPct, `${happy}%`);
    const mood = happy >= 60 ? 'faceHappy' : happy >= 40 ? 'faceOk' : 'faceSad';
    if (mood !== lastFace) {
      lastFace = mood;
      setHTML(face, icon(mood, 'hud-ic'));
      happyLine.dataset.mood = mood;
    }

    // Demand bars: positive grows up from the middle line, negative grows down.
    const d = [s.demand.res, s.demand.com, s.demand.ind];
    for (let k = 0; k < 3; k++) {
      const v = Math.max(-1, Math.min(1, d[k] || 0));
      const fill = rciFills[k];
      setStyle(fill, 'height', `${Math.round(Math.abs(v) * 50)}%`);
      toggleClass(fill, 'neg', v < 0);
    }

    fit();

    // Speed buttons.
    for (let k = 0; k < SPEEDS.length; k++) {
      const on = SPEEDS[k][0] === state.speed;
      toggleClass(speedBtns[k], 'on', on);
      speedBtns[k].setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  return { update, layersBtn, budgetBtn, menuBtn };
}
