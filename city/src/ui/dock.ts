// The bottom dock: a Look button and one button per tool category. A category opens a tray of
// tool cards; picking one collapses the tray into a small chip naming the tool in hand. While the
// player drags, a pill in the same spot shows what the drag would do and cost.
import { BUILDINGS, TOOL_CATEGORIES, buildingTypeOf, toolInfo } from '../core/defs';
import type { BuildingType, GameState, Plan, ToolId } from '../core/types';
import type { Ctx } from './ctx';
import { accent, btn, esc, h, setHTML, setText, toggleClass } from './dom';
import { count, isUnlocked, money } from './format';
import { categoryLook, icon, toolLook } from './icons';

export interface Dock {
  update(state: GameState): void;
  setPreview(plan: Plan | null): void;
  closeTray(): void;
  isTrayOpen(): boolean;
  /** True while a tool other than Look is in hand. */
  hasTool(): boolean;
  /** True while a drag preview is showing. */
  isPreviewing(): boolean;
  /** The highlighted dock category ('inspect' for Look). */
  activeCategory(): string;
  /** Top edge of the dock and whatever is stacked on it (chip, pill, tray), relative to the root. */
  stackTop(): number;
  /** A dock button by category id ('inspect' for Look), for tips to point at. */
  button(id: string): HTMLElement | null;
  /** Building types a milestone just unlocked: their category gets a dot until opened. */
  markNew(types: BuildingType[]): void;
  /** New city / loaded save: back to Look, tray closed, preview cleared. */
  reset(): void;
}

interface Category {
  id: string;
  label: string;
  tools: ToolId[];
}

/** One-line instruction for the tool in hand (mirrors the input gestures). */
function toolHint(tool: ToolId): string {
  switch (tool) {
    case 'road':
      return 'Drag to lay road';
    case 'zone_res':
      return 'Drag near a road to zone homes';
    case 'zone_com':
      return 'Drag near a road to zone shops';
    case 'zone_ind':
      return 'Drag near a road to zone industry';
    case 'bulldoze':
      return 'Drag over things to clear them';
    case 'inspect':
      return 'Tap anything to see how it is doing';
    default:
      return 'Drag to place it, lift to build';
  }
}

/** "$10/tile", "$4,000", or '' for tools whose cost depends on what they touch. */
function costLabel(tool: ToolId): { amount: string; unit: string } {
  const info = toolInfo(tool);
  if (!info || info.cost <= 0) return { amount: '', unit: '' };
  return { amount: money(info.cost), unit: info.perTile ? '/tile' : '' };
}

function footprint(tool: ToolId): string {
  const t = buildingTypeOf(tool);
  if (!t) return '';
  const s = BUILDINGS[t].size;
  return `${s}×${s}`;
}

