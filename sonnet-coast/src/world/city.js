// Sonnet City: merged tower meshes with PBR facades (box, tapered, round and hourglass forms),
// storefronts, roof gardens, lawns, glass domes and the landmark buildings.
import * as THREE from 'three';
import { CITY, POI } from './layout.js';
import { blocks, buildings, BUILDING_COLORS, DISTRICTS } from './cityplan.js';
import { KERB } from './roads.js';
import { Batch, FacadeBatch, ChunkedInstances } from './geom.js';
import { buildShopKit, BAY, LOBBY_BAY, SHOP_CEIL, LOBBY_CEIL } from './shops.js';
import { makeFacade, makeStorefronts, makeNoiseTexture, makeGround, makeCanvas, canvasToTexture, FACADE_STYLES, UI_FONT, SHOP_ROWS, SHOP_ATLAS_ROWS } from './textures.js';
import { addBox, addCircle } from './colliders.js';
import { setNeon, grain } from './citylight.js';
import { RNG } from '../util/rng.js';
import { PAL } from './palette.js';

// Soft accent lights used around the city (street furniture borrows these too).
export const NEON = { white: 0xf4f7ff, ice: 0xcfe9ff, warm: 0xffe6c4, coral: 0xff9a78 };
export const parkingSlots = [];   // {x, z, heading, kind}
export const parkSpots = [];      // {x, z} tree positions inside parks and plazas
export const benchSpots = [];     // {x, z, heading}
export const parkLamps = [];      // {x, z}
export const roofTrees = [];      // {x, y, z, s} trees growing on roofs and terraces
const GY = CITY.y + KERB;
const SHOP_H = 4.5;
const SHOP_DIST = 115;      // how far the real shopfronts are drawn (scaled down on lower presets)
const PIER = 4.1;            // solid corner left on a side wall next to a corner shop
export const shopNear = { value: 0 };

export function drawSpark(g, cx, cy, r, color, width = 0.16) {
  g.save();
  g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = r * width;
  const lens = [1, 0.72, 0.9, 0.66, 1, 0.75, 0.88, 0.7, 1, 0.68, 0.92, 0.74];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r * 0.14, cy + Math.sin(a) * r * 0.14);
    g.lineTo(cx + Math.cos(a) * r * lens[i], cy + Math.sin(a) * r * lens[i]);
    g.stroke();
  }
  g.restore();
}

// Public information screens: pale glass panels, dark type, one accent colour each.
const BILLBOARDS = [
  { bg: '#f5f1e8', fg: '#c8643b', big: 'CLAUDE', small: 'your co-pilot on the coast', spark: true },
  { bg: '#eaf3f7', fg: '#2f6f8f', big: 'SONNET COAST', small: 'sun · surf · safety' },
  { bg: '#f3efe6', fg: '#8a6a3a', big: 'THINK', small: 'step by step' },
  { bg: '#f5f1e8', fg: '#c8643b', big: 'HELPFUL', small: 'harmless · honest' },
  { bg: '#eef0f6', fg: '#5a5fa8', big: 'CLAUDE FM', small: '88.2 — the long context' },
  { bg: '#edf5ee', fg: '#3f7d55', big: 'OPUS ENERGY', small: 'now with extended thinking' },
  { bg: '#f4f2ee', fg: '#3a3c40', big: 'HAIKU EXPRESS', small: 'small. fast. on time.' },
  { bg: '#eaf1f8', fg: '#3a6ea8', big: 'STAY ALIGNED', small: 'constitutional AI is watching out for you' },
  { bg: '#f3eef5', fg: '#7a5a9a', big: 'TOKEN ROW', small: 'open late · every night' },
  { bg: '#f6f0e4', fg: '#b07a2a', big: 'RE-TUNE', small: 'new paint. clean record.' },
  { bg: '#e9f4f0', fg: '#2f7d6d', big: 'GLOWWOOD', small: 'visit the forest that looks back' },
  { bg: '#f6ecea', fg: '#b24a4a', big: 'TOKEN DOME', small: 'tonight: bots vs. humans' },
];
const BB_COLS = 2, BB_ROWS = 6;

function makeBillboardAtlas() {
  const c = makeCanvas(1024, BB_ROWS * 256);
  const g = c.getContext('2d');
  BILLBOARDS.forEach((b, i) => {
    const x = (i % BB_COLS) * 512, y = Math.floor(i / BB_COLS) * 256;
    g.fillStyle = b.bg; g.fillRect(x, y, 512, 256);
    g.fillStyle = b.fg; g.fillRect(x, y + 236, 512, 20);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let tx = x + 256;
    if (b.spark) { drawSpark(g, x + 96, y + 104, 60, b.fg); tx = x + 310; }
    let size = 92;
    const maxW = b.spark ? 330 : 450;
    g.font = `900 ${size}px ${UI_FONT}`;
    while (g.measureText(b.big).width > maxW && size > 30) { size -= 4; g.font = `900 ${size}px ${UI_FONT}`; }
    g.fillStyle = b.fg;
    g.fillText(b.big, tx, y + 100);
    g.font = `600 26px ${UI_FONT}`;
    g.fillStyle = '#3a3c40';
    g.fillText(b.small, x + 256, y + 186);
  });
  return canvasToTexture(c, { repeat: false, aniso: 8 });
}

export function makeScreenMaterial(map) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uMap: { value: null }, uTime: { value: 0 }, uBright: { value: 1 },
    }]),
    fog: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <common>
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vCityPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      uniform sampler2D uMap; uniform float uTime, uBright;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        vec3 c = texture2D(uMap, vUv).rgb;
        float scan = 0.97 + 0.03 * sin(vCityPos.y * 9.0 - uTime * 2.0);
        gl_FragColor = vec4(c * uBright * scan, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  mat.uniforms.uMap.value = map;
  return mat;
}

class QuadBatch {
  constructor() { this.pos = []; this.uv = []; this.nor = []; }
  // quad centred at c, spanning along unit vector r (width w) and up (height h)
  add(cx, cy, cz, rx, rz, w, h, uv) {
    const p = [
      [cx - rx * w / 2, cy - h / 2, cz - rz * w / 2], [cx + rx * w / 2, cy - h / 2, cz + rz * w / 2],
      [cx + rx * w / 2, cy + h / 2, cz + rz * w / 2], [cx - rx * w / 2, cy + h / 2, cz - rz * w / 2],
    ];
    const t = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
    for (const k of [0, 1, 2, 0, 2, 3]) { this.pos.push(...p[k]); this.uv.push(...t[k]); }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    return g;
  }
}

// White panel signage with dark lettering and a thin accent rule.
export function makeSignTexture(text, fg = '#c8643b', bg = '#f6f4ef', sub = '') {
  const c = makeCanvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.fillStyle = fg; g.fillRect(0, 118, 512, 10);
  g.fillStyle = '#25272b'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 58;
  g.font = `900 ${size}px ${UI_FONT}`;
  while (g.measureText(text).width > 470 && size > 20) { size -= 3; g.font = `900 ${size}px ${UI_FONT}`; }
  g.fillText(text, 256, sub ? 46 : 60);
  if (sub) { g.font = `600 22px ${UI_FONT}`; g.fillStyle = '#55585e'; g.fillText(sub, 256, 92); }
  return canvasToTexture(c, { repeat: false });
}

export function addSign(parent, text, x, y, z, heading, w = 14, fg = '#c8643b', sub = '') {
  const mat = new THREE.MeshBasicMaterial({ map: makeSignTexture(text, fg, undefined, sub), toneMapped: false, side: THREE.DoubleSide });
  mat.color.setScalar(0.92);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mat);
  m.position.set(x, y, z);
  m.rotation.y = heading;
  parent.add(m);
  return m;
}

