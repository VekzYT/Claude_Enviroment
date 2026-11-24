// Shared plumbing for the interface pieces: the context every widget gets, and the sheet/modal layer.
import type { UIActions } from './index';
import { btn, h } from './dom';
import { icon } from './icons';

export type Tone = 'info' | 'good' | 'bad';

export interface Ctx {
  /** The #ui element everything lives in. */
  root: HTMLElement;
  actions: UIActions;
  /** Button feedback (sound + haptic). Never throws. */
  click(): void;
  /** Show a toast from the UI itself (not via the event bus). */
  toast(text: string, tone?: Tone): void;
  /** Make the next update() rewrite every value (after a tool change, tax change, reset...). */
  invalidate(): void;
  /** Every sheet that exists, for isModalOpen() and for closing others when one opens. */
  sheets: Set<Sheet>;
}

export interface SheetOptions {
  /** Extra class on the card. */
  cls: string;
  /** Counts for isModalOpen() (pauses world input). */
  modal: boolean;
  /** Tapping the dimmed backdrop closes it. */
  backdropCloses: boolean;
  /** Stacking layer (CSS class on the wrapper): 'sheet' | 'screen' | 'celebrate'. */
  layer: 'sheet' | 'screen' | 'celebrate';
}

/**
 * A panel over the game with a dimmed backdrop. Opening adds a class so CSS can animate it in;
 * closing animates out and then hides it, so closed sheets cost nothing to lay out.
 */
export class Sheet {
  readonly wrap: HTMLDivElement;
  readonly card: HTMLDivElement;
  readonly modal: boolean;
  onClose: (() => void) | null = null;
  private shown = false;
  private hideTimer = 0;

  constructor(
    private readonly ctx: Ctx,
    opts: SheetOptions,
  ) {
    this.modal = opts.modal;
    this.wrap = h('div', `ui-layer ui-layer-${opts.layer}`);
    this.wrap.hidden = true;
    this.card = h('div', `ui-sheet ${opts.cls}`);
    this.card.setAttribute('role', 'dialog');
    this.wrap.appendChild(this.card);
    if (opts.backdropCloses) {
      this.wrap.addEventListener('click', (e) => {
        if (e.target === this.wrap) {
          ctx.click();
          this.close();
        }
      });
    }
    ctx.root.appendChild(this.wrap);
    ctx.sheets.add(this);
  }

  get isOpen(): boolean {
    return this.shown;
  }

  open(): void {
    window.clearTimeout(this.hideTimer);
    if (this.shown) return;
    this.shown = true;
    this.wrap.hidden = false;
    // Force a style flush so the transition runs from the closed state.
    void this.wrap.offsetWidth;
    this.wrap.classList.add('is-open');
    this.ctx.invalidate();
  }

  close(): void {
    if (!this.shown) return;
    this.shown = false;
    this.wrap.classList.remove('is-open');
    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      if (!this.shown) this.wrap.hidden = true;
    }, 240);
    this.ctx.invalidate();
    const cb = this.onClose;
    if (cb) cb();
  }

  /** Close immediately with no animation (used when another full screen replaces this one). */
  closeNow(): void {
    const was = this.shown;
    this.shown = false;
    window.clearTimeout(this.hideTimer);
    this.wrap.classList.remove('is-open');
    this.wrap.hidden = true;
    if (was) {
      this.ctx.invalidate();
      const cb = this.onClose;
      if (cb) cb();
    }
  }
}

/** A sheet header: icon tile, title, optional extra node, and a round close button. */
export function sheetHeader(ctx: Ctx, sheet: Sheet, iconName: string, title: string, color: string): {
  el: HTMLDivElement;
  title: HTMLElement;
  extra: HTMLElement;
} {
  const el = h('div', 'sh-head');
  const tile = h('span', 'tile', icon(iconName));
  tile.style.setProperty('--c', color);
  const t = h('h2', 'sh-title');
  t.textContent = title;
  const extra = h('div', 'sh-extra');
  const x = btn('round sm sh-close', icon('close'), 'Close');
  x.addEventListener('click', () => {
    ctx.click();
    sheet.close();
  });
  el.append(tile, t, extra, x);
  return { el, title: t, extra };
}