export function createDock(ctx: Ctx): Dock {
  const cats: Category[] = [{ id: 'inspect', label: 'Look', tools: ['inspect'] }, ...TOOL_CATEGORIES];
  const catOf = (tool: ToolId): string => cats.find((c) => c.tools.includes(tool))?.id ?? 'inspect';

  let tool: ToolId = 'inspect';
  let openCat: string | null = null;
  let preview: Plan | null = null;
  const newTools = new Set<ToolId>();
  /** Tools to badge "New" in the tray that is open right now. */
  let badgeTools = new Set<ToolId>();

  // ---------- DOM ----------
  const wrap = h('div', 'dock-wrap');
  const dock = h('div', 'dock panel');
  const catBtns = new Map<string, HTMLButtonElement>();
  for (const c of cats) {
    const look = categoryLook(c.id);
    const b = btn('dock-btn', `<span class="dock-ic">${icon(look.icon)}</span><span class="dock-label">${esc(c.label)}</span><i class="dot"></i>`, c.label);
    accent(b, look.color);
    if (c.id === 'zones') b.classList.add('zones');
    b.addEventListener('click', () => {
      ctx.click();
      onCategory(c);
    });
    catBtns.set(c.id, b);
    dock.appendChild(b);
  }

  const undo = btn('undo-btn', `${icon('undo')}<span>Undo</span>`, 'Undo');
  undo.hidden = true;
  undo.addEventListener('click', () => {
    ctx.click();
    if (ctx.actions.canUndo()) ctx.actions.undo();
    ctx.invalidate();
  });

  // Tray: a horizontally scrolling row of tool cards above the dock.
  const tray = h('div', 'tray panel');
  tray.hidden = true;
  const trayScroll = h('div', 'tray-scroll');
  tray.appendChild(trayScroll);
  let cards: Array<{ tool: ToolId; el: HTMLButtonElement; cost: HTMLElement; lock: HTMLElement }> = [];

  // Chip: the tool in hand.
  const chip = h('div', 'chip panel');
  chip.hidden = true;
  const chipMain = btn('chip-main', '', 'Change tool');
  const chipTile = h('span', 'tile sm');
  const chipText = h('span', 'chip-text');
  const chipName = h('b');
  const chipCost = h('span', 'chip-cost num');
  const chipHint = h('small');
  const chipTop = h('span', 'chip-top');
  chipTop.append(chipName, chipCost);
  chipText.append(chipTop, chipHint);
  chipMain.append(chipTile, chipText);
  const chipX = btn('chip-x', icon('close'), 'Put the tool away');
  chip.append(chipMain, chipX);
  chipMain.addEventListener('click', () => {
    ctx.click();
    const c = cats.find((k) => k.id === catOf(tool));
    if (c && c.tools.length > 1) openTray(c);
  });
  chipX.addEventListener('click', () => {
    ctx.click();
    selectTool('inspect');
  });

  // Pill: what the current drag would do.
  const pill = h('div', 'pill');
  pill.hidden = true;
  pill.setAttribute('aria-live', 'polite');

  // The undo button hangs off the dock's right side without shifting the centred dock.
  const dockRow = h('div', 'dock-row');
  dockRow.append(dock, undo);
  wrap.append(pill, chip, tray, dockRow);
  ctx.root.appendChild(wrap);

  // Tapping anywhere outside the tray and dock (e.g. on the map) folds the tray away.
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!openCat) return;
      const t = e.target as Node | null;
      if (t && (tray.contains(t) || dock.contains(t) || chip.contains(t))) return;
      closeTray();
    },
    true,
  );

  // ---------- behaviour ----------
  function onCategory(c: Category): void {
    if (c.id === 'inspect') {
      selectTool('inspect');
      return;
    }
    if (c.tools.length === 1) {
      // Roads and Bulldoze hold one tool each: pick it straight away (tap again to put it down).
      selectTool(tool === c.tools[0] ? 'inspect' : c.tools[0]);
      return;
    }
    if (openCat === c.id) closeTray();
    else openTray(c);
  }

  function selectTool(t: ToolId): void {
    closeTray();
    if (t !== tool) {
      ctx.actions.setTool(t);
      tool = ctx.actions.getTool();
    }
    renderChip();
    renderActive();
  }

  function openTray(c: Category): void {
    openCat = c.id;
    badgeTools = new Set(c.tools.filter((t) => newTools.has(t)));
    for (const t of c.tools) newTools.delete(t);
    renderDots();
    trayScroll.innerHTML = '';
    cards = c.tools.map((t) => {
      const look = toolLook(t);
      const info = toolInfo(t);
      const el = btn('card', '', info.name);
      accent(el, look.color);
      const fp = footprint(t);
      const tile = h('span', 'tile card-ic', `${icon(look.icon)}${fp ? `<b class="card-size">${fp}</b>` : ''}<span class="card-lockic">${icon('lock')}</span>`);
      const name = h('span', 'card-name');
      name.textContent = info.name;
      const cost = h('span', 'card-cost num');
      const lock = h('span', 'card-lock');
      el.append(tile, name, cost, lock);
      if (badgeTools.has(t)) el.appendChild(h('span', 'card-new', 'New'));
      el.addEventListener('click', () => onCard(t, el));
      trayScroll.appendChild(el);
      return { tool: t, el, cost, lock };
    });
    trayScroll.scrollLeft = 0;
    tray.hidden = false;
    void tray.offsetWidth;
    tray.classList.add('is-open');
    updateCards(ctx.actions.getState());
    renderChip();
    renderActive();
    ctx.invalidate();
  }

  function closeTray(): void {
    if (!openCat) return;
    openCat = null;
    badgeTools.clear();
    tray.classList.remove('is-open');
    tray.hidden = true;
    renderChip();
    renderActive();
    ctx.invalidate();
  }

  function onCard(t: ToolId, el: HTMLElement): void {
    const state = ctx.actions.getState();
    if (!isUnlocked(state, toolInfo(t).unlockPop)) {
      ctx.click();
      // A little shake says "not yet"; the card already says when it unlocks.
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      return;
    }
    ctx.click();
    selectTool(t);
  }

  function updateCards(state: GameState): void {
    for (const c of cards) {
      const info = toolInfo(c.tool);
      const unlocked = isUnlocked(state, info.unlockPop);
      toggleClass(c.el, 'locked', !unlocked);
      toggleClass(c.el, 'on', c.tool === tool);
      if (unlocked) {
        const { amount, unit } = costLabel(c.tool);
        setHTML(c.cost, amount ? `${amount}${unit ? `<small>${unit}</small>` : ''}` : 'Free');
        // Red price when the treasury cannot pay for even one.
        toggleClass(c.cost, 'bad', info.cost > 0 && state.money < info.cost);
        setText(c.lock, '');
      } else {
        setHTML(c.cost, '');
        setText(c.lock, `Unlocks at ${count(info.unlockPop)} people`);
      }
    }
  }

  function renderActive(): void {
    const active = openCat ?? catOf(tool);
    for (const [id, b] of catBtns) {
      toggleClass(b, 'on', id === active);
      toggleClass(b, 'open', id === openCat);
    }
  }

  function renderDots(): void {
    for (const c of cats) {
      const b = catBtns.get(c.id);
      if (b) toggleClass(b, 'has-new', c.tools.some((t) => newTools.has(t)));
    }
  }

  function renderChip(): void {
    const show = tool !== 'inspect' && !openCat && !preview;
    if (tool !== 'inspect') {
      const look = toolLook(tool);
      accent(chip, look.color);
      setHTML(chipTile, icon(look.icon));
      setText(chipName, toolInfo(tool).name);
      const { amount, unit } = costLabel(tool);
      const fp = footprint(tool);
      setText(chipCost, [amount + unit, fp].filter(Boolean).join(' · '));
      setText(chipHint, toolHint(tool));
      const c = cats.find((k) => k.id === catOf(tool));
      toggleClass(chipMain, 'can-open', !!c && c.tools.length > 1);
    }
    if (chip.hidden === show) {
      chip.hidden = !show;
      if (show) {
        chip.classList.remove('pop');
        void chip.offsetWidth;
        chip.classList.add('pop');
      }
    }
  }

  function setPreview(plan: Plan | null): void {
    preview = plan;
    if (!plan) {
      if (!pill.hidden) pill.hidden = true;
      renderChip();
      return;
    }
    const look = toolLook(plan.tool);
    const info = toolInfo(plan.tool);
    let html: string;
    let bad = false;
    if (!plan.valid) {
      bad = true;
      const reason = plan.reason && plan.reason.trim() ? plan.reason : 'Nothing to change here';
      html = `${icon('warn')}<span>${esc(reason)}</span>`;
    } else {
      let n = 0;
      for (let k = 0; k < plan.ok.length; k++) if (plan.ok[k]) n++;
      const parts = [esc(info.name)];
      if (!plan.building) {
        const isZone = plan.tool.startsWith('zone_');
        parts.push(`${count(n)} ${isZone ? (n === 1 ? 'lot' : 'lots') : n === 1 ? 'tile' : 'tiles'}`);
      }
      parts.push(plan.cost > 0 ? `<b class="num">${money(plan.cost)}</b>` : '<b>Free</b>');
      html = `<span class="tile xs">${icon(look.icon)}</span><span>${parts.join('<i class="sep"></i>')}</span>`;
    }
    if (pill.dataset.c !== look.color) {
      // Restyle only when the tool changes, not on every pointer move.
      pill.dataset.c = look.color;
      accent(pill, look.color);
    }
    setHTML(pill, html);
    toggleClass(pill, 'bad', bad);
    if (pill.hidden) pill.hidden = false;
    renderChip();
  }

  function update(state: GameState): void {
    const t = ctx.actions.getTool();
    if (t !== tool) {
      // Something else changed the tool (main after a placement, a reset...): follow it.
      tool = t;
      renderChip();
      renderActive();
    }
    if (openCat) updateCards(state);
    const canUndo = ctx.actions.canUndo();
    if (undo.hidden === canUndo) undo.hidden = !canUndo;
  }

  function reset(): void {
    preview = null;
    pill.hidden = true;
    newTools.clear();
    renderDots();
    closeTray();
    tool = ctx.actions.getTool();
    renderChip();
    renderActive();
  }

  function markNew(types: BuildingType[]): void {
    for (const t of types) newTools.add(`build:${t}` as ToolId);
    renderDots();
  }

  renderActive();

  return {
    update,
    setPreview,
    closeTray,
    isTrayOpen: () => openCat !== null,
    hasTool: () => tool !== 'inspect',
    isPreviewing: () => preview !== null,
    activeCategory: () => openCat ?? catOf(tool),
    stackTop: () => wrap.getBoundingClientRect().top - ctx.root.getBoundingClientRect().top,
    button: (id) => catBtns.get(id) ?? null,
    markNew,
    reset,
  };
}
