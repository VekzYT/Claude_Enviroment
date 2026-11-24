// Every icon in the interface, drawn in one style: a 24-unit grid, rounded 2px strokes in the
// current text colour, and a soft tinted fill (class "f") on the main shape. Class "s" is a solid
// fill with the same rounded outline, "n" a solid fill without outline (dots and pips).
import { ZONE_COLORS } from '../core/defs';
import type { BuildingType, OverlayKind, ToolId } from '../core/types';

const P: Record<string, string> = {
  look: '<circle class="f" cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4l5.1 5.1"/>',
  road: '<path class="f" d="M9 3.5h6l5.5 17h-17z"/><path d="M12 6.5v2M12 11.5v2.5M12 17.2v2"/>',
  zones:
    `<rect x="3.5" y="3.5" width="7.6" height="7.6" rx="2" fill="${ZONE_COLORS.res}"/>` +
    `<rect x="12.9" y="3.5" width="7.6" height="7.6" rx="2" fill="${ZONE_COLORS.com}"/>` +
    `<rect x="3.5" y="12.9" width="17" height="7.6" rx="2" fill="${ZONE_COLORS.ind}"/>`,
  house: '<path class="f" d="M4 11.2L12 4.5l8 6.7v9.3H4z"/><path d="M10 20.5v-5h4v5"/>',
  shop: '<path class="f" d="M5 11v9.5h14V11"/><path class="f" d="M3.5 10.5L5.5 4h13l2 6.5c0 1.4-1.2 2.4-2.8 2.4s-2.9-1-2.9-2.4c0 1.4-1.3 2.4-2.8 2.4s-2.8-1-2.8-2.4c0 1.4-1.3 2.4-2.9 2.4s-2.8-1-2.8-2.4z"/><path d="M10 20.5v-4h4v4"/>',
  factory: '<path class="f" d="M3.5 20.5v-9l5 3v-3l5 3v-3l3 1.8V4h4v16.5z"/><path d="M7 17h1.5M11.5 17H13"/>',
  bulldoze:
    '<path class="f" d="M4.5 13.5V7.5h5.2l2.3 6"/><rect class="f" x="3" y="13.5" width="12" height="6.5" rx="3.25"/><path d="M15 15.5h2.5"/><path class="f" d="M17.5 9.5c2.2.6 3.2 2.9 3.2 5.5s-1 4.9-3.2 5.5z"/>',
  bolt: '<path class="f" d="M13.5 2.5l-9 11h6.5l-1.5 8 9-11H12z"/>',
  civic: '<path class="f" d="M3 9.5L12 4l9 5.5z"/><path d="M5.5 12.5v5M10 12.5v5M14 12.5v5M18.5 12.5v5M3 20.5h18"/>',
  tree: '<circle class="f" cx="12" cy="9.5" r="6.5"/><path d="M12 12.5v8.5M8.5 21h7M12 15.5l2.3-2.3"/>',
  coal: '<path class="f" d="M3.5 20.5V13l4.5-2.8v2.8l4.5-2.8v10.3z"/><path class="f" d="M14.5 20.5V8h4v12.5"/><path d="M3 20.5h18"/><path d="M15 5c.5-1.6 2.6-1.9 3.4-.6.9-1.4 3-1 3.1.7"/>',
  wind:
    '<path d="M12 11v10M8.5 21h7"/>' +
    '<path class="f" d="M12 9.3V2.8c1.9.6 2.5 3.3 0 6.5z"/>' +
    '<path class="f" d="M12 9.3V2.8c1.9.6 2.5 3.3 0 6.5z" transform="rotate(120 12 9.3)"/>' +
    '<path class="f" d="M12 9.3V2.8c1.9.6 2.5 3.3 0 6.5z" transform="rotate(240 12 9.3)"/>' +
    '<circle class="n" cx="12" cy="9.3" r="1.5"/>',
  solar: '<path class="f" d="M6 4h12l2.5 10.5h-17z"/><path d="M4.8 9.2h14.4M10.2 4l-.9 10.5M13.8 4l.9 10.5M12 14.5v6M8 20.5h8"/>',
  tower:
    '<path class="f" d="M4.5 5.5L12 2.5l7.5 3v5.5a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 11z"/><path d="M8 8.6c1.3-.8 2.7-.8 4 0s2.7.8 4 0M7.5 13.5L6 21M16.5 13.5L18 21M12 13.5V21M6.8 17.5h10.4"/>',
  pump: '<path class="f" d="M12 2.8c2.8 3.5 5 6.2 5 8.7a5 5 0 0 1-10 0c0-2.5 2.2-5.2 5-8.7z"/><path d="M2.5 20.2c1.6-1.2 3.1-1.2 4.7 0s3.1 1.2 4.8 0 3.1-1.2 4.7 0 3.1 1.2 4.8 0"/>',
  drop: '<path class="f" d="M12 3c3.2 4 6 7.2 6 10.4a6 6 0 0 1-12 0C6 10.2 8.8 7 12 3z"/>',
  bench: '<circle class="f" cx="8.5" cy="8" r="5"/><path d="M8.5 13v7.5M13 15.5h8M14 15.5v5M20 15.5v5M13.5 18.2h7"/>',
  fountain: '<path class="f" d="M3.5 15.5h17l-1.8 5H5.3z"/><path d="M12 15.5V7M12 7.5c-1.4-2.6-4.4-3.1-6-.6M12 7.5c1.4-2.6 4.4-3.1 6-.6M6.2 10.6v1.2M17.8 10.6v1.2"/>',
  shield:
    '<path class="f" d="M12 2.8l7.5 2.8v5.6c0 4.7-3.2 8.3-7.5 9.9-4.3-1.6-7.5-5.2-7.5-9.9V5.6z"/>' +
    '<path class="n" d="M12 7.6l1.3 2.7 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z"/>',
  flame:
    '<path class="f" d="M12 21.5c-3.9 0-6.5-2.6-6.5-6.2 0-3.5 2.7-5.4 3.5-8.8 1.8 1.2 2.6 3 2.7 4.6 1.6-1.4 2.2-4.2 1.6-7.6 3.6 2.3 6.2 6.5 6.2 11.2 0 3.9-2.5 6.8-7.5 6.8z"/>' +
    '<path d="M12 21.5c-1.7 0-2.8-1.1-2.8-2.7 0-1.8 1.6-2.7 2.3-4.3 1.6 1.2 3.3 2.4 3.3 4.4 0 1.6-1.2 2.6-2.8 2.6z"/>',
  cross: '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 8v8M8 12h8"/>',
  hospital: '<path class="f" d="M4.5 20.5V8.5h15v12"/><path d="M9.5 8.5V4h5v4.5M3 20.5h18M9.5 12v5.5M14.5 12v5.5M9.5 14.7h5"/>',
  school: '<path class="f" d="M4 20.5V11l8-5 8 5v9.5z"/><path d="M12 6V2.5l3.5 1.3L12 5M10 20.5v-4.5h4v4.5M2.5 20.5h19"/>',
  cap: '<path class="f" d="M1.8 9.5L12 4.5l10.2 5L12 14.5z"/><path d="M6 11.6v4.7c3.5 2.6 8.5 2.6 12 0v-4.7M21.6 10v5.5"/>',
  stadium:
    '<path class="f" d="M2.5 10.5v4c0 3 4.3 5.5 9.5 5.5s9.5-2.5 9.5-5.5v-4"/><ellipse class="f" cx="12" cy="10.5" rx="9.5" ry="5"/><ellipse cx="12" cy="10.5" rx="4.5" ry="2"/>',
  skytower: '<path class="f" d="M9.6 20.5L11 10.2h2l1.4 10.3z"/><path class="f" d="M8.2 7.2h7.6l-1.3 3h-5z"/><path d="M12 7.2V2.5M6 20.5h12"/>',
  pause: '<rect class="s" x="6.5" y="5.5" width="3.6" height="13" rx="1"/><rect class="s" x="13.9" y="5.5" width="3.6" height="13" rx="1"/>',
  speed1: '<path class="s" d="M8.5 5.8l9.5 6.2-9.5 6.2z"/>',
  speed2: '<path class="s" d="M3.8 6.5l7.5 5.5-7.5 5.5zM12.7 6.5l7.5 5.5-7.5 5.5z"/>',
  speed3: '<path class="s" d="M1.8 7.8l5.8 4.2-5.8 4.2zM9.1 7.8l5.8 4.2-5.8 4.2zM16.4 7.8l5.8 4.2-5.8 4.2z"/>',
  layers: '<path class="f" d="M12 3.5l9 4.8-9 4.8-9-4.8z"/><path d="M3 12.4l9 4.8 9-4.8M3 16.4l9 4.8 9-4.8"/>',
  coins:
    '<ellipse class="f" cx="9.5" cy="6.5" rx="6" ry="2.8"/><path d="M3.5 6.5v4.2c0 1.5 2.7 2.8 6 2.8M3.5 10.7v4.2c0 1.5 2.7 2.8 6 2.8"/>' +
    '<path class="f" d="M10 13v4.6c0 1.5 2.5 2.6 5.5 2.6s5.5-1.1 5.5-2.6V13"/><ellipse class="f" cx="15.5" cy="13" rx="5.5" ry="2.6"/>',
  menu: '<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>',
  undo: '<path d="M8.5 13.5L4 9l4.5-4.5"/><path d="M4 9h10.5a5 5 0 0 1 0 10H10"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  people:
    '<circle class="f" cx="9" cy="8" r="3.5"/><path class="f" d="M2.5 20c.3-3.6 3-6 6.5-6s6.2 2.4 6.5 6z"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M17.5 14.3c2.3.7 3.7 2.8 4 5.7"/>',
  faceHappy:
    '<circle class="f" cx="12" cy="12" r="9"/><circle class="n" cx="9" cy="10" r="1.3"/><circle class="n" cx="15" cy="10" r="1.3"/><path d="M8 14.2c1 1.8 2.4 2.7 4 2.7s3-.9 4-2.7"/>',
  faceOk: '<circle class="f" cx="12" cy="12" r="9"/><circle class="n" cx="9" cy="10" r="1.3"/><circle class="n" cx="15" cy="10" r="1.3"/><path d="M8.6 15.2h6.8"/>',
  faceSad:
    '<circle class="f" cx="12" cy="12" r="9"/><circle class="n" cx="9" cy="10" r="1.3"/><circle class="n" cx="15" cy="10" r="1.3"/><path d="M8 16.6c1-1.5 2.4-2.3 4-2.3s3 .8 4 2.3"/>',
  lock: '<rect class="f" x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2"/>',
  star: '<path class="f" d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  warn: '<path class="f" d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.2M12 17.2v.1"/>',
  info: '<circle class="f" cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  check: '<circle class="f" cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8 5.2-5.6"/>',
  tick: '<path d="M5.5 12.5l4.2 4.2 8.8-9.2"/>',
  bulb: '<path class="f" d="M12 2.8a6.5 6.5 0 0 0-3.8 11.8c.8.6 1.3 1.5 1.3 2.4h5c0-.9.5-1.8 1.3-2.4A6.5 6.5 0 0 0 12 2.8z"/><path d="M9.6 20h4.8M10.6 22.5h2.8"/>',
  copy: '<rect class="f" x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  dice: '<rect class="f" x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle class="n" cx="8.4" cy="8.4" r="1.6"/><circle class="n" cx="12" cy="12" r="1.6"/><circle class="n" cx="15.6" cy="15.6" r="1.6"/>',
  save: '<path class="f" d="M3.5 14.5v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4"/><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/>',
  restore: '<path class="f" d="M3.5 14.5v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4"/><path d="M12 14.5v-11M7.5 8L12 3.5 16.5 8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sound: '<path class="f" d="M4 9.5h3.5l4.5-4v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.4a7.6 7.6 0 0 1 0 11.2"/>',
  music: '<path d="M9 18V5.8l11-2.3V16"/><circle class="f" cx="6.5" cy="18" r="2.5"/><circle class="f" cx="17.5" cy="16" r="2.5"/>',
  haptic: '<rect class="f" x="8" y="3.5" width="8" height="17" rx="2.2"/><path d="M4.8 8.5v7M19.2 8.5v7M2 10.5v3M22 10.5v3"/>',
  sparkle: '<path class="f" d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  locate: '<circle class="f" cx="12" cy="12" r="6"/><path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5"/><circle class="n" cx="12" cy="12" r="1.8"/>',
  cloud: '<path class="f" d="M7 18.5a4 4 0 0 1-.7-7.9 5.8 5.8 0 0 1 11.2-1.4 4.7 4.7 0 0 1 .3 9.3z"/>',
  gem: '<path class="f" d="M6.5 4.5h11l4 5-9.5 11-9.5-11z"/><path d="M2.5 9.5h19M9.5 4.5L8 9.5l4 11 4-11-1.5-5"/>',
  map: '<path class="f" d="M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2z"/><path d="M9 4.5v13M15 6.5v13"/>',
  chart: '<path d="M3.5 20.5h17"/><path class="f" d="M5.5 20.5v-6h3v6M10.5 20.5v-10h3v10M15.5 20.5v-14h3v14"/>',
  coin: '<circle class="f" cx="12" cy="12" r="9"/><path d="M14.6 8.8c-.6-.9-1.6-1.4-2.7-1.4-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.6 5.8 4.7 0 1.3-1.3 2.3-3 2.3-1.2 0-2.3-.5-2.9-1.4M12 5.6v1.8M12 16.6v1.8"/>',
};