// Flat slab top with world-space UVs (so paving tiles line up across blocks) plus kerb skirts.
function slabGeometry(rects, y0, y1, uvScale = 4) {
  const pos = [], nor = [], uv = [], idx = [];
  const v = (x, y, z, nx, ny, nz, u, w) => { pos.push(x, y, z); nor.push(nx, ny, nz); uv.push(u, w); return pos.length / 3 - 1; };
  for (const [x0, z0, x1, z1] of rects) {
    let a = v(x0, y1, z1, 0, 1, 0, x0 / uvScale, z1 / uvScale), b = v(x1, y1, z1, 0, 1, 0, x1 / uvScale, z1 / uvScale);
    let c = v(x1, y1, z0, 0, 1, 0, x1 / uvScale, z0 / uvScale), d = v(x0, y1, z0, 0, 1, 0, x0 / uvScale, z0 / uvScale);
    idx.push(a, b, c, a, c, d);
    const side = (ax, az, bx, bz, nx, nz) => {
      const len = Math.hypot(bx - ax, bz - az) / uvScale;
      a = v(ax, y0, az, nx, 0, nz, 0, 0); b = v(bx, y0, bz, nx, 0, nz, len, 0);
      c = v(bx, y1, bz, nx, 0, nz, len, 0.2); d = v(ax, y1, az, nx, 0, nz, 0, 0.2);
      idx.push(a, b, c, a, c, d);
    };
    side(x0, z1, x1, z1, 0, 1); side(x1, z0, x0, z0, 0, -1); side(x1, z1, x1, z0, 1, 0); side(x0, z0, x0, z1, -1, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function makePavingTexture() {
  const S = 256, c = makeCanvas(S, S), r = makeCanvas(S / 2, S / 2);
  const g = c.getContext('2d'), gr = r.getContext('2d');
  gr.scale(0.5, 0.5);
  const rng = new RNG(88);
  g.fillStyle = '#9a968e'; g.fillRect(0, 0, S, S);
  gr.fillStyle = 'rgb(255,200,0)'; gr.fillRect(0, 0, S, S);
  const n = 4, t = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = rng.int(-9, 9);
    g.fillStyle = `rgb(${172 + v},${170 + v},${164 + v})`;
    g.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3);
    gr.fillStyle = `rgb(255,${rng.int(140, 205)},0)`; gr.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3);
  }
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${rng.float(0.02, 0.06)})`; g.fillRect(rng.float(0, S), rng.float(0, S), 3, 3); }
  return { map: canvasToTexture(c), rough: canvasToTexture(r, { srgb: false }) };
}

// Rooms behind the glass. Wherever the facade texture marks glass, the shader traces the view
// ray into a box one bay wide and one floor tall and shades whatever it hits: back wall with a
// door and a picture, side walls, floor, ceiling lamp, a desk standing mid-room, blinds or
// curtains. Rooms are lit or dark by their own hash, more of them after sunset.
const ROOMS_GLSL = /* glsl */`
float glassK = 0.0;
{
  glassK = 1.0 - texture2D( roughnessMap, vRoughnessMapUv ).r;
  if ( glassK > 0.02 ) {
    vec2 cuv = vMapUv * 8.0;
    vec2 cell = floor( cuv );
    vec2 f = fract( cuv );
    float h1 = fract( sin( dot( cell, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
    float h2 = fract( h1 * 37.17 + 0.31 );
    float h3 = fract( h1 * 91.7 + 0.73 );
    vec3 vdir = normalize( vViewPosition );
    vec3 tT = tbn[ 0 ], tB = tbn[ 1 ];
    float tl = dot( tT, tT ), bl = dot( tB, tB );
    tT = tl > 1e-16 ? tT * inversesqrt( tl ) : vec3( 1.0, 0.0, 0.0 );
    tB = bl > 1e-16 ? tB * inversesqrt( bl ) : vec3( 0.0, 1.0, 0.0 );
    vec3 d = - vec3( dot( vdir, tT ), dot( vdir, tB ), dot( vdir, tbn[ 2 ] ) );
    d.z = min( d.z, - 0.06 );
    // never divide by a zero component
    d.x = abs( d.x ) < 1e-4 ? 1e-4 : d.x;
    d.y = abs( d.y ) < 1e-4 ? 1e-4 : d.y;
    const float DEPTH = 1.25;
    vec3 o = vec3( f, 0.0 );
    vec3 tm = vec3( ( ( d.x > 0.0 ? 1.0 : 0.0 ) - o.x ) / d.x, ( ( d.y > 0.0 ? 1.0 : 0.0 ) - o.y ) / d.y, - DEPTH / d.z );
    float t = min( tm.x, min( tm.y, tm.z ) );
    vec3 hit = o + d * t;
    float dep = clamp( - hit.z / DEPTH, 0.0, 1.0 );
    vec3 wallCol = mix( vec3( 0.80, 0.77, 0.70 ), mix( vec3( 0.60, 0.69, 0.74 ), vec3( 0.78, 0.64, 0.52 ), h2 ), step( 0.55, h3 ) * 0.7 );
    vec3 rc;
    if ( t == tm.z ) {
      rc = wallCol * 0.92;
      if ( abs( hit.x - ( 0.25 + h2 * 0.5 ) ) < 0.11 && hit.y < 0.62 ) rc = vec3( 0.36, 0.26, 0.18 );
      vec2 pc = abs( hit.xy - vec2( 0.72 - h2 * 0.45, 0.62 ) );
      if ( pc.x < 0.1 && pc.y < 0.09 ) rc = mix( vec3( 0.2, 0.3, 0.42 ), vec3( 0.7, 0.4, 0.25 ), h3 );
    } else if ( t == tm.x ) {
      rc = wallCol * 0.8;
    } else if ( d.y > 0.0 ) {
      rc = vec3( 0.7, 0.69, 0.66 );
      vec2 lc = abs( vec2( hit.x - 0.5, dep - 0.45 ) );
      if ( lc.x < 0.22 && lc.y < 0.08 ) rc = vec3( 2.4 );
    } else {
      rc = mix( vec3( 0.42, 0.32, 0.24 ), vec3( 0.34, 0.35, 0.38 ), step( 0.5, h2 ) ) * ( 0.9 + 0.1 * step( 0.5, fract( hit.x * 5.0 ) ) );
    }
    rc *= 1.0 - 0.45 * dep;
    rc *= 0.74 + 0.26 * smoothstep( 0.0, 0.3, min( hit.y, 1.0 - hit.y ) * 2.0 );
    float tp = - 0.6 * DEPTH / d.z;
    if ( tp < t ) {
      vec2 q = o.xy + d.xy * tp;
      float cx = 0.3 + h3 * 0.4;
      if ( q.y > 0.0 && ( ( abs( q.x - cx ) < 0.2 && q.y < 0.24 ) || ( abs( q.x - cx - 0.26 ) < 0.045 && q.y < 0.5 ) ) ) rc = mix( vec3( 0.2, 0.17, 0.15 ), vec3( 0.3, 0.33, 0.36 ), h2 ) * 0.7;
    }
    float cover = 0.0;
    vec3 coverCol = vec3( 0.86, 0.84, 0.78 );
    if ( h1 < 0.3 ) {
      if ( f.y > 0.75 - h2 * 0.6 ) { cover = 0.93; coverCol *= 0.8 + 0.2 * step( 0.5, fract( f.y * 22.0 ) ); }
    } else if ( h1 < 0.5 ) {
      if ( abs( f.x - 0.5 ) > 0.3 + h2 * 0.1 ) { cover = 0.95; coverCol = mix( vec3( 0.7, 0.62, 0.5 ), vec3( 0.5, 0.56, 0.62 ), h3 ) * ( 0.85 + 0.15 * sin( f.x * 90.0 ) ); }
    }
    float nightK = clamp( ( emissive.r - 0.02 ) / 0.8, 0.0, 1.0 );
    float litRoom = step( h3, 0.18 + ( 0.14 + 0.45 * fract( cell.y * 0.37 + 0.2 ) ) * nightK );
    vec3 lamp = mix( vec3( 1.0, 0.86, 0.66 ), vec3( 0.86, 0.94, 1.0 ), step( 0.78, h2 ) );
    float light = ( 1.0 - nightK ) * ( 0.1 + 0.1 * h2 ) * ( 1.0 - 0.5 * dep ) + litRoom * ( 0.1 + 0.5 * nightK ) * ( 0.75 + 0.5 * h1 );
    vec3 inside = mix( rc, coverCol, cover ) * mix( vec3( 1.0 ), lamp, litRoom ) * light;
    float tiny = smoothstep( 0.2, 0.7, max( fwidth( cuv.x ), fwidth( cuv.y ) ) );
    inside = mix( inside, vec3( 0.52, 0.48, 0.42 ) * ( ( 1.0 - nightK ) * 0.12 + ( 0.2 + 0.3 * nightK ) * ( 0.1 + 0.7 * nightK ) * 0.7 ), tiny );
    inside *= vec3( 0.84, 0.93, 0.96 );
    float fres = 0.1 + 0.9 * pow( 1.0 - max( dot( vdir, tbn[ 2 ] ), 0.0 ), 5.0 );
    totalEmissiveRadiance = mix( totalEmissiveRadiance, inside * ( 1.0 - fres ), glassK );
    diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.015, 0.02, 0.025 ), glassK );
    metalnessFactor = mix( metalnessFactor, 0.0, glassK );
    roughnessFactor = mix( roughnessFactor, 0.05, glassK );
  }
}
`;
function withRooms(mat) {
  mat.onBeforeCompile = function (shader, renderer) {
    THREE.Material.prototype.onBeforeCompile.call(this, shader, renderer);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + ROOMS_GLSL)
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n  material.specularColor = mix( material.specularColor, vec3( 0.17 ), glassK );');
  };
  mat.customProgramCacheKey = () => 'rooms';
  return mat;
}

export function buildCity(scene, env) {
  const group = new THREE.Group();
  group.name = 'city';
  const rng = new RNG(909);

  const facades = {};
  for (const s of FACADE_STYLES) facades[s] = new FacadeBatch(28);
  const shopB = { pos: [], nor: [], uv: [], col: [] };
  const roofs = new Batch();      // roof slabs, plant, decks (vertex coloured, matte)
  const trim = new Batch();       // white structure: ring decks, ribs, fins (slightly glossy)
  const glow = { white: new Batch(), ice: new Batch(), warm: new Batch(), coral: new Batch() };
  const pools = new Batch();
  const frames = new Batch();
  const screens = new QuadBatch();
  const WHITE = 0xf2f3f4, DECK = 0xe6e7e9, ROOF = 0x8d9096, LAWN = 0x4a8a3c;
  const GREENS = [0x3f7a35, 0x4a8a3c, 0x376b33, 0x55913f, 0x426f3a];

  // Painted ground-floor strip. The vertex colour doubles as a flag: pure white fades out near the
  // camera (a real shopfront stands behind it), anything else always draws.
  const KEEP = [0.99, 0.99, 0.99], FADE = [1, 1, 1];
  const shopQuad = (ax, az, bx, bz, nx, nz, nx2, nz2, row, u0, u1, col, y0 = 0, y1 = SHOP_H, o = 0.07) => {
    const p = [[ax + nx * o, GY + y0, az + nz * o], [bx + nx2 * o, GY + y0, bz + nz2 * o], [bx + nx2 * o, GY + y1, bz + nz2 * o], [ax + nx * o, GY + y1, az + nz * o]];
    const vb = 1 - (row + 1) / SHOP_ATLAS_ROWS + 0.002, vt = 1 - row / SHOP_ATLAS_ROWS - 0.002;
    const v0 = vb + (vt - vb) * (y0 / SHOP_H), v1 = vb + (vt - vb) * (y1 / SHOP_H);
    const t = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    const n = [[nx, nz], [nx2, nz2], [nx2, nz2], [nx, nz]];
    for (const k of [0, 1, 2, 0, 2, 3]) { shopB.pos.push(...p[k]); shopB.nor.push(n[k][0], 0, n[k][1]); shopB.uv.push(...t[k]); shopB.col.push(col[0], col[1], col[2]); }
  };
  const shopWall = (ax, az, bx, bz, nx, nz, row, uOff, col, o = 0.07) => shopQuad(ax, az, bx, bz, nx, nz, nx, nz, row, uOff, uOff + Math.hypot(bx - ax, bz - az) / 36, col, 0, SHOP_H, o);

  // ---- real shopfronts ---------------------------------------------------------------------
  // Every bay of a street-facing ground floor gets a frame, glass and a furnished interior,
  // instanced and only drawn near the camera; the painted strip above is its distant stand-in.
  const kit = buildShopKit();
  const shopFrameMat = grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.4 }), 1.4, 0.25, 0.1);
  const shopGlass = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.03, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 1.25, fog: false });
  const insideMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  for (const ch of ['r', 'g', 'b']) env.nightLerp(insideMat.color, ch, 0.92, 0.8);
  const awningMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  const shopOpts = { chunk: 110, maxDist: SHOP_DIST };
  const shopCI = {};
  for (const k of ['shop', 'lobby']) {
    const K = kit[k];
    shopCI[k] = { frame: new ChunkedInstances(K.frame, shopFrameMat, shopOpts), glass: new ChunkedInstances(K.glass, shopGlass, shopOpts), interiors: {} };
    if (K.awning) shopCI[k].awning = new ChunkedInstances(K.awning, awningMat, { ...shopOpts, colors: true, shadow: true });
    for (const name of Object.keys(K.interiors)) shopCI[k].interiors[name] = new ChunkedInstances(K.interiors[name], insideMat, shopOpts);
  }
  const _bm = new THREE.Matrix4(), _bs = new THREE.Matrix4(), _bc = new THREE.Color();
  let bayCount = 0;
  const addBay = (lobby, info, x, z, nx, nz, sx) => {
    _bm.makeRotationY(Math.atan2(nx, nz)); _bs.makeScale(sx, 1, 1); _bm.multiply(_bs); _bm.setPosition(x, GY, z);
    const K = lobby ? shopCI.lobby : shopCI.shop;
    K.frame.add(_bm); K.glass.add(_bm); K.interiors[info[2]].add(_bm);
    if (K.awning && (bayCount * 7) % 5 < 2) K.awning.add(_bm, _bc.set(info[1]).lerp(new THREE.Color(0xf2efe8), 0.25));
    bayCount++;
  };
  // One wall of a building, cut into whole bays. m0 / m1 are solid piers left at the ends where
  // the neighbouring wall's corner shop already fills the space behind.
  const shopFace = (f, row, m0, m1) => {
    const L = Math.hypot(f.bx - f.ax, f.bz - f.az);
    const lobby = row === 2, nominal = lobby ? LOBBY_BAY : BAY, tb = lobby ? 4 : 6, ceil = lobby ? LOBBY_CEIL : SHOP_CEIL;
    const usable = L - m0 - m1;
    if (usable < nominal * 0.72) { shopWall(f.ax, f.az, f.bx, f.bz, f.nx, f.nz, row, rng.float(0, 1), KEEP, 0); return; }
    const n = Math.max(1, Math.round(usable / nominal)), w = usable / n;
    const tx = (f.bx - f.ax) / L, tz = (f.bz - f.az) / L;
    const k0 = rng.int(0, tb - 1);
    const pier = (s0, s1) => shopQuad(f.ax + tx * s0, f.az + tz * s0, f.ax + tx * s1, f.az + tz * s1, f.nx, f.nz, f.nx, f.nz, row, k0 / tb - 0.005, k0 / tb + 0.005, KEEP, 0, SHOP_H, 0);
    if (m0 > 0) pier(0, m0);
    if (m1 > 0) pier(L - m1, L);
    for (let i = 0; i < n; i++) {
      const a = (k0 + i) % tb, s0 = m0 + i * w, s1 = s0 + w;
      const x0 = f.ax + tx * s0, z0 = f.az + tz * s0, x1 = f.ax + tx * s1, z1 = f.az + tz * s1;
      shopQuad(x0, z0, x1, z1, f.nx, f.nz, f.nx, f.nz, row, a / tb, (a + 1) / tb, KEEP, ceil, SHOP_H, 0);   // sign band
      shopQuad(x0, z0, x1, z1, f.nx, f.nz, f.nx, f.nz, row, a / tb, (a + 1) / tb, FADE, 0, ceil, 0);        // window, far view only
      addBay(lobby, SHOP_ROWS[row][a], x0, z0, f.nx, f.nz, w / nominal);
    }
  };
  const shopRing = (cx, cz, r, row) => {
    const seg = 28, reps = Math.max(1, Math.round((2 * Math.PI * r) / 36));
    for (let i = 0; i < seg; i++) {
      // walk clockwise seen from above so that, from outside, u runs left to right
      const a0 = -(i / seg) * Math.PI * 2, a1 = -((i + 1) / seg) * Math.PI * 2;
      shopQuad(cx + Math.cos(a0) * r, cz + Math.sin(a0) * r, cx + Math.cos(a1) * r, cz + Math.sin(a1) * r, Math.cos(a0), Math.sin(a0), Math.cos(a1), Math.sin(a1), row, (i / seg) * reps, ((i + 1) / seg) * reps, KEEP);
    }
  };

  // ---- facade relief ------------------------------------------------------------------------
  // Real geometry standing proud of the wall plane: piers on the bay lines, ledges and sunshades
  // on the floor lines, cornices, and balconies on the apartment towers. Bay and floor positions
  // are worked out from the same texture offsets the wall uses, so the solid parts land on the
  // painted ones.
  const relief = new Batch();
  const FLOOR = 3.5;
  const balconyGeo = (() => {
    const b = new Batch();
    b.box(2.7, 0.12, 1.1, 0, 0, 0.5, 0xd9d6cf);                                        // slab
    b.box(2.7, 0.86, 0.03, 0, 0.12, 1.03, 0xa9c0cc);                                   // glass front
    b.box(2.76, 0.04, 1.1, 0, 0.98, 0.52, 0x3a3c41);                                   // handrail, seen edge-on
    return b.merged();
  })();
  const balconies = new ChunkedInstances(balconyGeo, grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.2 }), 1.2, 0.2, 0.08), { chunk: 130, maxDist: 170, shadow: true });
  const _cc = new THREE.Color();
  const hexOf = (c, k = 1) => _cc.setRGB(Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)).getHex();
  const addRelief = (style, x0, z0, x1, z1, yb, yt, col, uOff, top) => {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = yt - yb;
    if (h < 6) return;
    const wall = hexOf(col, 0.96), pale = hexOf(col, 1.04);
    const ring = (y, p, th, hex) => relief.box(w + p * 2, th, d + p * 2, cx, y, cz, hex);
    // the four faces in the order and direction the wall builder lays them out
    const faces = [[x1, z1, 0, -1, 1, 0, d], [x0, z0, 0, 1, -1, 0, d], [x0, z1, 1, 0, 0, 1, w], [x1, z0, -1, 0, 0, -1, w]];
    const onBays = (step, half, fn) => {
      for (const [sx, sz, tx, tz, nx, nz, L] of faces) {
        const first = ((((half ? 0.5 : 0) / 8 - uOff) * 28) % FLOOR + FLOOR) % FLOOR;
        let k = 0;
        for (let q = first; q < L - 0.3; q += FLOOR, k++) if (q > 0.3 && k % step === 0) fn(sx + tx * q, sz + tz * q, nx, nz, tx);
      }
    };
    const pier = (pw, pd, hex) => onBays(1, false, (x, z, nx, nz, tx) => relief.box(tx ? pw : pd, h, tx ? pd : pw, x + nx * (pd / 2 - 0.03), yb, z + nz * (pd / 2 - 0.03), hex));
    const floor0 = Math.ceil((yb - 0.2) / FLOOR) * FLOOR;
    if (style === 'bands') {
      for (let y = floor0; y < yt - 0.5; y += FLOOR) ring(y - 0.06, 0.5, 0.14, pale);          // sunshades on every floor
    } else if (style === 'grid') {
      onBays(2, false, (x, z, nx, nz, tx) => relief.box(tx ? 0.55 : 0.3, h, tx ? 0.3 : 0.55, x + nx * 0.12, yb, z + nz * 0.12, pale));
      for (let y = floor0 + FLOOR * 4, k = 0; y < yt - 3; y += FLOOR * 4, k++) ring(y - 0.15, 0.32, 0.3, pale);
      if (top) { ring(yt - 0.5, 0.55, 0.5, pale); ring(yt - 0.9, 0.3, 0.4, wall); }
    } else if (style === 'brick') {
      if (top) { ring(yt - 0.45, 0.5, 0.45, 0xd9d2c2); ring(yt - 0.8, 0.28, 0.35, 0xc9c2b2); }
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) relief.box(0.7, h, 0.7, px, yb, pz, hexOf(col, 0.9));   // quoins
    } else if (style === 'fins') {
      pier(0.36, 0.5, pale);
      onBays(1, true, (x, z, nx, nz) => {
        for (let y = floor0 + FLOOR; y < yt - 2; y += FLOOR) {
          _bm.makeRotationY(Math.atan2(nx, nz)); _bm.setPosition(x, y + 0.02, z);
          balconies.add(_bm);
        }
      });
    } else if (style === 'panel') {
      for (let y = floor0 + FLOOR * 2; y < yt - 1; y += FLOOR * 2) ring(y - 0.05, 0.16, 0.1, 0xeef1f3);
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) relief.box(0.4, h, 0.4, px, yb, pz, 0xdfe3e6);
    } else if (style === 'glass') {
      onBays(2, false, (x, z, nx, nz, tx) => relief.box(tx ? 0.1 : 0.22, h, tx ? 0.22 : 0.1, x + nx * 0.09, yb, z + nz * 0.09, 0xe9edf0));
    }
  };

  // the soft light each block face throws onto the street
  const faceGlow = new Map();
  const addGlow = (block, face, hex, w) => {
    const k = `${block.i},${block.j},${face}`;
    const c = new THREE.Color(hex);
    const e = faceGlow.get(k) || { r: 0, g: 0, b: 0, w: 0 };
    e.r += c.r * w; e.g += c.g * w; e.b += c.b * w; e.w += w;
    faceGlow.set(k, e);
  };
  const shopHue = (row) => (row === 2 ? 0xdcecff : row === 1 ? 0xffe2bd : 0xfff0dc);
  // scatter n trees inside a disc
  const plantDisc = (cx, cz, y, radius, n, sMin = 0.5, sMax = 0.85) => {
    for (let k = 0; k < n; k++) {
      const a = rng.float(0, 6.283), d = Math.sqrt(rng.next()) * radius;
      roofTrees.push({ x: cx + Math.cos(a) * d, y, z: cz + Math.sin(a) * d, s: rng.float(sMin, sMax) });
    }
  };

  for (const block of blocks) {
    const line = { x0: block.x0 + 4.5, x1: block.x1 - 4.5, z0: block.z0 + 4.5, z1: block.z1 - 4.5 };
    for (let bi = block.first; bi < block.last; bi++) {
      const b = buildings[bi];
      const col = BUILDING_COLORS[b.color];
      const fb = facades[b.style] || facades.glass;
      const uOff = rng.float(0, 1);
      const accent = b.accent ? new THREE.Color(...BUILDING_COLORS[b.accent]).getHex() : null;
      const circular = b.shape === 'round' || b.shape === 'hyper';
      const custom = b.kind === 'tower';
      const LAWN = GREENS[bi % GREENS.length];
      let topW, topD, tcx = b.cx, tcz = b.cz;
      const ry = GY + b.h + 0.7;

      // ---- walls ----
      if (custom) {
        // drawn below with the other landmark parts
      } else if (b.shape === 'round') {
        b.tiers.forEach((t, k) => {
          fb.revolve(b.cx, b.cz, [[t.r0, GY + t.y0], [t.r1, GY + t.y1]], col, uOff);
          // each stage ends in a white ring deck, like a collar
          trim.cyl(t.r1 + 1.3, t.r1 + 1.3, 0.55, b.cx, GY + t.y1, b.cz, WHITE, 28);
          if (k < b.tiers.length - 1) {
            // planted terrace where the tower steps in
            const inner = b.tiers[k + 1].r0;
            roofs.cyl(t.r1 + 0.9, t.r1 + 0.9, 0.12, b.cx, GY + t.y1 + 0.55, b.cz, LAWN, 28);
            if (t.r1 - inner > 2.4) for (let q = 0; q < 7; q++) { const a = (q / 7) * 6.283 + uOff * 6; roofTrees.push({ x: b.cx + Math.cos(a) * (t.r1 + inner) / 2, y: GY + t.y1 + 0.6, z: b.cz + Math.sin(a) * (t.r1 + inner) / 2, s: 0.42 }); }
          }
        });
        if (accent && b.h > 30) trim.cyl(b.r + 0.5, b.r + 0.5, 0.8, b.cx, GY + Math.min(b.h * 0.33, 24), b.cz, accent, 28);
        topW = topD = b.topR * 1.6;
      } else if (b.shape === 'hyper') {
        fb.revolve(b.cx, b.cz, b.profile.map(([r, y]) => [r, GY + y]), col, uOff, 32);
        trim.cyl(b.topR + 1.0, b.topR + 0.2, 1.2, b.cx, GY + b.h - 0.4, b.cz, WHITE, 32);
        trim.cyl(b.r + 0.8, b.r + 1.4, 1.0, b.cx, GY, b.cz, WHITE, 32);
        topW = topD = b.topR * 1.6;
      } else {
        for (const t of b.tiers) {
          // the ground floor of a building with shops is all shopfront, so its wall starts above it
          const lift = t === b.tiers[0] && b.shop >= 0 && t.y1 - t.y0 > SHOP_H + 2 ? SHOP_H : 0;
          if (t.ins) { const q = (t.ins * lift) / (t.y1 - t.y0); fb.wallFrustum(t.x0 + q, GY + t.y0 + lift, t.z0 + q, t.x1 - q, GY + t.y1, t.z1 - q, t.ins - q, col, uOff); }
          else fb.wallBox(t.x0, GY + t.y0 + lift, t.z0, t.x1, GY + t.y1, t.z1, col, uOff);
          // a projecting course over the shopfronts closes the joint and throws a shadow line
          if (lift) trim.box(t.x1 - t.x0 + 0.5, 0.2, t.z1 - t.z0 + 0.5, (t.x0 + t.x1) / 2, GY + SHOP_H - 0.06, (t.z0 + t.z1) / 2, 0xe4e2dc);
          if (!t.ins && fb !== facades.diagrid) addRelief(b.style, t.x0, t.z0, t.x1, t.z1, GY + t.y0 + lift, GY + t.y1, col, uOff, t === b.tiers[b.tiers.length - 1]);
          const i2 = t.ins || 0;
          const last = t === b.tiers[b.tiers.length - 1];
          const green = !last && b.roof === 'garden';
          roofs.box(t.x1 - t.x0 - i2 * 2 + 0.5, 0.7, t.z1 - t.z0 - i2 * 2 + 0.5, (t.x0 + t.x1) / 2, GY + t.y1, (t.z0 + t.z1) / 2, green ? LAWN : ROOF);
          // a crisp white parapet line on every stage
          trim.box(t.x1 - t.x0 - i2 * 2 + 0.9, 0.3, t.z1 - t.z0 - i2 * 2 + 0.9, (t.x0 + t.x1) / 2, GY + t.y1 + 0.5, (t.z0 + t.z1) / 2, WHITE);
          if (green) {
            const nx = b.tiers[b.tiers.indexOf(t) + 1];
            if (nx && nx.x0 - t.x0 > 2.4) for (const [px, pz] of [[(t.x0 + nx.x0) / 2, (t.z0 + nx.z0) / 2], [(t.x1 + nx.x1) / 2, (t.z0 + nx.z0) / 2], [(t.x0 + nx.x0) / 2, (t.z1 + nx.z1) / 2], [(t.x1 + nx.x1) / 2, (t.z1 + nx.z1) / 2]]) roofTrees.push({ x: px, y: GY + t.y1 + 0.7, z: pz, s: 0.45 });
          }
        }
        const top = b.tiers[b.tiers.length - 1], i2 = top.ins || 0;
        topW = top.x1 - top.x0 - i2 * 2; topD = top.z1 - top.z0 - i2 * 2;
        tcx = (top.x0 + top.x1) / 2; tcz = (top.z0 + top.z1) / 2;
        if (accent && b.h > 24) {
          // one coloured fin running up a corner
          const base = b.tiers[0];
          trim.box(1.1, Math.min(b.h, base.y1 - base.y0) * 0.92, 1.1, base.x0 - 0.1, GY, base.z1 + 0.1, accent);
        }
      }

      // ---- ground floor ----
      const base = b.tiers[0];
      let street = [];
      if (circular) {
        const R = b.r;
        const near = [['w', b.cx - R - line.x0], ['e', line.x1 - (b.cx + R)], ['n', b.cz - R - line.z0], ['s', line.z1 - (b.cz + R)]].filter((q) => q[1] < 12).map((q) => q[0]);
        if (b.shop >= 0) { shopRing(b.cx, b.cz, R + (b.shape === 'hyper' ? 1.45 : 0.02), b.shop === 3 ? 2 : b.shop === 0 && bi % 2 ? 4 : b.shop === 1 && bi % 2 ? 5 : b.shop); for (const f of near) addGlow(block, f, shopHue(b.shop), 0.6); }
      } else if (!custom) {
        const faces = [
          { f: 'w', on: Math.abs(base.x0 - line.x0) < 9, ax: base.x0, az: base.z0, bx: base.x0, bz: base.z1, nx: -1, nz: 0 },
          { f: 'e', on: Math.abs(base.x1 - line.x1) < 9, ax: base.x1, az: base.z1, bx: base.x1, bz: base.z0, nx: 1, nz: 0 },
          { f: 'n', on: Math.abs(base.z0 - line.z0) < 9, ax: base.x1, az: base.z0, bx: base.x0, bz: base.z0, nx: 0, nz: -1 },
          { f: 's', on: Math.abs(base.z1 - line.z1) < 9, ax: base.x0, az: base.z1, bx: base.x1, bz: base.z1, nx: 0, nz: 1 },
        ];
        street = faces.filter((f) => f.on);
        if (b.shop >= 0) {
          const lifted = base.y1 - base.y0 > SHOP_H + 2;
          const row = b.shop === 0 && bi % 2 ? 4 : b.shop === 1 && bi % 2 ? 5 : b.shop;
          const live = (f) => f.on && row !== 3 && lifted;
          const by = {};
          for (const f of faces) by[f.f] = f;
          for (const f of faces) {
            if (!live(f)) { shopWall(f.ax, f.az, f.bx, f.bz, f.nx, f.nz, f.on ? row : 3, rng.float(0, 1), f.on ? KEEP : [0.7, 0.7, 0.7], lifted ? 0 : 0.07); continue; }
            // the east-west walls own the corners; the north-south ones stop a pier short of them
            let m0 = 0, m1 = 0;
            if (f.f === 'w') { if (live(by.n)) m0 = PIER; if (live(by.s)) m1 = PIER; }
            if (f.f === 'e') { if (live(by.s)) m0 = PIER; if (live(by.n)) m1 = PIER; }
            shopFace(f, row, m0, m1);
            addGlow(block, f.f, shopHue(b.shop), b.shop === 2 ? 0.5 : 0.7);
          }
        }
      }

      // ---- roofs ----
      if (!custom) {
        const tw = topW, td = topD;
        if (b.roof === 'garden' && tw > 8 && td > 8) {
          if (circular) { roofs.cyl(tw * 0.56, tw * 0.56, 0.25, tcx, ry - 0.1, tcz, LAWN, 24); plantDisc(tcx, tcz, ry + 0.1, tw * 0.46, Math.max(3, Math.round(tw / 4)), 0.5, 0.95); }
          else { roofs.box(tw * 0.8, 0.25, td * 0.8, tcx, ry, tcz, LAWN); for (let k = 0; k < Math.max(2, Math.round((tw * td) / 130)); k++) roofTrees.push({ x: tcx + rng.float(-0.33, 0.33) * tw, y: ry + 0.2, z: tcz + rng.float(-0.33, 0.33) * td, s: rng.float(0.45, 0.85) }); }
        } else if (b.roof === 'plant' || b.roof === 'vents') {
          const n = b.roof === 'vents' ? 5 : 3;
          for (let k = 0; k < n; k++) {
            const w = rng.float(2, Math.max(2.2, Math.min(6, tw * 0.3))), d = rng.float(2, Math.max(2.2, Math.min(6, td * 0.3)));
            roofs.box(w, rng.float(1.2, 3.0), d, tcx + rng.float(-0.3, 0.3) * tw, ry, tcz + rng.float(-0.3, 0.3) * td, 0xc9ccd0);
          }
          if (b.roof === 'vents') roofs.cyl(0.5, 0.5, 4, tcx + tw * 0.3, ry, tcz - td * 0.3, 0xb0b4b9, 8);
        } else if (b.roof === 'pool' && tw > 12 && td > 12) {
          roofs.box(tw * 0.8, 0.2, td * 0.8, tcx, ry, tcz, DECK);
          pools.box(tw * 0.42, 0.12, td * 0.3, tcx, ry + 0.2, tcz, 0xffffff);
          roofTrees.push({ x: tcx - tw * 0.3, y: ry + 0.2, z: tcz - td * 0.3, s: 0.5 }, { x: tcx + tw * 0.3, y: ry + 0.2, z: tcz + td * 0.3, s: 0.55 });
        } else if (b.roof === 'helipad' && tw > 16 && td > 16) {
          roofs.cyl(7, 7, 0.3, tcx, ry, tcz, 0x4a4c52, 20);
          roofs.box(0.7, 0.06, 5, tcx - 1.6, ry + 0.3, tcz, WHITE); roofs.box(0.7, 0.06, 5, tcx + 1.6, ry + 0.3, tcz, WHITE); roofs.box(3.2, 0.06, 0.7, tcx, ry + 0.3, tcz, WHITE);
          for (let k = 0; k < 8; k++) glow.warm.sphere(0.2, tcx + Math.cos(k * 0.785) * 6.6, ry + 0.4, tcz + Math.sin(k * 0.785) * 6.6, 0xffffff, 1, 1, 1, 0);
        } else if (b.roof === 'tank' && tw > 7 && td > 7) {
          const x = tcx + tw * 0.2, z = tcz - td * 0.2;
          for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) roofs.cyl(0.1, 0.1, 2.2, x + dx * 1.1, ry, z + dz * 1.1, 0x8a8d92, 5);
          roofs.cyl(1.6, 1.6, 2.6, x, ry + 2.2, z, 0xd9d2c4, 10);
          roofs.cone(1.9, 1.0, x, ry + 4.8, z, 0xb9b2a4, 10);
        }
        if (b.spire) {
          const sh = b.h * 0.2;
          trim.cyl(0.18, 0.7, sh, tcx, ry, tcz, WHITE, 6);
          glow.white.sphere(0.55, tcx, ry + sh + 0.4, tcz, 0xffffff, 1, 1, 1, 0);
        }
        // a quiet line of light around the crown
        if (b.halo) {
          const hb = b.district === 'ocean' || b.district === 'oldtown' ? glow.warm : rng.chance(0.5) ? glow.white : glow.ice;
          if (circular) { const g = new THREE.TorusGeometry(b.topR + (b.shape === 'hyper' ? 1.1 : 1.4), 0.16, 5, 40); g.rotateX(Math.PI / 2); hb.add(g, 0xffffff, tcx, GY + b.h + 0.3, tcz); }
          else {
            const y = GY + b.h + 0.86, th = 0.16;
            hb.box(tw + 1.0, th, 0.16, tcx, y, tcz - td / 2 - 0.42, 0xffffff); hb.box(tw + 1.0, th, 0.16, tcx, y, tcz + td / 2 + 0.42, 0xffffff);
            hb.box(0.16, th, td + 1.0, tcx - tw / 2 - 0.42, y, tcz, 0xffffff); hb.box(0.16, th, td + 1.0, tcx + tw / 2 + 0.42, y, tcz, 0xffffff);
          }
        }
        if (b.billboard && !circular) {
          const top = b.tiers[b.tiers.length - 1];
          const side = rng.int(0, 3);
          const heading = [0, Math.PI / 2, Math.PI, -Math.PI / 2][side];
          const fx = Math.sin(heading), fz = Math.cos(heading);
          const span = side % 2 === 0 ? tw : td;
          const w = Math.min(22, Math.max(10, span * 0.75)), h = w / 2;
          const ex = side % 2 === 0 ? td / 2 : tw / 2;
          const cx = tcx + fx * (ex - 0.6), cz = tcz + fz * (ex - 0.6), cy = ry + 2.2 + h / 2;
          const idx = rng.int(0, BILLBOARDS.length - 1);
          const u0 = (idx % BB_COLS) / BB_COLS, v1 = 1 - Math.floor(idx / BB_COLS) / BB_ROWS;
          screens.add(cx + fx * 0.3, cy, cz + fz * 0.3, Math.cos(heading), -Math.sin(heading), w, h, [u0, v1 - 1 / BB_ROWS, u0 + 1 / BB_COLS, v1]);
          frames.box(w + 0.6, h + 0.6, 0.4, cx, cy - h / 2 - 0.3, cz, 0xdfe1e4, heading);
          const rx = Math.cos(heading), rz = -Math.sin(heading);
          for (const s of [-0.35, 0.35]) frames.box(0.4, 2.6, 0.4, cx + rx * w * s, ry - 0.2, cz + rz * w * s, 0xdfe1e4);
          void top;
        }
      }
      if (circular) addCircle(b.cx, b.cz, b.r + (b.shape === 'hyper' ? 1.4 : 0), 0, GY + b.h, { building: b });
      else addBox(b.x0, b.z0, b.x1, b.z1, 0, GY + b.h, { building: b });
      void street;
    }
  }

  // ---- facade materials -------------------------------------------------------
  FACADE_STYLES.forEach((style, i) => {
    if (!facades[style].pos.length) return;
    const tx = makeFacade(style, 31 + i * 17);
    const mat = withRooms(new THREE.MeshStandardMaterial({
      map: tx.map, emissiveMap: tx.emissive, emissive: 0xffffff, emissiveIntensity: 0.05,
      roughnessMap: tx.orm, metalnessMap: tx.orm, roughness: 1, metalness: 1, vertexColors: true, envMapIntensity: 1.3,
      normalMap: tx.normal, normalScale: new THREE.Vector2(1.1, 1.1),
    }));
    env.nightLerp(mat, 'emissiveIntensity', 0.02, 0.85);
    const mesh = new THREE.Mesh(facades[style].geometry(), mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
  });
  {
    const tx = makeStorefronts(7);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(shopB.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(shopB.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(shopB.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(shopB.col, 3));
    const mat = new THREE.MeshStandardMaterial({
      map: tx.map, emissiveMap: tx.emissive, emissive: 0xffffff, emissiveIntensity: 0.2,
      roughnessMap: tx.orm, metalnessMap: tx.orm, roughness: 1, metalness: 1, vertexColors: true,
      normalMap: tx.normal, normalScale: new THREE.Vector2(1.2, 1.2),
    });
    env.nightLerp(mat, 'emissiveIntensity', 0.12, 0.7);
    mat.onBeforeCompile = function (shader, renderer) {
      THREE.Material.prototype.onBeforeCompile.call(this, shader, renderer);
      shader.uniforms.uShopNear = shopNear;
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'uniform float uShopNear;\nvoid main() {').replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
  #ifdef USE_COLOR
  if ( vColor.b > 0.995 ) {
    float sDither = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
    if ( length( vViewPosition ) < uShopNear + ( sDither - 0.5 ) * 14.0 ) discard;
  }
  #endif`);
    };
    mat.customProgramCacheKey = () => 'shopfade';
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = true;
    group.add(m);
  }
  const glowMats = {};
  for (const k of Object.keys(glow)) {
    const base = new THREE.Color(NEON[k]);
    const mat = new THREE.MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    for (const ch of ['r', 'g', 'b']) env.nightLerp(mat.color, ch, base[ch] * 0.92, base[ch] * 1.55);
    glowMats[k] = mat;
  }

  // ---- storefront glow feeds the lighting shader: soft and close to white -------
  for (const block of blocks) {
    const strength = { strip: 0.55, ocean: 0.45, downtown: 0.42, midtown: 0.4, oldtown: 0.35, riverside: 0.3, uptown: 0.3, docks: 0.2 }[block.district];
    for (const f of ['w', 'e', 'n', 's']) {
      const e = faceGlow.get(`${block.i},${block.j},${f}`);
      if (!e || e.w <= 0) continue;
      const c = new THREE.Color(e.r / e.w, e.g / e.w, e.b / e.w);
      const k = Math.min(1, strength * (0.5 + e.w * 0.2));
      if (f === 'w') setNeon('z', block.i, block.j, 1, c, k);
      else if (f === 'e') setNeon('z', block.i + 1, block.j, 0, c, k);
      else if (f === 'n') setNeon('x', block.j, block.i, 1, c, k);
      else setNeon('x', block.j + 1, block.i, 0, c, k);
    }
  }

  // ---- ground: paving, lawns, parks, plazas, parking ---------------------------
  const paveRects = [], lawnRects = [];
  const lots = new Batch(), lines = new Batch(), deco = new Batch();
  const lotRects = [];
  const holoGroup = new THREE.Group();
  const holos = [];
  const domes = [];
  const APRON = 0xb9b6ae;
  for (const bl of blocks) {
    const w = bl.x1 - bl.x0, d = bl.z1 - bl.z0;
    if (bl.park) lawnRects.push([bl.x0, bl.z0, bl.x1, bl.z1]);
    else if (bl.lawn) {
      // paved pavement all round, lawn in the middle, a paved apron under each building
      const s = 4.5;
      paveRects.push([bl.x0, bl.z0, bl.x1, bl.z0 + s], [bl.x0, bl.z1 - s, bl.x1, bl.z1], [bl.x0, bl.z0 + s, bl.x0 + s, bl.z1 - s], [bl.x1 - s, bl.z0 + s, bl.x1, bl.z1 - s]);
      lawnRects.push([bl.x0 + s, bl.z0 + s, bl.x1 - s, bl.z1 - s]);
      for (let bi = bl.first; bi < bl.last; bi++) {
        const b = buildings[bi];
        const round = b.shape === 'round' || b.shape === 'hyper';
        if (round) deco.cyl(b.r + 3.4, b.r + 3.4, 0.05, b.cx, GY, b.cz, APRON, 28);
        else deco.box(b.x1 - b.x0 + 5, 0.05, b.z1 - b.z0 + 5, (b.x0 + b.x1) / 2, GY, (b.z0 + b.z1) / 2, APRON);
        // a path from the apron out to the nearest pavement
        const toW = b.cx - bl.x0, toE = bl.x1 - b.cx, toN = b.cz - bl.z0, toS = bl.z1 - b.cz;
        const m = Math.min(toW, toE, toN, toS);
        if (m === toN) deco.box(4, 0.05, toN, b.cx, GY, bl.z0 + toN / 2, APRON);
        else if (m === toS) deco.box(4, 0.05, toS, b.cx, GY, bl.z1 - toS / 2, APRON);
        else if (m === toW) deco.box(toW, 0.05, 4, bl.x0 + toW / 2, GY, b.cz, APRON);
        else deco.box(toE, 0.05, 4, bl.x1 - toE / 2, GY, b.cz, APRON);
      }
      // a few trees on the lawn, clear of the buildings
      for (let k = 0; k < 9; k++) {
        const px = rng.float(bl.x0 + 8, bl.x1 - 8), pz = rng.float(bl.z0 + 8, bl.z1 - 8);
        let clear = true;
        for (let bi = bl.first; bi < bl.last; bi++) { const b = buildings[bi]; if (px > b.x0 - 5 && px < b.x1 + 5 && pz > b.z0 - 5 && pz < b.z1 + 5) { clear = false; break; } }
        if (clear) parkSpots.push({ x: px, z: pz });
      }
    } else paveRects.push([bl.x0, bl.z0, bl.x1, bl.z1]);

    if (bl.park && !bl.biodome) {
      deco.box(w - 8, 0.05, 4.5, bl.cx, GY, bl.cz, 0xd6d2c8);
      deco.box(4.5, 0.05, d - 8, bl.cx, GY, bl.cz, 0xd6d2c8);
      deco.cyl(9.5, 9.5, 0.5, bl.cx, GY, bl.cz, WHITE, 24);
      pools.cyl(8, 8, 0.56, bl.cx, GY, bl.cz, 0xffffff, 24);
      deco.cyl(0.8, 1.3, 3.4, bl.cx, GY, bl.cz, WHITE, 8);
      deco.cyl(2.2, 0.6, 0.4, bl.cx, GY + 3.4, bl.cz, WHITE, 10);
      addCircle(bl.cx, bl.cz, 9.4, 0, GY + 0.9, {});
      for (let k = 0; k < 26; k++) {
        const px = rng.float(bl.x0 + 7, bl.x1 - 7), pz = rng.float(bl.z0 + 7, bl.z1 - 7);
        if (Math.abs(px - bl.cx) < 5 || Math.abs(pz - bl.cz) < 5 || Math.hypot(px - bl.cx, pz - bl.cz) < 13) continue;
        parkSpots.push({ x: px, z: pz });
      }
      for (const [dx, dz, h] of [[14, 3.5, 0], [-14, 3.5, 0], [3.5, 14, Math.PI / 2], [3.5, -14, Math.PI / 2], [26, -3.5, Math.PI], [-26, -3.5, Math.PI]]) benchSpots.push({ x: bl.cx + dx, z: bl.cz + dz, heading: h });
      for (const [dx, dz] of [[20, 4], [-20, -4], [4, 22], [-4, -22], [32, -4], [-32, 4]]) parkLamps.push({ x: bl.cx + dx, z: bl.cz + dz });
    }
    if (bl.biodome) {
      // a glass conservatory in the middle of the park
      const R = 25;
      domes.push({ x: bl.cx, z: bl.cz, r: R });
      deco.cyl(R + 3, R + 3, 0.05, bl.cx, GY, bl.cz, 0xd6d2c8, 40);
      trim.cyl(R + 0.4, R + 0.6, 1.1, bl.cx, GY, bl.cz, WHITE, 40);
      addCircle(bl.cx, bl.cz, R + 0.4, 0, GY + R, {});
      for (let k = 0; k < 16; k++) { const a = rng.float(0, 6.283), q = Math.sqrt(rng.next()) * (R - 6); parkSpots.push({ x: bl.cx + Math.cos(a) * q, z: bl.cz + Math.sin(a) * q, inside: true }); }
      for (let k = 0; k < 22; k++) {
        const px = rng.float(bl.x0 + 7, bl.x1 - 7), pz = rng.float(bl.z0 + 7, bl.z1 - 7);
        if (Math.hypot(px - bl.cx, pz - bl.cz) < R + 6) continue;
        parkSpots.push({ x: px, z: pz });
      }
      for (const [dx, dz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { deco.box(3.4, 0.05, 20, bl.cx + dx * (R + 10) * 0.7, GY, bl.cz + dz * (R + 10) * 0.7, 0xd6d2c8, dx * dz > 0 ? -Math.PI / 4 : Math.PI / 4); parkLamps.push({ x: bl.cx + dx * 34, z: bl.cz + dz * 34 }); }
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283 + 0.5; benchSpots.push({ x: bl.cx + Math.cos(a) * (R + 4.5), z: bl.cz + Math.sin(a) * (R + 4.5), heading: Math.atan2(Math.cos(a), Math.sin(a)) }); }
    }
    if (bl.plaza) {
      deco.cyl(22, 22, 0.06, bl.cx, GY, bl.cz, 0xdad7cf, 32);
      deco.cyl(14, 14, 0.1, bl.cx, GY, bl.cz, 0xbfbcb4, 32);
      trim.cyl(3.2, 3.8, 1.2, bl.cx, GY, bl.cz, WHITE, 12);
      glow.ice.cyl(3.3, 3.3, 0.1, bl.cx, GY + 1.2, bl.cz, 0xffffff, 12);
      addCircle(bl.cx, bl.cz, 3.8, 0, GY + 3, {});
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + 0.39, r = 27;
        const px = bl.cx + Math.cos(a) * r, pz = bl.cz + Math.sin(a) * r;
        trim.box(3.2, 0.7, 3.2, px, GY, pz, WHITE);
        addBox(px - 1.6, pz - 1.6, px + 1.6, pz + 1.6, 0, GY + 0.8, {});
        parkSpots.push({ x: px, z: pz, planter: true });
        benchSpots.push({ x: bl.cx + Math.cos(a + 0.39) * 19, z: bl.cz + Math.sin(a + 0.39) * 19, heading: -a - 0.39 + Math.PI / 2 });
      }
      for (let k = 0; k < 4; k++) parkLamps.push({ x: bl.cx + Math.cos(k * 1.57 + 0.78) * 33, z: bl.cz + Math.sin(k * 1.57 + 0.78) * 33 });
      holos.push({ x: bl.cx, z: bl.cz, kind: holos.length % 2 ? 'globe' : 'spark', block: bl });
    }
    if (bl.twin) {
      // sky bridges between the pair, planted on top
      const [A, B] = bl.twin;
      const dx = B.cx - A.cx, dz = B.cz - A.cz, L = Math.hypot(dx, dz);
      for (const f of [0.42, 0.7]) {
        const y = GY + B.h * f;
        trim.cbox(L, 3.2, 4.4, (A.cx + B.cx) / 2, y, (A.cz + B.cz) / 2, WHITE, Math.atan2(-dz, dx));
        roofs.cbox(L * 0.5, 0.2, 3.6, (A.cx + B.cx) / 2, y + 1.7, (A.cz + B.cz) / 2, LAWN, Math.atan2(-dz, dx));
        for (const q of [0.42, 0.58]) roofTrees.push({ x: A.cx + dx * q, y: y + 1.75, z: A.cz + dz * q, s: 0.4 });
      }
      // a round reflecting pool between the bases
      pools.cyl(7, 7, 0.14, (A.cx + B.cx) / 2 - dz / L * 16, GY + 0.02, (A.cz + B.cz) / 2 + dx / L * 16, 0xffffff, 28);
      trim.cyl(7.5, 7.5, 0.3, (A.cx + B.cx) / 2 - dz / L * 16, GY - 0.12, (A.cz + B.cz) / 2 + dx / L * 16, WHITE, 28);
    }
    if (bl.lot) {
      const L = bl.lot;
      lotRects.push([L.x0, L.z0, L.x1, L.z1]);
      const rows = [];
      const depth = L.z1 - L.z0;
      rows.push({ z: L.z0 + 3.2, heading: 0 });
      if (depth > 20) rows.push({ z: L.z1 - 3.2, heading: Math.PI });
      if (depth > 46) { rows.push({ z: (L.z0 + L.z1) / 2 - 3.2, heading: Math.PI }, { z: (L.z0 + L.z1) / 2 + 3.2, heading: 0 }); }
      for (const r of rows) {
        for (let x = L.x0 + 3; x <= L.x1 - 3; x += 3.2) {
          lines.box(0.14, 0.02, 5.6, x - 1.6, GY + 0.045, r.z, 0xe8e2d4);
          parkingSlots.push({ x, z: r.z, heading: r.heading, kind: bl.kind });
        }
      }
      for (const [dx, dz] of [[-0.3, -0.3], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3]]) parkLamps.push({ x: (L.x0 + L.x1) / 2 + dx * (L.x1 - L.x0), z: (L.z0 + L.z1) / 2 + dz * (L.z1 - L.z0) });
    }
  }
  const paving = makeGround('paving');
  const paveMat = grain(new THREE.MeshStandardMaterial({ map: paving.map, roughnessMap: paving.rough, normalMap: paving.normal, roughness: 1, metalness: 0 }), 0.05, 0.0, 0.3);
  paveMat.defines = { ...paveMat.defines, WET_SURFACE: '' };
  const paveMesh = new THREE.Mesh(slabGeometry(paveRects, CITY.y - 0.5, GY), paveMat);
  paveMesh.receiveShadow = true;
  group.add(paveMesh);
  const grass = makeGround('grass');
  const lawnMat = grain(new THREE.MeshStandardMaterial({ color: 0xb9b6a0, map: grass.map, normalMap: grass.normal, roughness: 0.95 }), 0.04, 0.0, 0.4);
  const lawn = new THREE.Mesh(slabGeometry(lawnRects, CITY.y - 0.5, GY, 4.5), lawnMat);
  lawn.receiveShadow = true;
  group.add(lawn);
  {
    const p = CITY.promenade;
    const planks = makeGround('planks');
    const boardMat = new THREE.MeshStandardMaterial({ map: planks.map, roughnessMap: planks.rough, normalMap: planks.normal, roughness: 1 });
    const m = new THREE.Mesh(slabGeometry([[p.x0, p.z0, p.x1, p.z1]], CITY.y - 1.2, GY, 3), boardMat);
    m.receiveShadow = true;
    group.add(m);
    for (let z = p.z0 + 30; z < p.z1 - 20; z += 46) benchSpots.push({ x: p.x1 - 2.2, z, heading: -Math.PI / 2 });
  }
  const flatMat = grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86 }), 0.6, 0.5, 0.2);
  if (lotRects.length) {
    const asp = makeGround('asphalt');
    const lm = grain(new THREE.MeshStandardMaterial({ map: asp.map, roughnessMap: asp.rough, normalMap: asp.normal, roughness: 1 }), 0.05, 0.0, 0.34);
    lm.defines = { ...lm.defines, WET_SURFACE: '' };
    const lotMesh = new THREE.Mesh(slabGeometry(lotRects, GY - 0.02, GY + 0.04, 6), lm);
    lotMesh.receiveShadow = true;
    group.add(lotMesh);
  }
  if (!lines.empty) group.add(lines.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), { shadow: false }));

  // ---- conservatory domes --------------------------------------------------------
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcfe9f4, transparent: true, opacity: 0.3, roughness: 0.06, metalness: 0.9, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide });
  const frameMat = new THREE.LineBasicMaterial({ color: 0xf2f4f6 });
  for (const d of domes) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(d.r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    shell.position.set(d.x, GY + 0.4, d.z);
    shell.renderOrder = 4;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(d.r + 0.05, 2)), frameMat);
    frame.position.copy(shell.position);
    group.add(shell, frame);
  }

  // ---- plaza holograms: thin line drawings, pale ---------------------------------
  const holoMat = (hex) => new THREE.LineBasicMaterial({ color: new THREE.Color(hex), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const h of holos) {
    const g = new THREE.Group();
    const hex = h.kind === 'globe' ? 0xcfe9ff : PAL.neonCoral;
    if (h.kind === 'globe') {
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(7, 2)), holoMat(hex)));
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, k) => new THREE.Vector3(Math.cos(k / 64 * 6.283) * 10, 0, Math.sin(k / 64 * 6.283) * 10))), holoMat(0xffe6c4));
      ring.rotation.x = 0.4;
      g.add(ring);
    } else {
      const lens = [1, 0.72, 0.9, 0.66, 1, 0.75, 0.88, 0.7, 1, 0.68, 0.92, 0.74];
      for (let i = 0; i < 12; i++) {
        const len = 8 * lens[i];
        const ray = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, len, 0.9)), holoMat(hex));
        const a = (i / 12) * Math.PI * 2;
        ray.position.set(Math.sin(a) * (len / 2 + 1.2), Math.cos(a) * (len / 2 + 1.2), 0);
        ray.rotation.z = -a;
        g.add(ray);
      }
    }
    g.position.set(h.x, GY + 14, h.z);
    holoGroup.add(g);
    h.obj = g;
  }
  group.add(holoGroup);

  // ---- Token Dome: white ribs over pale glass ----------------------------------------
  const domeBlock = blocks.find((b) => b.dome);
  if (domeBlock) {
    const { cx, cz } = domeBlock;
    const db = new Batch();
    db.cyl(37, 37, 11, cx, GY, cz, 0xeceef0, 40);
    db.add(new THREE.SphereGeometry(36.5, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xbcd9e6, cx, GY + 12, cz, 0, 0, 0, 1, 0.5, 1);
    group.add(db.mesh(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.65, envMapIntensity: 1.4 })));
    trim.cyl(38, 38, 1.2, cx, GY + 11, cz, WHITE, 40);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      trim.box(1.4, 12.5, 2.2, cx + Math.cos(a) * 37.6, GY, cz + Math.sin(a) * 37.6, WHITE, -a);
      // ribs arching over the glass
      for (let s = 0; s < 6; s++) {
        const p0 = (s / 6) * Math.PI / 2, p1 = ((s + 1) / 6) * Math.PI / 2;
        const r0 = Math.cos(p0) * 36.7, y0 = Math.sin(p0) * 18.4, r1 = Math.cos(p1) * 36.7, y1 = Math.sin(p1) * 18.4;
        const len = Math.hypot(r1 - r0, y1 - y0);
        trim.add(new THREE.BoxGeometry(0.7, len, 0.5), WHITE, cx + Math.cos(a) * (r0 + r1) / 2, GY + 12 + (y0 + y1) / 2, cz + Math.sin(a) * (r0 + r1) / 2, Math.atan2(r0 - r1, y1 - y0), Math.atan2(-Math.cos(a), -Math.sin(a)), 0);
      }
    }
    trim.cyl(3, 3, 3, cx, GY + 30, cz, WHITE, 12);
    const ring = new THREE.TorusGeometry(38.4, 0.22, 6, 64); ring.rotateX(Math.PI / 2);
    glow.warm.add(ring, 0xffffff, cx, GY + 12.5, cz);
    addCircle(cx, cz, 38, 0, GY + 30, {});
    addSign(group, 'TOKEN DOME', cx, GY + 7.5, cz - 38.2, Math.PI, 26, '#b07a2a', 'tonight: bots vs. humans');
    addSign(group, 'TOKEN DOME', cx, GY + 7.5, cz + 38.2, 0, 26, '#b07a2a', 'tonight: bots vs. humans');
    for (const [ax, li, ci, sd] of [['z', domeBlock.i, domeBlock.j, 1], ['z', domeBlock.i + 1, domeBlock.j, 0], ['x', domeBlock.j, domeBlock.i, 1], ['x', domeBlock.j + 1, domeBlock.i, 0]]) setNeon(ax, li, ci, sd, new THREE.Color(0xffe9cc), 0.45);
  }

  // ---- Claude Tower: a tapering glass shaft with white ribs and three ring decks ----
  const tb = blocks.find((b) => b.kind === 'tower');
  const T = tb.tower;
  const tcx = T.cx, tcz = T.cz, H = T.h, R0 = T.r;
  const shaft = (t) => R0 * (1 - 0.56 * Math.pow(t, 0.8)); // radius at height fraction t
  const prof = [];
  for (let k = 0; k <= 14; k++) prof.push([shaft(k / 14), GY + (k / 14) * H]);
  {
    // the shared facade meshes are already built, so the shaft gets its own
    const fb = new FacadeBatch(28);
    fb.revolve(tcx, tcz, prof, BUILDING_COLORS.ice, 0, 36);
    const tx = makeFacade('glass', 77);
    const mat = withRooms(new THREE.MeshStandardMaterial({ map: tx.map, emissiveMap: tx.emissive, emissive: 0xffffff, roughnessMap: tx.orm, metalnessMap: tx.orm, normalMap: tx.normal, roughness: 1, metalness: 1, vertexColors: true, envMapIntensity: 1.4 }));
    env.nightLerp(mat, 'emissiveIntensity', 0.02, 0.9);
    const m = new THREE.Mesh(fb.geometry(), mat);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    for (let j = 0; j < 14; j++) {
      const [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
      const len = Math.hypot(r1 - r0, y1 - y0) + 0.3;
      trim.add(new THREE.BoxGeometry(0.9, len, 1.5), WHITE, tcx + Math.cos(a) * ((r0 + r1) / 2 + 0.45), (y0 + y1) / 2, tcz + Math.sin(a) * ((r0 + r1) / 2 + 0.45), Math.atan2(r0 - r1, y1 - y0), Math.atan2(-Math.cos(a), -Math.sin(a)), 0);
    }
  }
  for (const f of [0.3, 0.58, 0.84]) {
    const r = shaft(f), y = GY + f * H;
    trim.cyl(r + 7, r + 5, 1.4, tcx, y, tcz, WHITE, 40);
    trim.cyl(r + 4.4, r + 1.5, 1.6, tcx, y - 1.6, tcz, PAL.terracotta, 40);
    roofs.cyl(r + 6.2, r + 6.2, 0.15, tcx, y + 1.4, tcz, LAWN, 40);
    const ring = new THREE.TorusGeometry(r + 7.1, 0.18, 6, 56); ring.rotateX(Math.PI / 2);
    glow.warm.add(ring, 0xffffff, tcx, y + 0.7, tcz);
    for (let k = 0; k < 9; k++) { const a = (k / 9) * 6.283 + f * 7; roofTrees.push({ x: tcx + Math.cos(a) * (r + 4.6), y: y + 1.5, z: tcz + Math.sin(a) * (r + 4.6), s: 0.5 }); }
  }
  const topY = GY + H;
  trim.cyl(shaft(1) + 2.2, shaft(1) + 0.6, 2.4, tcx, topY, tcz, WHITE, 32);
  trim.cyl(0.7, 1.3, 26, tcx, topY + 2.4, tcz, WHITE, 8);
  trim.cyl(R0 + 1.2, R0 + 2.4, 1.2, tcx, GY, tcz, WHITE, 40);
  shopRing(tcx, tcz, R0 + 2.45, 2);
  addCircle(tcx, tcz, R0 + 2.4, 0, topY, { building: T });
  for (const [ax, li, ci, sd] of [['z', tb.i, tb.j, 1], ['z', tb.i + 1, tb.j, 0], ['x', tb.j, tb.i, 1], ['x', tb.j + 1, tb.i, 0]]) setNeon(ax, li, ci, sd, new THREE.Color(0xffe6cf), 0.5);

  const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.neonCoral).multiplyScalar(1.5), toneMapped: false });
  env.nightLerp(sparkMat.color, 'r', 1.25, 1.9); env.nightLerp(sparkMat.color, 'g', 0.6, 0.95); env.nightLerp(sparkMat.color, 'b', 0.44, 0.7);
  const spark = new THREE.Group();
  const lens = [1, 0.72, 0.9, 0.66, 1, 0.75, 0.88, 0.7, 1, 0.68, 0.92, 0.74];
  for (let i = 0; i < 12; i++) {
    const len = 24 * lens[i];
    const ray = new THREE.Mesh(new THREE.BoxGeometry(2.4, len, 2.4), sparkMat);
    const a = (i / 12) * Math.PI * 2;
    ray.position.set(Math.sin(a) * (len / 2 + 3), Math.cos(a) * (len / 2 + 3), 0);
    ray.rotation.z = -a;
    spark.add(ray);
  }
  spark.position.set(tcx, topY + 56, tcz);
  group.add(spark);
  const haloG = new THREE.TorusGeometry(34, 0.4, 6, 48);
  const halo = new THREE.Mesh(haloG, glowMats.warm);
  halo.position.copy(spark.position);
  halo.rotation.x = Math.PI / 2;
  group.add(halo);
  const sculpt = spark.clone();
  sculpt.scale.setScalar(0.11);
  sculpt.position.set(tcx, GY + 5.2, tcz + R0 + 13);
  group.add(sculpt);
  trim.cyl(1.6, 2, 1.4, tcx, GY, tcz + R0 + 13, WHITE, 10);
  addCircle(tcx, tcz + R0 + 13, 2, 0, GY + 8, {});
  addSign(group, 'CLAUDE TOWER', tcx - 14, GY + 3.2, tcz + R0 + 13, 0, 12, '#c8643b', 'anthropic field operations');
  trim.box(0.4, 1.7, 0.4, tcx - 19, GY, tcz + R0 + 13, WHITE); trim.box(0.4, 1.7, 0.4, tcx - 9, GY, tcz + R0 + 13, WHITE);

  // ---- POI signs --------------------------------------------------------------
  const signFor = (kind, text, fg, sub) => {
    const b = buildings.find((x) => x.kind === kind);
    if (!b) return;
    const cx = (b.x0 + b.x1) / 2;
    const w = Math.min(22, b.x1 - b.x0 - 4), y = GY + Math.min(b.h - 2, 7.6);
    addSign(group, text, cx, y, b.z0 - 0.45, Math.PI, w, fg, sub);
    addSign(group, text, cx, y, b.z1 + 0.45, 0, w, fg, sub);
  };
  signFor('safehouse', 'CONTEXT WINDOW LOFTS', '#c8643b', 'safehouse · wardrobe · garage');
  signFor('police', 'SAFETY CENTER', '#3a6ea8', 'anthropic police department');
  signFor('clinic', 'CONSTITUTIONAL CARE', '#c8643b', 'clinic · open 24h');
  signFor('retune', 'RE-TUNE GARAGE', '#b07a2a', 'repair · respray · reset your flags');
  signFor('supply', 'PROMPT SUPPLY CO.', '#2f7d8f', 'gadgets · armor · charges');
  signFor('vanta', 'VANTABLACK LABS', '#55585e', 'executive parking only');

  // ---- screens ---------------------------------------------------------------
  const atlas = makeBillboardAtlas();
  const screenMat = makeScreenMaterial(atlas);
  env.nightLerp(screenMat.uniforms.uBright, 'value', 0.9, 1.15);
  group.add(new THREE.Mesh(screens.geometry(), screenMat));
  if (!frames.empty) group.add(frames.mesh(grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3 }), 1.0, 0.25, 0.1)));

  // ---- merged batches (built last: parks, plazas and landmarks add to them) -------
  // the heavy city-wide batches are cut into squares so views and shadows only draw what they reach
  group.add(roofs.cells(grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), 0.55, 0.75, 0.26)));
  group.add(trim.cells(grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.15, envMapIntensity: 1.1 }), 0.8, 0.22, 0.1)));
  if (!relief.empty) group.add(relief.cells(grain(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }), 0.7, 0.45, 0.16)));
  balconies.build(group);
  group.add(deco.mesh(flatMat, { shadow: false }));
  for (const k of Object.keys(glow)) if (!glow[k].empty) group.add(glow[k].mesh(glowMats[k], { shadow: false, receive: false }));
  if (!pools.empty) {
    const pm = new THREE.MeshStandardMaterial({ color: 0x6fc7d6, roughness: 0.08, metalness: 0.6, emissive: 0x2a8fa0, emissiveIntensity: 0.15, envMapIntensity: 1.6 });
    env.nightLerp(pm, 'emissiveIntensity', 0.1, 0.9);
    group.add(pools.mesh(pm, { shadow: false }));
  }

  // real shopfronts: glass draws after everything solid behind it
  for (const k of ['shop', 'lobby']) {
    const C = shopCI[k];
    C.frame.build(group);
    for (const name of Object.keys(C.interiors)) C.interiors[name].build(group);
    if (C.awning) C.awning.build(group);
    C.glass.build(group);
    for (const m of C.glass.meshes) { m.renderOrder = 3; m.receiveShadow = false; }
  }

  scene.add(group);
  return {
    bays: bayCount,
    // called when the draw distance changes: the painted strips give way just inside the range
    setDrawScale(scale) { shopNear.value = Math.max(0, SHOP_DIST * scale - 14); },
    group, atlas, screenMat, paveMat,
    update(dt, t) {
      spark.rotation.y += dt * 0.35;
      sculpt.rotation.y -= dt * 0.6;
      halo.rotation.z += dt * 0.1;
      screenMat.uniforms.uTime.value = t;
      for (const h of holos) { h.obj.rotation.y += dt * 0.5; h.obj.position.y = GY + 14 + Math.sin(t * 0.8 + h.x) * 0.6; }
    },
  };
}
