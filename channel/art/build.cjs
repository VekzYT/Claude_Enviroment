// GAMERULE channel art: the profile picture, the banner, the cast sheet and thumbnail mockups.
// Everything is drawn here as SVG and rendered to PNG with the pre-installed Playwright Chromium.
//   node channel/art/build.cjs            renders every page
//   node channel/art/build.cjs avatar     renders just one
// These are concept art. The animated episodes use the studio's rig, styled to match.
const path = require('path');
const { chromium } = require('playwright');

const OUT = __dirname;

const C = {
  lime: '#8BE04E',
  limeShade: '#5DA832',
  limeDeep: '#2F7D32',
  line: '#1B1530',
  skin: '#F3E9DC',
  skinShade: '#DCCBB8',
  yellow: '#FFD93B',
  red: '#FF4D4D',
  duskTop: '#1E1530',
  duskMid: '#4A2A5E',
  duskLow: '#F08A4B',
  pants: '#2A2340',
};

// ---------- the player marker: a pixel-art arrow, the channel's logo ----------
function marker(x, y, px = 9, glow = true) {
  const rows = [9, 7, 5, 3, 1];
  let rects = '';
  rows.forEach((n, r) => {
    const x0 = -((n * px) / 2);
    for (let i = 0; i < n; i++) {
      const edge = i === 0 || i === n - 1 || r === 0;
      rects += `<rect x="${x0 + i * px}" y="${r * px}" width="${px}" height="${px}" fill="${edge ? C.limeDeep : C.lime}"/>`;
    }
  });
  // a light pixel on the top-left for the highlight
  rects += `<rect x="${-3.5 * px}" y="${px}" width="${px}" height="${px}" fill="#C8F59E"/>`;
  return `<g transform="translate(${x} ${y - 2.5 * px})" ${glow ? 'filter="url(#markerGlow)"' : ''}>${rects}</g>`;
}

// ---------- faces ----------
function face(expr, dx = 0) {
  const ex = dx;
  const eyes = (lx, rx, ry = 0, h = 15) => `
    <ellipse cx="${lx + ex}" cy="${-8 + ry}" rx="9" ry="${h}" fill="${C.line}"/>
    <ellipse cx="${rx + ex}" cy="${-8 + ry}" rx="9" ry="${h}" fill="${C.line}"/>
    <circle cx="${lx + ex + 3}" cy="${-14 + ry}" r="3" fill="#fff"/>
    <circle cx="${rx + ex + 3}" cy="${-14 + ry}" r="3" fill="#fff"/>`;
  if (expr === 'determined')
    return `${eyes(-20, 22)}
      <path d="M ${-36 + ex} -36 L ${-6 + ex} -28" stroke="${C.line}" stroke-width="7" stroke-linecap="round"/>
      <path d="M ${8 + ex} -28 L ${38 + ex} -38" stroke="${C.line}" stroke-width="7" stroke-linecap="round"/>
      <path d="M ${-10 + ex} 26 Q ${8 + ex} 34 ${28 + ex} 20" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (expr === 'grin')
    return `${eyes(-20, 22, 0, 13)}
      <path d="M ${-34 + ex} -34 Q ${-20 + ex} -42 ${-6 + ex} -34" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M ${8 + ex} -34 Q ${22 + ex} -42 ${36 + ex} -34" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M ${-18 + ex} 16 Q ${4 + ex} 44 ${30 + ex} 14 Z" fill="${C.line}"/>
      <path d="M ${-8 + ex} 30 Q ${5 + ex} 38 ${18 + ex} 30" stroke="#E86A6A" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (expr === 'up')
    return `${eyes(-20, 22, -10, 16)}
      <path d="M ${-34 + ex} -50 Q ${-20 + ex} -58 ${-6 + ex} -50" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M ${8 + ex} -50 Q ${22 + ex} -58 ${36 + ex} -50" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="${4 + ex}" cy="24" rx="9" ry="11" fill="${C.line}"/>`;
  // neutral
  return `${eyes(-20, 22)}
    <path d="M ${-8 + ex} 22 Q ${6 + ex} 28 ${20 + ex} 22" stroke="${C.line}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

// ---------- a character on one simple rig ----------
// Origin at the hips. Head centre at (0, -265), radius 78. Arms are [shoulder angle, elbow bend] in degrees,
// 0 = straight down, positive swings toward screen-right.
function limb(x0, y0, a, b, l1, l2, w, col) {
  const r = (d) => (d * Math.PI) / 180;
  const x1 = x0 + Math.sin(r(a)) * l1, y1 = y0 + Math.cos(r(a)) * l1;
  const x2 = x1 + Math.sin(r(a + b)) * l2, y2 = y1 + Math.cos(r(a + b)) * l2;
  const d = `M ${x0} ${y0} L ${x1} ${y1} L ${x2} ${y2}`;
  return {
    svg: `<path d="${d}" stroke="${C.line}" stroke-width="${w + 9}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    end: [x2, y2],
  };
}

