// Map layers: a popover under the layers button to pick an overlay, and a small legend card on the
// left while one is showing.
import type { OverlayKind } from '../core/types';
import type { Ctx } from './ctx';
import { accent, btn, esc, h, setHTML, toggleClass } from './dom';
import { OVERLAYS, icon, overlayLook } from './icons';

export interface Layers {
  toggle(): void;
  close(): void;
  isOpen(): boolean;
  update(): void;
}

export function createLayers(ctx: Ctx, anchor: HTMLElement): Layers {
  const pop = h('div', 'layers-pop panel');
  pop.hidden = true;
  pop.appendChild(h('h4', 'pop-title', 'Map layers'));
  const grid = h('div', 'layers-grid');
  pop.appendChild(grid);
  const opts = new Map<OverlayKind, HTMLButtonElement>();
  for (const [kind, look] of OVERLAYS) {
    const b = btn('layer-opt', `<span class="tile xs">${icon(look.icon)}</span><span>${esc(look.label)}</span>`, look.label);
    accent(b, look.color);
    b.addEventListener('click', () => {
      ctx.click();
      set(kind);
      close();
    });
    opts.set(kind, b);
    grid.appendChild(b);
  }

  const legend = h('div', 'legend panel');
  legend.hidden = true;
  const legHead = h('div', 'leg-head');
  const legTile = h('span', 'tile xs');
  const legName = h('b');
  const legX = btn('round xs', icon('close'), 'Hide layer');
  legHead.append(legTile, legName, legX);
  const legHint = h('p', 'leg-hint');
  const legBody = h('div', 'leg-body');
  legend.append(legHead, legHint, legBody);
  legX.addEventListener('click', () => {
    ctx.click();
    set('none');
  });

  ctx.root.append(pop, legend);

  let shown: OverlayKind | null = null;

  document.addEventListener(
    'pointerdown',
    (e) => {
      if (pop.hidden) return;
      const t = e.target as Node | null;
      if (t && (pop.contains(t) || anchor.contains(t))) return;
      close();
    },
    true,
  );

  function set(kind: OverlayKind): void {
    ctx.actions.setOverlay(kind);
    update();
  }

  function open(): void {
    update();
    pop.hidden = false;
    void pop.offsetWidth;
    pop.classList.add('is-open');
    toggleClass(anchor, 'open', true);
  }

  function close(): void {
    if (pop.hidden) return;
    pop.classList.remove('is-open');
    pop.hidden = true;
    toggleClass(anchor, 'open', false);
  }

  function renderLegend(kind: OverlayKind): void {
    const look = overlayLook(kind);
    accent(legend, look.color);
    setHTML(legTile, icon(look.icon));
    legName.textContent = look.label;
    legHint.textContent = look.hint;
    let html = '';
    const L = look.legend;
    if (L.swatches) {
      html = L.swatches.map(([c, label]) => `<span class="sw"><i style="background:${c}"></i>${esc(label)}</span>`).join('');
    } else if (L.gradient && L.ends) {
      html =
        `<span class="ramp" style="background:linear-gradient(90deg,${L.gradient.join(',')})"></span>` +
        `<span class="ends"><span>${esc(L.ends[0])}</span><span>${esc(L.ends[1])}</span></span>`;
    }
    legBody.innerHTML = html;
  }

  function update(): void {
    const kind = ctx.actions.getOverlay();
    if (kind === shown) return;
    shown = kind;
    for (const [k, b] of opts) toggleClass(b, 'on', k === kind);
    toggleClass(anchor, 'on', kind !== 'none');
    if (kind === 'none') {
      legend.classList.remove('is-open');
      legend.hidden = true;
    } else {
      renderLegend(kind);
      if (legend.hidden) {
        legend.hidden = false;
        void legend.offsetWidth;
        legend.classList.add('is-open');
      }
    }
  }

  return {
    toggle: () => (pop.hidden ? open() : close()),
    close,
    isOpen: () => !pop.hidden,
    update,
  };
}
