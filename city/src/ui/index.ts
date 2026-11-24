// OWNER: ui agent. The HTML interface drawn over the 3D canvas. Keep these signatures.
//
// Pieces (each in its own file): hud.ts (top bar), dock.ts (toolbar, tray, tool chip, drag pill,
// undo), inspect.ts (right card), layers.ts (overlay picker + legend), budget.ts, settings.ts,
// milestone.ts, title.ts (title + new city), tips.ts, toasts.ts. Styles live in ui.css.
import { on } from '../core/events';
import type { GameState, OverlayKind, Plan, Settings, Speed, TileInfo, ToolId } from '../core/types';
import { createBudget } from './budget';
import { type Ctx, type Sheet } from './ctx';
import { createDock } from './dock';
import { toggleClass } from './dom';
import { createHud } from './hud';
import { createInspect } from './inspect';
import { createLayers } from './layers';
import { createCelebration } from './milestone';
import { createSettings } from './settings';
import { createScreens } from './title';
import { createTips } from './tips';
import { createToasts } from './toasts';

/** Everything the UI can ask the game to do. main.ts implements this. */
export interface UIActions {
  getState(): GameState;
  setTool(tool: ToolId): void;
  getTool(): ToolId;
  setSpeed(speed: Speed): void;
  setOverlay(overlay: OverlayKind): void;
  getOverlay(): OverlayKind;
  setTax(zone: 'res' | 'com' | 'ind', percent: number): void;
  undo(): void;
  canUndo(): boolean;
  /** Generate a map for the new-city screen preview without starting it. */
  previewMap(seed: number): GameState;
  /** Start playing on the map with this seed. */
  startNewCity(seed: number, name: string): void;
  /** Resume the saved city. Resolves false if there is none or it failed to load. */
  continueCity(): Promise<boolean>;
  hasSave(): Promise<boolean>;
  saveNow(): Promise<void>;
  /** A text code holding the whole city, for backup. */
  exportSave(): string;
  /** Load a code made by exportSave. Resolves false (and the UI shows an error) if it is invalid. */
  importSave(code: string): Promise<boolean>;
  getSettings(): Settings;
  setSettings(settings: Settings): void;
  /** Centre the camera on a tile. */
  focusTile(x: number, z: number): void;
  /** Let the UI make sounds/haptics for its own buttons. */
  click(): void;
  /** Optional: the player closed the inspect card with its × (main may clear the tile highlight). */
  inspectClosed?(): void;
}

export interface UI {
  /** Called every frame. The UI throttles its own DOM writes. */
  update(state: GameState, dt: number): void;
  /** Cost bubble / reason while dragging a tool (null clears it). */
  setPreview(plan: Plan | null): void;
  /** Open the inspect panel for a tile, or close it with null. */
  showInspect(info: TileInfo | null): void;
  /** Show the title screen (Continue / New City). */
  showTitle(): void;
  /** True while a full-screen menu or the title is open (main pauses input to the world). */
  isModalOpen(): boolean;
  /** True while the inspect card is showing. */
  isInspectOpen(): boolean;
  /**
   * Fresh numbers for the inspect card that is already open on the same tile (main calls this a
   * couple of times a second). Unlike showInspect it never opens the card or closes other panels.
   */
  refreshInspect(info: TileInfo): void;
  /**
   * Escape / back: close the topmost thing (milestone card, a sheet, the new-city screen, the layer
   * picker, the tool tray, the inspect card). Returns false if nothing was open to close.
   */
  back(): boolean;
}

/** DOM writes happen at most this often (values that did not change are not written at all). */
const UPDATE_INTERVAL = 1 / 8;
/** A sim toast that arrives this soon after a milestone and names it is shown by the card instead. */
const MILESTONE_TOAST_WINDOW_MS = 600;