function fist(x, y, s = 1, col = C.skin) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-24" y="-20" width="48" height="40" rx="16" fill="${col}" stroke="${C.line}" stroke-width="6"/>
    <path d="M -8 -18 L -8 -4 M 6 -18 L 6 -4" stroke="${C.line}" stroke-width="3.5" opacity="0.5" stroke-linecap="round"/>
  </g>`;
}

function character(o) {
  const {
    x = 0, y = 0, s = 1, look = 'you', expr = 'neutral', armR = [14, -8], armL = [-14, 8],
    legR = [6, -2], legL = [-6, 2], punch = false, rim = true, markerOn = true, faceDx = 8,
  } = o;
  const L = {
    you: { body: C.lime, shade: C.limeShade, deep: C.limeDeep, sleeve: C.lime, pants: C.pants, shoe: '#F4F1EA', hat: '' },
    dex: { body: '#4F7BB8', shade: '#3D6396', deep: '#2C4A73', sleeve: '#4F7BB8', pants: '#3A3446', shoe: '#E8483F', hat: 'cap' },
    juni: { body: '#8B5CF6', shade: '#6E44D6', deep: '#4C2E9E', sleeve: '#8B5CF6', pants: '#3A3446', shoe: '#FFD93B', hat: 'star' },
    mom: { body: '#B86F7E', shade: '#9A5867', deep: '#6E3D49', sleeve: '#B86F7E', pants: '#4A4060', shoe: '#5A4A6A', hat: 'mom' },
  }[look];
  const skin = look === 'dex' ? '#9C6B4E' : look === 'mom' ? '#E3C3A3' : C.skin;
  const legs = [
    limb(-22, -6, legL[0], legL[1], 92, 92, 34, L.pants),
    limb(22, -6, legR[0], legR[1], 92, 92, 34, L.pants),
  ];
  const shoes = legs.map((g) => `<ellipse cx="${g.end[0] + 10}" cy="${g.end[1] + 8}" rx="30" ry="15" fill="${L.shoe}" stroke="${C.line}" stroke-width="6"/>`).join('');
  const aL = limb(-62, -188, armL[0], armL[1], 78, 74, 30, L.sleeve);
  const aR = limb(62, -188, armR[0], armR[1], 78, 74, 30, L.sleeve);

  // the cube backpack (the inventory) sits behind the screen-left shoulder; one strap crosses the chest
  const strap = look === 'you' ? `<path d="M -60 -194 Q -50 -120 -30 -40" stroke="${C.line}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M -60 -194 Q -50 -120 -30 -40" stroke="#2E3A4A" stroke-width="12" fill="none" stroke-linecap="round"/>` : '';
  const backpack = look === 'you' ? `
    <g transform="translate(-150 -236)">
      <path d="M 0 0 L 44 -22 L 88 0 L 44 22 Z" fill="#3A4A5E" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M 0 0 L 44 22 L 44 92 L 0 70 Z" fill="#26313F" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M 44 22 L 88 0 L 88 70 L 44 92 Z" fill="#1C2532" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M 44 26 L 44 88 M 4 4 L 40 22" stroke="${C.lime}" stroke-width="3" opacity="0.85"/>
    </g>` : '';

  const hat = {
    cap: `<path d="M -70 -300 Q 0 -372 70 -300 Z" fill="#E8483F" stroke="${C.line}" stroke-width="6"/>
          <path d="M -66 -300 L -128 -292 Q -118 -284 -64 -288 Z" fill="#C73A33" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>`,
    star: `<path d="M -74 -262 Q -94 -300 -66 -320 Q -50 -300 -62 -268 Z M 74 -262 Q 94 -300 66 -320 Q 50 -300 62 -268 Z" fill="#3A2620" stroke="${C.line}" stroke-width="5"/>
           <path d="M -44 -326 l 7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2 z" fill="${C.yellow}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`,
    mom: `<path d="M -84 -250 Q -92 -350 0 -352 Q 92 -350 84 -250 Q 70 -300 0 -316 Q -70 -300 -84 -250 Z" fill="#5A3226" stroke="${C.line}" stroke-width="5"/>
          <g fill="none" stroke="${C.line}" stroke-width="5"><circle cx="${-14 + faceDx}" cy="-273" r="18"/><circle cx="${30 + faceDx}" cy="-273" r="18"/><path d="M ${4 + faceDx} -273 L ${12 + faceDx} -273"/></g>`,
  }[L.hat] || '';

  const hood = `<path d="M -66 -196 Q 0 -150 66 -196 Q 54 -222 0 -224 Q -54 -222 -66 -196 Z" fill="${L.deep}" stroke="${C.line}" stroke-width="6"/>`;
  const strings = look === 'you' ? `<path d="M -14 -184 L -18 -142 M 14 -184 L 18 -142" stroke="#F4F1EA" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-18" cy="-140" r="5" fill="#F4F1EA"/><circle cx="18" cy="-140" r="5" fill="#F4F1EA"/>` : '';
  const torso = `<path d="M -70 -196 Q 0 -212 70 -196 L 60 0 Q 0 12 -60 0 Z" fill="${L.body}" stroke="${C.line}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M 26 -190 Q 64 -190 62 -10 L 58 0 Q 40 6 26 6 Z" fill="${L.shade}" opacity="0.9"/>
    ${look === 'you' ? `<path d="M -38 -64 L 38 -64 L 46 -14 L -46 -14 Z" fill="${L.shade}" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>` : ''}
    ${look === 'dex' ? `<path d="M -6 -196 L -6 2 M 0 -196 L 0 2" stroke="#2C4A73" stroke-width="4"/>` : ''}`;
  const head = `<circle cx="0" cy="-265" r="78" fill="${skin}" stroke="${C.line}" stroke-width="7"/>
    ${rim ? `<path d="M 44 -326 A 78 78 0 0 1 60 -214" stroke="#FFB27A" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.9"/>` : ''}
    <g transform="translate(0 -258)">${face(expr, faceDx)}</g>`;

  const handL = fist(aL.end[0], aL.end[1], 0.95, skin);
  const handR = fist(aR.end[0], aR.end[1], punch ? 1.25 : 0.95, skin);

  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="${Math.max(legs[0].end[1], legs[1].end[1]) + 22}" rx="120" ry="18" fill="#000" opacity="0.28"/>
    ${backpack}
    ${aL.svg}${handL}
    ${legs.map((g) => g.svg).join('')}${shoes}
    ${torso}${strap}${hood}${strings}
    ${aR.svg}${handR}
    ${head}${hat}
    ${markerOn && look === 'you' ? marker(0, -400, 10) : ''}
  </g>`;
}

