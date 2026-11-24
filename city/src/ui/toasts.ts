// Short messages at the top centre: at most three at once, each gone after a few seconds.
import type { Tone } from './ctx';
import { h } from './dom';
import { icon } from './icons';

const MAX = 3;
const LIFE_MS = 3500;
/** Longer messages stay a little longer so they can be read. */
const MS_PER_CHAR = 25;

interface Item {
  el: HTMLElement;
  text: string;
  timer: number;
}

export interface Toasts {
  push(text: string, tone?: Tone): void;
  clear(): void;
}

export function createToasts(root: HTMLElement): Toasts {
  const box = h('div', 'toasts');
  box.setAttribute('aria-live', 'polite');
  root.appendChild(box);
  const items: Item[] = [];

  function remove(item: Item, animate = true): void {
    const k = items.indexOf(item);
    if (k < 0) return;
    items.splice(k, 1);
    window.clearTimeout(item.timer);
    if (!animate) {
      item.el.remove();
      return;
    }
    item.el.classList.add('out');
    window.setTimeout(() => item.el.remove(), 220);
  }

  function life(text: string): number {
    return LIFE_MS + Math.max(0, text.length - 40) * MS_PER_CHAR;
  }

  function push(text: string, tone: Tone = 'info'): void {
    const clean = String(text ?? '').trim();
    if (!clean) return;
    // The same message again: keep the one on screen, give it a nudge and a fresh timer.
    const same = items.find((it) => it.text === clean);
    if (same) {
      window.clearTimeout(same.timer);
      same.timer = window.setTimeout(() => remove(same), life(clean));
      same.el.classList.remove('nudge');
      void same.el.offsetWidth;
      same.el.classList.add('nudge');
      return;
    }
    while (items.length >= MAX) remove(items[0], false);
    const ic = tone === 'good' ? 'check' : tone === 'bad' ? 'warn' : 'info';
    const el = h('div', `toast tone-${tone}`, icon(ic));
    const span = h('span');
    span.textContent = clean;
    el.appendChild(span);
    const item: Item = { el, text: clean, timer: 0 };
    el.addEventListener('click', () => remove(item));
    box.appendChild(el);
    items.push(item);
    item.timer = window.setTimeout(() => remove(item), life(clean));
  }

  function clear(): void {
    for (const it of [...items]) remove(it, false);
  }

  return { push, clear };
}