export function createUI(root: HTMLElement, actions: UIActions): UI {
  root.classList.add('cubo-ui');
  // iOS only applies :active styles (our press feedback) when a touch listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true });

  const sheets = new Set<Sheet>();
  let force = true;
  let chromeQueued = false;
  const toasts = createToasts(root);

  const ctx: Ctx = {
    root,
    actions,
    sheets,
    click() {
      try {
        actions.click();
      } catch {
        /* sound is a nicety */
      }
    },
    toast: (text, tone) => toasts.push(text, tone),
    invalidate() {
      force = true;
      if (!chromeQueued) {
        chromeQueued = true;
        Promise.resolve().then(() => {
          chromeQueued = false;
          syncChrome();
        });
      }
    },
  };

  // Order matters only for tab order; stacking is set in CSS.
  const hud = createHud(ctx, {
    openBudget: () => openSheet(() => budget.open()),
    toggleLayers: () => {
      dock.closeTray();
      layers.toggle();
    },
    openMenu: () => openSheet(() => settings.open()),
  });
  const dock = createDock(ctx);
  const inspect = createInspect(ctx);
  let inspectX = -1;
  let inspectZ = -1;
  const layers = createLayers(ctx, hud.layersBtn);
  const budget = createBudget(ctx);
  const celebration = createCelebration(ctx);
  const screens = createScreens(ctx);
  const settings = createSettings(ctx, { newCity: () => screens.showNewCity(false) });
  const hudLeft = root.querySelector('.hud') as HTMLElement;
  const hudRight = root.querySelector('.hud-right') as HTMLElement;
  const tips = createTips(ctx, {
    dockButton: (id) => dock.button(id),
    budgetButton: hud.budgetBtn,
    bounds: () => {
      const r = root.getBoundingClientRect();
      const a = hudLeft.getBoundingClientRect();
      const b = hudRight.getBoundingClientRect();
      return { left: a.left - r.left, right: b.right - r.left };
    },
    dockTop: () => dock.stackTop(),
    // A tip waits while the player is busy (a sheet, the tray, a drag, the inspect card, the layer
    // picker) and stays away while they are already using the tool group it points at.
    blocked: (target) =>
      isModalOpen() ||
      dock.isTrayOpen() ||
      dock.isPreviewing() ||
      inspect.isOpen() ||
      layers.isOpen() ||
      (dock.hasTool() && dock.activeCategory() === target),
  });

  function isModalOpen(): boolean {
    for (const s of sheets) if (s.modal && s.isOpen) return true;
    return false;
  }

  /** Close the transient bits (tray, layer picker) and any other sheet, then open one. */
  function openSheet(open: () => void): void {
    dock.closeTray();
    layers.close();
    for (const s of sheets) if (s.isOpen && s !== celebration.sheet) s.closeNow();
    open();
  }

  /** Hide the game chrome while a full screen (title / new city) is up. */
  function syncChrome(): void {
    const screen = screens.title.isOpen || screens.newCity.isOpen;
    toggleClass(root, 'screen-open', screen);
    toggleClass(root, 'modal-open', isModalOpen());
  }

  // ---------- events from the game ----------
  let lastMilestone = { name: '', at: -1e9 };
  on('toast', (e) => {
    if (performance.now() - lastMilestone.at < MILESTONE_TOAST_WINDOW_MS && lastMilestone.name && e.text.includes(lastMilestone.name)) return;
    toasts.push(e.text, e.tone);
  });
  on('milestone', (e) => {
    lastMilestone = { name: e.name, at: performance.now() };
    dock.markNew(e.unlocked ?? []);
    dock.closeTray();
    layers.close();
    celebration.show({ index: e.index, name: e.name, reward: e.reward, unlocked: e.unlocked ?? [] });
    ctx.invalidate();
  });
  on('reset', () => {
    dock.reset();
    inspect.show(null);
    layers.close();
    tips.reset();
    toasts.clear();
    celebration.clear();
    budget.sheet.closeNow();
    settings.sheet.closeNow();
    ctx.invalidate();
  });
  for (const type of ['applied', 'undo', 'month'] as const) on(type, () => ctx.invalidate());

  let acc = 0;

  return {
    update(state, dt) {
      if (!state) return;
      const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 1) : 0;
      acc += step;
      if (!force && acc < UPDATE_INTERVAL) return;
      const elapsed = acc;
      acc = 0;
      force = false;
      syncChrome();
      hud.update(state);
      dock.update(state);
      layers.update();
      budget.update(state);
      tips.update(state, elapsed);
    },
    setPreview(plan) {
      dock.setPreview(plan);
    },
    showInspect(info) {
      inspect.show(info);
      inspectX = info ? info.x : -1;
      inspectZ = info ? info.z : -1;
      if (info) layers.close();
      ctx.invalidate();
    },
    isInspectOpen: () => inspect.isOpen(),
    refreshInspect(info) {
      if (!info || !inspect.isOpen() || info.x !== inspectX || info.z !== inspectZ) return;
      inspect.show(info);
    },
    back() {
      if (celebration.sheet.isOpen) {
        celebration.sheet.close();
        return true;
      }
      if (screens.newCity.isOpen) {
        screens.newCityBack();
        return true;
      }
      for (const s of sheets) {
        // The title screen has nowhere to go back to.
        if (s.isOpen && s !== screens.title && s !== celebration.sheet) {
          s.close();
          return true;
        }
      }
      if (screens.title.isOpen) return false;
      if (layers.isOpen()) {
        layers.close();
        return true;
      }
      if (dock.isTrayOpen()) {
        dock.closeTray();
        return true;
      }
      if (inspect.isOpen()) {
        inspect.show(null);
        actions.inspectClosed?.();
        ctx.invalidate();
        return true;
      }
      return false;
    },
    showTitle() {
      dock.closeTray();
      layers.close();
      inspect.show(null);
      dock.setPreview(null);
      for (const s of sheets) if (s.isOpen) s.closeNow();
      screens.showTitle();
      syncChrome();
    },
    isModalOpen,
  };
}