export type IconName = keyof typeof P;

/** Inline SVG markup for an icon. `cls` adds classes on the <svg>. */
export function icon(name: IconName | string, cls = ''): string {
  const body = P[name] ?? P.info;
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function hasIcon(name: string): boolean {
  return name in P;
}

// ---------- what each tool, category and overlay looks like ----------

export interface Look {
  icon: IconName;
  color: string;
}

const BUILDING_LOOK: Record<BuildingType, Look> = {
  power_coal: { icon: 'coal', color: '#e8892b' },
  power_wind: { icon: 'wind', color: '#2fb2d6' },
  power_solar: { icon: 'solar', color: '#f0b31c' },
  water_tower: { icon: 'tower', color: '#36a3ff' },
  water_pump: { icon: 'pump', color: '#2b7fd9' },
  park_small: { icon: 'bench', color: '#5cb83a' },
  park_plaza: { icon: 'fountain', color: '#21b0a0' },
  police: { icon: 'shield', color: '#3d7bff' },
  fire: { icon: 'flame', color: '#ff5a36' },
  clinic: { icon: 'cross', color: '#f25c9a' },
  school: { icon: 'school', color: '#9b6bff' },
  hospital: { icon: 'hospital', color: '#e2457a' },
  college: { icon: 'cap', color: '#7a5cf0' },
  stadium: { icon: 'stadium', color: '#ff8a3d' },
  landmark: { icon: 'skytower', color: '#a35fe8' },
};

const BASIC_LOOK: Record<string, Look> = {
  inspect: { icon: 'look', color: '#18a999' },
  road: { icon: 'road', color: '#687789' },
  zone_res: { icon: 'house', color: ZONE_COLORS.res },
  zone_com: { icon: 'shop', color: ZONE_COLORS.com },
  zone_ind: { icon: 'factory', color: ZONE_COLORS.ind },
  bulldoze: { icon: 'bulldoze', color: '#ef5a4a' },
};

export function toolLook(tool: ToolId): Look {
  if (tool.startsWith('build:')) return BUILDING_LOOK[tool.slice(6) as BuildingType] ?? BASIC_LOOK.inspect;
  return BASIC_LOOK[tool] ?? BASIC_LOOK.inspect;
}

export function buildingLook(type: BuildingType): Look {
  return BUILDING_LOOK[type];
}

/** Dock buttons, by TOOL_CATEGORIES id (plus 'inspect' for the Look button). */
export const CATEGORY_LOOK: Record<string, Look> = {
  inspect: BASIC_LOOK.inspect,
  roads: { icon: 'road', color: '#687789' },
  zones: { icon: 'zones', color: '#3fae5b' },
  utilities: { icon: 'bolt', color: '#f0a01c' },
  services: { icon: 'civic', color: '#6f63e8' },
  fun: { icon: 'tree', color: '#4caf3c' },
  bulldoze: { icon: 'bulldoze', color: '#ef5a4a' },
};

export function categoryLook(id: string): Look {
  return CATEGORY_LOOK[id] ?? { icon: 'info', color: '#687789' };
}

/**
 * Map layers. Swatch colours match render/overlay.ts OVERLAY_COLORS so the legend reads the same as
 * the map; they are copied (not imported) because ui must not depend on render.
 */
export interface OverlayLook extends Look {
  label: string;
  /** One short line explaining what the layer shows. */
  hint: string;
  /** Either discrete swatches or a gradient with two end labels. */
  legend: { swatches?: Array<[string, string]>; gradient?: string[]; ends?: [string, string] };
}

export const OVERLAYS: Array<[OverlayKind, OverlayLook]> = [
  ['none', { label: 'Off', icon: 'map', color: '#687789', hint: '', legend: {} }],
  [
    'power',
    {
      label: 'Power',
      icon: 'bolt',
      color: '#f0b31c',
      hint: 'Which lots have electricity.',
      legend: { swatches: [['#ffcc2e', 'Powered'], ['#ff4040', 'No power']] },
    },
  ],
  [
    'water',
    {
      label: 'Water',
      icon: 'drop',
      color: '#36a3ff',
      hint: 'Which lots have running water.',
      legend: { swatches: [['#36a3ff', 'Has water'], ['#ff4040', 'No water']] },
    },
  ],
  [
    'pollution',
    {
      label: 'Pollution',
      icon: 'cloud',
      color: '#8f5b86',
      hint: 'Smoke from factories and coal plants.',
      legend: { gradient: ['#d8b04a', '#b06a3a', '#5e2a6e'], ends: ['A little', 'Heavy'] },
    },
  ],
  [
    'landValue',
    {
      label: 'Land value',
      icon: 'gem',
      color: '#2fbf67',
      hint: 'Where people most want to live.',
      legend: { gradient: ['#e5483b', '#ffd23f', '#33cf6a'], ends: ['Low', 'High'] },
    },
  ],
  [
    'police',
    {
      label: 'Police',
      icon: 'shield',
      color: '#3d7bff',
      hint: 'Streets covered by police stations.',
      legend: { gradient: ['#3d7bff33', '#3d7bff'], ends: ['Weak', 'Strong'] },
    },
  ],
  [
    'fire',
    {
      label: 'Fire',
      icon: 'flame',
      color: '#ff5a36',
      hint: 'Blocks covered by fire stations.',
      legend: { gradient: ['#ff5a3633', '#ff5a36'], ends: ['Weak', 'Strong'] },
    },
  ],
  [
    'health',
    {
      label: 'Health',
      icon: 'cross',
      color: '#f25c9a',
      hint: 'Homes near clinics and hospitals.',
      legend: { gradient: ['#ff5fa233', '#ff5fa2'], ends: ['Weak', 'Strong'] },
    },
  ],
  [
    'education',
    {
      label: 'Education',
      icon: 'cap',
      color: '#9b6bff',
      hint: 'Homes near schools and colleges.',
      legend: { gradient: ['#9b6bff33', '#9b6bff'], ends: ['Weak', 'Strong'] },
    },
  ],
];

export function overlayLook(kind: OverlayKind): OverlayLook {
  return (OVERLAYS.find(([k]) => k === kind) ?? OVERLAYS[0])[1];
}
