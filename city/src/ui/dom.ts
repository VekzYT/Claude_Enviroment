// Tiny DOM helpers: create elements, write text only when it changed, wire taps.

/** Create an element with an optional class list and inner HTML (only ever our own markup). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html !== undefined) el.innerHTML = html;
  return el;
}

/** A <button type="button"> (never submits, focus ring suppressed in CSS for touch). */
export function btn(cls: string, html: string, label?: string): HTMLButtonElement {
  const b = h('button', cls, html);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  return b;
}

/** Set textContent only if it differs, so the browser does no layout work for unchanged values. */
export function setText(el: Element, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

/** Set innerHTML only if it differs (we cache the last markup on the element). */
export function setHTML(el: HTMLElement & { _html?: string }, html: string): void {
  if (el._html === html) return;
  el._html = html;
  el.innerHTML = html;
}

export function toggleClass(el: Element, cls: string, on: boolean): void {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}

export function setStyle(el: HTMLElement, prop: string, value: string): void {
  if (el.style.getPropertyValue(prop) !== value) el.style.setProperty(prop, value);
}

/** Escape text for use inside our HTML templates. */
export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * Keys typed into our text fields must not reach the game's keyboard camera controls, and taps on
 * them must not start gestures. Call on every <input>/<textarea>.
 */
export function isolateField(el: HTMLInputElement | HTMLTextAreaElement): void {
  for (const type of ['keydown', 'keyup', 'keypress'] as const) el.addEventListener(type, (e) => e.stopPropagation());
  // iOS scrolls the page to keep a focused field above the keyboard and can leave it scrolled
  // after the keyboard closes; put it back (the game never scrolls).
  el.addEventListener('blur', () => {
    window.setTimeout(() => {
      const a = document.activeElement;
      if (!a || (a.tagName !== 'INPUT' && a.tagName !== 'TEXTAREA')) window.scrollTo(0, 0);
    }, 60);
  });
}

/** Darken a #rrggbb colour by a factor (0..1) for the toy-like bottom lip under buttons. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = 1 - amount;
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/** Mix a #rrggbb colour towards white (0..1), for soft tinted backgrounds. */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return '#' + ((1 << 24) | (mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255)).toString(16).slice(1);
}

/** Set the --c / --c-dark / --c-soft custom properties an accent-coloured element reads. */
export function accent(el: HTMLElement, color: string): void {
  el.style.setProperty('--c', color);
  el.style.setProperty('--c-dark', shade(color, 0.22));
  el.style.setProperty('--c-soft', tint(color, 0.82));
}

/** Position of an element relative to another (both laid out), in CSS px. */
export function relRect(el: Element, to: Element): { x: number; y: number; w: number; h: number } {
  const a = el.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
}