// ---------- shared defs ----------
const defs = `<defs>
  <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="6" result="b"/>
    <feFlood flood-color="${C.lime}" flood-opacity="0.75"/><feComposite in2="b" operator="in" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
  <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.duskTop}"/><stop offset="0.55" stop-color="${C.duskMid}"/><stop offset="1" stop-color="${C.duskLow}"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FFE3A3" stop-opacity="1"/><stop offset="0.35" stop-color="#FFB86B" stop-opacity="0.7"/><stop offset="1" stop-color="#F08A4B" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <radialGradient id="lampPool" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FFE7B0" stop-opacity="0.55"/><stop offset="1" stop-color="#FFE7B0" stop-opacity="0"/>
  </radialGradient>
</defs>`;

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;700&family=Poppins:wght@800;900&display=swap" rel="stylesheet">`;

function page(w, h, body) {
  return `<!doctype html><html><head><meta charset="utf-8">${fonts}
  <style>html,body{margin:0;background:#000}svg{display:block}
  .disp{font-family:'Poppins',sans-serif;font-weight:900}
  .pix{font-family:'Pixelify Sans',monospace;font-weight:700}</style></head>
  <body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg></body></html>`;
}

// a dusk skyline with lit windows, deterministic
function skyline(w, base, seed = 1, scale = 1, lit = 0.35) {
  let rnd = seed;
  const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  let x = -20, out = '';
  while (x < w + 20) {
    const bw = (60 + r() * 110) * scale, bh = (90 + r() * 260) * scale;
    out += `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh + 4}" fill="#21172F"/>`;
    for (let wy = base - bh + 14 * scale; wy < base - 14 * scale; wy += 22 * scale)
      for (let wx = x + 10 * scale; wx < x + bw - 14 * scale; wx += 20 * scale)
        if (r() < lit) out += `<rect x="${wx}" y="${wy}" width="${9 * scale}" height="${12 * scale}" fill="${r() < 0.7 ? '#FFC870' : '#FFE9B8'}" opacity="${0.55 + r() * 0.45}"/>`;
    x += bw + 6 * scale;
  }
  return out;
}

function chatBox(x, y, lines, size = 30) {
  const lh = size * 1.45;
  const wMax = Math.max(...lines.map((l) => l.t.length)) * size * 0.62 + 36;
  const rows = lines.map((l, i) => `<text x="${x + 18}" y="${y + 18 + size + i * lh}" class="pix" font-size="${size}" fill="${l.c || '#fff'}">${l.t}</text>`).join('');
  return `<rect x="${x}" y="${y}" width="${wMax}" height="${lines.length * lh + 26}" fill="#000" opacity="0.55"/>${rows}`;
}

// ---------- pages ----------
const pages = {
  // 800x800 profile picture: the marker over the hero's head, which looks up at it
  avatar: () => page(800, 800, `
    <rect width="800" height="800" fill="url(#dusk)"/>
    <circle cx="400" cy="900" r="420" fill="url(#sun)" opacity="0.55"/>
    ${skyline(800, 800, 7, 0.9, 0.3)}
    <rect width="800" height="800" fill="url(#vignette)"/>
    <path d="M 120 812 Q 400 660 680 812 Z" fill="${C.lime}" stroke="${C.line}" stroke-width="14" stroke-linejoin="round"/>
    <path d="M 250 760 Q 400 700 550 760 Q 400 812 250 760 Z" fill="${C.limeDeep}" stroke="${C.line}" stroke-width="12" stroke-linejoin="round"/>
    <g transform="translate(400 820) scale(2.15)">
      <circle cx="0" cy="-120" r="92" fill="${C.skin}" stroke="${C.line}" stroke-width="7"/>
      <path d="M 52 -192 A 92 92 0 0 1 72 -66" stroke="#FFB27A" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g transform="translate(-4 -116)">${face('up', 0)}</g>
    </g>
    ${marker(400, 210, 34)}
  `),

  // 2560x1440 banner; everything that matters sits in the 1546x423 safe area in the middle
  banner: () => page(2560, 1440, `
    <rect width="2560" height="1440" fill="url(#dusk)"/>
    <circle cx="1880" cy="1080" r="560" fill="url(#sun)"/>
    ${skyline(2560, 1200, 3, 1.4, 0.3)}
    <rect y="1196" width="2560" height="260" fill="#160F22"/>
    <rect width="2560" height="1440" fill="url(#vignette)"/>
    <!-- desktop shows only the band y 508-931, so the hero is a bust that fits inside it -->
    <text x="600" y="712" class="disp" font-size="190" fill="${C.lime}" stroke="${C.line}" stroke-width="18" paint-order="stroke" letter-spacing="4">GAMERULE</text>
    <text x="606" y="790" class="disp" font-size="58" fill="#fff" stroke="${C.line}" stroke-width="10" paint-order="stroke">REAL LIFE. <tspan fill="${C.yellow}">NEW RULES.</tspan></text>
    ${chatBox(606, 812, [{ t: '/gamerule realLife true' }, { t: 'New rule every Friday.', c: C.yellow }], 28)}
    ${character({ x: 1860, y: 1050, s: 1.2, expr: 'grin', armR: [150, 30], armL: [-14, 8], faceDx: -4 })}
  `),

  // the cast, for checking the designs side by side
  cast: () => page(1920, 1080, `
    <rect width="1920" height="1080" fill="url(#dusk)"/>
    ${skyline(1920, 1000, 5, 1, 0.25)}
    <rect y="996" width="1920" height="90" fill="#160F22"/>
    <rect width="1920" height="1080" fill="url(#vignette)"/>
    ${character({ x: 330, y: 790, s: 1.05, look: 'you', expr: 'determined' })}
    ${character({ x: 760, y: 770, s: 1.12, look: 'dex', expr: 'grin', armR: [-35, -60], faceDx: 4 })}
    ${character({ x: 1130, y: 830, s: 0.72, look: 'juni', expr: 'grin', armR: [-150, 20], faceDx: 2 })}
    ${character({ x: 1480, y: 780, s: 1.05, look: 'mom', expr: 'neutral', faceDx: 0 })}
    ${['YOU', 'DEX', 'JUNI', 'MOM'].map((n, i) => `<text x="${[330, 760, 1130, 1480][i]}" y="1050" text-anchor="middle" class="disp" font-size="40" fill="#fff">${n}</text>`).join('')}
    ${chatBox(1640, 120, [{ t: '[Admin]', c: C.red }, { t: 'interesting.', c: C.red }], 30)}
    <text x="60" y="90" class="disp" font-size="54" fill="#fff">GAMERULE · cast</text>
    <text x="62" y="134" class="pix" font-size="26" fill="${C.yellow}">concept sheet · the animated rig will be styled to match</text>
  `),

  // thumbnail mockup for episode 1, concept A: "MINED."
  'ep01-thumbnail-mockup': () => {
    // the car loses a stepped bite at the front, block by block: cells of 54 px from its front edge
    const car = `
      <g transform="translate(672 430)">
        <ellipse cx="220" cy="168" rx="330" ry="26" fill="#000" opacity="0.35"/>
        <mask id="bite" maskUnits="userSpaceOnUse">
          <rect x="-200" y="-200" width="900" height="500" fill="#fff"/>
          <rect x="-140" y="-100" width="84" height="260" fill="#000"/>
          <rect x="-56" y="-20" width="54" height="108" fill="#000"/>
          <rect x="-2" y="-20" width="54" height="54" fill="#000"/>
        </mask>
        <g mask="url(#bite)">
          <path d="M -110 120 L -110 40 Q -100 10 -60 4 L 40 -8 Q 90 -70 180 -74 L 330 -74 Q 400 -70 450 -6 L 510 6 Q 540 14 540 50 L 540 120 Z" fill="#D64545" stroke="${C.line}" stroke-width="8" stroke-linejoin="round"/>
          <path d="M 70 -10 Q 110 -60 180 -62 L 250 -62 L 250 -8 Z" fill="#9FD3E6" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
          <path d="M 270 -62 L 330 -62 Q 380 -58 420 -8 L 270 -8 Z" fill="#9FD3E6" stroke="${C.line}" stroke-width="6" stroke-linejoin="round"/>
          <path d="M -100 70 L 530 70" stroke="#A83535" stroke-width="6"/>
          <circle cx="20" cy="124" r="46" fill="#26212F" stroke="${C.line}" stroke-width="8"/><circle cx="20" cy="124" r="18" fill="#9A93A8"/>
          <circle cx="420" cy="124" r="46" fill="#26212F" stroke="${C.line}" stroke-width="8"/><circle cx="420" cy="124" r="18" fill="#9A93A8"/>
          <g stroke="${C.line}" stroke-width="3" opacity="0.45">
            <path d="M 52 -20 L 52 120 M 106 -20 L 106 120 M -2 34 L -2 120 M -56 88 L 160 88 M -2 34 L 160 34"/>
          </g>
          <g stroke="${C.line}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M -50 96 l 14 8 6 -6 14 10"/><path d="M 6 44 l 12 10 -6 10 16 8 6 -8"/><path d="M 60 0 l 10 12 12 -4 8 14"/>
          </g>
        </g>
        <path d="M 52 -12 L 52 34 L -2 34 L -2 88 L -56 88 L -56 120" stroke="#7A2424" stroke-width="16" fill="none"/>
        <path d="M 52 -12 L 52 34 L -2 34 L -2 88 L -56 88 L -56 120" stroke="${C.line}" stroke-width="6" fill="none" stroke-linejoin="miter"/>
      </g>`;
    const chunk = (x, y, s, rot, col = '#D64545', shade = '#A83535') => `
      <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <path d="M 0 -20 L 34 -36 L 68 -20 L 34 -4 Z" fill="${col}" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M 0 -20 L 34 -4 L 34 40 L 0 24 Z" fill="${shade}" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M 34 -4 L 68 -20 L 68 24 L 34 40 Z" fill="#8A2C2C" stroke="${C.line}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M 8 0 l 10 8 -4 10" stroke="${C.line}" stroke-width="3" fill="none"/>
      </g>`;
    // the mined car as an item: a small glowing block with a car on its face, bobbing over the fist
    const itemCube = `
      <g transform="translate(486 262)">
        <ellipse cx="34" cy="78" rx="34" ry="8" fill="${C.lime}" opacity="0.5" filter="url(#blur6)"/>
        <g filter="url(#markerGlow)">${chunk(0, 0, 1.0, 0)}</g>
        <path d="M 6 6 L 12 0 L 22 4 L 28 12 L 28 22 L 6 12 Z" fill="#F4F1EA" opacity="0.9"/>
      </g>`;
    const cx = 600, cy = 400;
    const impact = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const r1 = 56, r2 = 150 + (i % 3) * 45;
      return `<path d="M ${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1} L ${cx + Math.cos(a) * r2} ${cy + Math.sin(a) * r2}" stroke="#FFF3C4" stroke-width="${7 - (i % 3) * 2}" stroke-linecap="round" opacity="0.85"/>`;
    }).join('');
    return page(1280, 720, `
      <rect width="1280" height="720" fill="url(#dusk)"/>
      <circle cx="960" cy="470" r="400" fill="url(#sun)"/>
      ${skyline(1280, 470, 11, 0.95, 0.4)}
      <path d="M 0 470 L 1280 470 L 1280 720 L 0 720 Z" fill="#2A1F38"/>
      <g stroke="#FFD93B" stroke-width="6" opacity="0.3">
        <path d="M 120 720 L 420 470"/><path d="M 600 720 L 660 470"/><path d="M 1040 720 L 880 470"/>
      </g>
      <ellipse cx="520" cy="660" rx="440" ry="60" fill="url(#lampPool)"/>
      <circle cx="${cx}" cy="${cy}" r="70" fill="#FFF3C4" opacity="0.35" filter="url(#soft)"/>
      ${impact}
      ${car}
      ${chunk(628, 300, 1.0, -18)}${chunk(752, 262, 0.85, 14)}${chunk(842, 336, 0.7, -26)}${chunk(560, 486, 0.6, 38)}
      ${character({ x: 360, y: 575, s: 1.02, look: 'you', expr: 'determined', punch: true, armR: [90, -4], armL: [-20, 130], legR: [30, -25], legL: [-28, 10], faceDx: 14 })}
      ${itemCube}
      <rect width="1280" height="720" fill="url(#vignette)"/>
      <text x="610" y="170" class="disp" font-size="160" fill="${C.yellow}" stroke="${C.line}" stroke-width="20" paint-order="stroke" transform="rotate(-4 610 170)">MINED.</text>
    `);
  },
};

(async () => {
  const want = process.argv.slice(2);
  const names = want.length ? want : Object.keys(pages);
  const browser = await chromium.launch();
  for (const name of names) {
    const html = pages[name]();
    const m = html.match(/width="(\d+)" height="(\d+)"/);
    const w = +m[1], h = +m[2];
    const pg = await browser.newPage({ viewport: { width: w, height: h } });
    await pg.setContent(html, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, `${name}.png`);
    await pg.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
    await pg.close();
    console.log('wrote', path.relative(process.cwd(), file));
  }
  await browser.close();
})();
