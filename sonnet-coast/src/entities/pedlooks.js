// Outfits for pedestrians and NPC drivers. A look describes a person (build, skin, hair, clothes,
// accessories) in plain terms; kitData() turns it into the per-part colours and variant bits the
// instanced crowd draws with. Looks from older code ({ skin, top, bottom, hair, hat, hairStyle })
// still work: they are dressed up on first use.
import { HEAD, TORSO, PELVIS, UARM, FARM, THIGH, SHIN, FOOT } from './pedKit.js';

const SKINS = [0xf3d2b8, 0xeac0a0, 0xdcab86, 0xc8916a, 0xb07852, 0x93613f, 0x774a30, 0x5c3722, 0x48291a];
const HAIR_NATURAL = [0x16110e, 0x16110e, 0x2a1c13, 0x3a2618, 0x5e3d24, 0x7a4b2a, 0x8f4a26, 0xb88a58, 0xcfae78, 0xe2d6c0, 0x8e8b86, 0xd8d4cc];
const HAIR_DYED = [0x2f8f8a, 0x9a84c8, 0xd9705a, 0x3a5fb0, 0xd08aa6, 0xe8c25a];
// Tasteful, natural colours: clothes read as colourful in daylight without glowing.
const PAL = {
  coral: 0xe07a5f, teal: 0x2a9d8f, mustard: 0xdca236, olive: 0x6b7a3c, lilac: 0xa898cf, cobalt: 0x3557a8,
  denim: 0x4a6a92, cream: 0xefe5d1, black: 0x1d1e21, white: 0xf1f1ee, terracotta: 0xc4623d, forest: 0x2f5d46,
  burgundy: 0x7a2e3a, navy: 0x25314f, sand: 0xd2b98c, grey: 0x8d9096, charcoal: 0x3a3c40, sky: 0x8fb8de,
  blush: 0xe8b4a8, rust: 0xb5552d, sage: 0x9fb39a, camel: 0xb08a5a, mint: 0xa8d5c2, plum: 0x5e3a5a,
};
const BRIGHT = ['coral', 'teal', 'mustard', 'olive', 'lilac', 'cobalt', 'terracotta', 'forest', 'burgundy', 'sky', 'blush', 'rust', 'sage', 'mint', 'plum'];
const NEUTRAL = ['cream', 'black', 'white', 'navy', 'sand', 'grey', 'charcoal', 'camel'];
const DENIM = [0x3d5a80, 0x4a6a92, 0x2c3e5c, 0x6d8fb8, 0x23262d, 0x8aa6c8];
const CHINO = [0xc9b48a, 0x6b7a3c, 0x25314f, 0xefe5d1, 0x8b6b4a, 0x3a3c40, 0x9fb39a];
const DARK = [0x1d1e21, 0x2b2d31, 0x3a3c40, 0x25314f, 0x4a4540];

// deterministic little random source per look
function rng(seed) {
  let s = seed >>> 0;
  const f = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.pick = (a) => a[Math.floor(f() * a.length)];
  f.chance = (p) => f() < p;
  f.range = (a, b) => a + (b - a) * f();
  f.weighted = (o) => { let tot = 0; for (const k in o) tot += o[k]; let r = f() * tot; for (const k in o) { r -= o[k]; if (r <= 0) return k; } return Object.keys(o)[0]; };
  return f;
}
const col = (r, list) => PAL[r.pick(list)];
const shade = (hex, k) => { const r = Math.min(255, ((hex >> 16) & 255) * k), g = Math.min(255, ((hex >> 8) & 255) * k), b = Math.min(255, (hex & 255) * k); return (r << 16) | (g << 8) | b; };

// Hair styles: shell shape (volume, length, fringe, curl) plus optional extra pieces.
export const HAIR = {
  crop: { v: [0.05, 0, 0.12, 0] }, buzz: { v: [0.0, 0, 0.05, 0] }, long: { v: [0.07, 0.3, 0.55, 0] },
  bob: { v: [0.1, 0.12, 0.6, 0] }, pony: { v: [0.04, 0.02, 0.35, 0], bits: [HEAD.PONY] }, bun: { v: [0.04, 0, 0.25, 0], bits: [HEAD.BUN] },
  afro: { v: [0.5, 0, 0.55, 1] }, curls: { v: [0.2, 0.1, 0.65, 0.8] }, side: { v: [0.09, 0.02, 0.75, 0], part: 1 },
  wavy: { v: [0.12, 0.28, 0.6, 0.4] }, braids: { v: [0.03, 0, 0.2, 0], bits: [HEAD.BRAIDS] }, bald: { v: [0, 0, 0, 0], none: true },
};

function makeLook(seed, kind = 'any') {
  const r = rng(seed * 7919 + 13);
  const f = r.chance(0.5);
  const sport = kind === 'sport', beach = kind === 'beach';
  const L = { f, skin: r.pick(SKINS), scale: f ? r.range(0.92, 1.02) : r.range(0.98, 1.1) };
  L.build = f ? r.range(0.88, 0.98) : r.range(0.98, 1.12);
  L.hipW = f ? r.range(1.02, 1.12) : r.range(0.95, 1.03);
  L.depth = r.range(0.94, 1.12);
  // hair
  L.hairStyle = f ? r.weighted({ long: 5, bob: 3, pony: 4, bun: 3, curls: 2, wavy: 3, afro: 1, braids: 1.2, side: 1, crop: 0.6 })
    : r.weighted({ crop: 5, buzz: 3, side: 3, curls: 1.5, afro: 0.8, bald: 1, long: 0.6, bun: 0.4, braids: 0.4, pony: 0.3 });
  const dyed = r.chance(0.12);
  L.hair = dyed ? r.pick(HAIR_DYED) : r.pick(HAIR_NATURAL);
  if (!dyed && L.skin < 0x900000 && r.chance(0.7)) L.hair = r.pick([0x16110e, 0x1f1612, 0x2a1c13]);
  if (!f && !dyed && r.chance(0.28)) L.beard = r.chance(0.75) ? 'beard' : 'stache';
  // headwear
  const hatOk = L.hairStyle !== 'afro' && L.hairStyle !== 'bun';
  L.hatType = !hatOk ? null : r.weighted(beach ? { none: 3, sunhat: f ? 3 : 0.5, bucket: 2, cap: 2 } : sport ? { none: 4, cap: 2, capback: 1 } : { none: 12, cap: 1.6, capback: 0.9, beanie: 1.6, bucket: 0.9, sunhat: f ? 0.6 : 0.1 });
  if (L.hatType === 'none') L.hatType = null;
  L.hatCol = r.chance(0.5) ? col(r, NEUTRAL) : col(r, BRIGHT);
  L.glasses = r.chance(beach ? 0.6 : 0.22);
  L.phones = r.chance(sport ? 0.55 : 0.08) && !['sunhat', 'bucket'].includes(L.hatType) && L.hairStyle !== 'afro';
  L.earrings = f && r.chance(0.4);
  L.accCol = r.pick([0x1d1e21, 0xf1f1ee, PAL.coral, PAL.teal, PAL.cobalt, 0x8d9096]);
  // clothes
  L.topType = sport ? r.weighted({ tee: 4, tank: 3, hoodie: 1 })
    : beach ? r.weighted(f ? { tank: 3, tee: 2, dress: 3, shirt: 1 } : { tank: 2, tee: 4, shirt: 2 })
      : r.weighted(f ? { tee: 4, tank: 1.5, hoodie: 2, jacket: 2.2, bomber: 1, blazer: 1.4, sweater: 2, coat: 1.2, dress: 2, shirt: 1.2 }
        : { tee: 5, tank: 0.8, hoodie: 2.4, jacket: 2.2, bomber: 1.6, blazer: 1.4, sweater: 2, coat: 1.1, shirt: 1.8 });
  const bright = r.chance(0.6);
  L.top = bright ? col(r, BRIGHT) : col(r, NEUTRAL);
  L.top2 = r.chance(0.5) ? col(r, NEUTRAL) : col(r, BRIGHT);
  if (L.top2 === L.top) L.top2 = L.top === PAL.white ? PAL.black : PAL.white;
  L.print = L.topType === 'tee' ? r.weighted({ none: 4, stripe: 1.4, print: 1.6 }) : 'none';
  L.shortSleeve = L.topType === 'tee' || (L.topType === 'shirt' && r.chance(0.5));
  if (L.topType === 'coat') L.top = r.pick([PAL.camel, PAL.charcoal, PAL.navy, PAL.cream, PAL.olive, PAL.black, PAL.burgundy]);
  if (L.topType === 'bomber') L.top = r.pick([PAL.olive, PAL.black, PAL.navy, PAL.burgundy, PAL.sand, PAL.teal, PAL.rust]);
  if (L.topType === 'blazer') { L.top = r.pick([PAL.navy, PAL.charcoal, PAL.camel, PAL.cream, PAL.black, PAL.sage, PAL.burgundy]); L.top2 = r.pick([PAL.white, PAL.cream, PAL.black, PAL.sky]); }
  // bottoms
  if (L.topType === 'dress') L.bottomType = 'dress';
  else L.bottomType = sport ? r.weighted({ shorts: 3, joggers: 2 }) : beach ? r.weighted(f ? { shorts: 3, skirt: 2 } : { shorts: 5, chinos: 1 })
    : r.weighted(f ? { jeans: 4, chinos: 2, shorts: 1.5, skirt: 2.4, joggers: 1.2, trousers: 1.6 } : { jeans: 5, chinos: 3, shorts: 1.6, joggers: 1.6, trousers: 2 });
  L.bottom = L.bottomType === 'dress' ? L.top : L.bottomType === 'jeans' ? r.pick(DENIM) : L.bottomType === 'chinos' ? r.pick(CHINO)
    : L.bottomType === 'joggers' ? r.pick([PAL.charcoal, PAL.black, PAL.grey, PAL.navy, PAL.olive, PAL.sand])
      : L.bottomType === 'trousers' ? r.pick(DARK) : L.bottomType === 'skirt' ? (r.chance(0.5) ? col(r, BRIGHT) : col(r, NEUTRAL))
        : r.pick([...CHINO, ...DENIM.slice(0, 3), PAL.coral, PAL.teal, PAL.navy]);
  if (L.bottom === L.top && L.bottomType !== 'dress') L.bottom = r.pick(DENIM);
  L.belt = r.pick([0x4a3020, 0x1d1e21, 0x6b4a30]);
  // shoes
  const bare = L.bottomType === 'shorts' || L.bottomType === 'skirt' || L.bottomType === 'dress';
  L.shoeType = beach ? r.weighted({ sandal: 4, sneaker: 1 }) : sport ? 'sneaker'
    : L.topType === 'blazer' && r.chance(0.6) ? 'dress' : r.weighted(bare ? { sneaker: 5, sandal: 2.5, boot: 0.6, dress: 0.5 } : { sneaker: 6, boot: 2.2, dress: 1.4 });
  const ws = r.chance(0.5);
  L.shoe = L.shoeType === 'sneaker' ? (ws ? PAL.white : r.pick([PAL.black, PAL.cream, PAL.grey, PAL.navy, PAL.coral, PAL.teal, PAL.cobalt, PAL.sand]))
    : L.shoeType === 'boot' ? r.pick([0x5a3b26, 0x1d1e21, 0x8b6b4a, 0x3a2a20]) : L.shoeType === 'dress' ? r.pick([0x1d1e21, 0x4a3020, 0x6b4a30]) : r.pick([0x6b4a30, 0x1d1e21, PAL.cream, PAL.coral]);
  L.sole = L.shoeType === 'sneaker' ? (ws || r.chance(0.6) ? 0xf4f3ef : r.pick([0x1d1e21, PAL.coral, PAL.mint, 0xc9a46a])) : 0x2a2622;
  L.sock = bare && L.shoeType === 'sneaker' && r.chance(0.7) ? r.pick([0xf1f1ee, 0xf1f1ee, 0x1d1e21, 0x8d9096]) : 0;
  // bags and wrists
  L.bag = sport || beach ? (beach && r.chance(0.3) ? 'tote' : null) : r.weighted({ none: 6, pack: 1.8, cross: 1.4, tote: f ? 1.6 : 0.2 });
  if (L.bag === 'none') L.bag = null;
  L.bagCol = r.chance(0.6) ? r.pick([0x1d1e21, 0x5a3b26, 0x8b6b4a, PAL.cream, PAL.charcoal]) : col(r, BRIGHT);
  L.watch = r.chance(0.3);
  L.strings = r.chance(0.6);
  L.towel = col(r, BRIGHT);
  return L;
}

export const PED_LOOKS = [];
for (let i = 0; i < 220; i++) PED_LOOKS.push(makeLook(i + 1));
export const SPORT_LOOKS = [];
for (let i = 0; i < 40; i++) SPORT_LOOKS.push(makeLook(i + 5001, 'sport'));
export const BEACH_LOOKS = [];
for (let i = 0; i < 50; i++) BEACH_LOOKS.push(makeLook(i + 9001, 'beach'));

export const COP_LOOK = {
  skin: 0xd9a47c, top: 0x22283a, top2: 0x22283a, bottom: 0x1c1d22, hair: 0x15161a, scale: 1.02, build: 1.08, hipW: 1, depth: 1.04,
  topType: 'uniform', bottomType: 'trousers', shoeType: 'boot', shoe: 0x111214, sole: 0x111214, hairStyle: 'crop', hatType: 'copcap', hatCol: 0x22283a,
  accCol: 0x101114, belt: 0x101114, cop: true,
};

// Older looks name only a few colours: dress them in a full outfit.
const dressed = new WeakMap();
export function fullLook(L, role = 'civ') {
  if (L.topType) return L;
  let F = dressed.get(L);
  if (F) return F;
  const seed = ((L.top ^ (L.skin << 3) ^ (L.hair >> 2)) >>> 0) % 100000;
  F = makeLook(seed + 77);
  const goon = role === 'goon';
  Object.assign(F, {
    skin: L.skin, top: L.top, bottom: L.bottom, hair: L.hair, scale: L.scale || 1, f: false, build: L.build || 1.04,
    hairStyle: ['crop', 'long', 'bun'][L.hairStyle || 0], hatType: L.hat ? 'cap' : null, hatCol: L.top,
  });
  if (goon) {
    Object.assign(F, { topType: 'bomber', top: 0x17181c, top2: 0x0d0d0f, bottomType: 'trousers', bottom: 0x101114, shoeType: 'boot', shoe: 0x111214, glasses: true, phones: false,
      bag: null, hatType: seed % 2 ? 'beanie' : null, hatCol: 0x141518, accCol: 0x141518, beard: seed % 3 ? null : 'beard', print: 'none', sock: 0, build: 1.1, depth: 1.06 });
  } else if (L.glow) {
    // named characters keep their colours: an open jacket in their top colour over a contrasting tee
    Object.assign(F, { topType: 'jacket', top2: shade(L.glow, 0.85), bottomType: 'trousers', shoeType: 'sneaker', shoe: 0xf1f1ee, sole: 0xf4f3ef, bag: null, glasses: false, phones: false, print: 'none', sock: 0, f: L.hairStyle === 1 || L.hairStyle === 2 });
  }
  dressed.set(L, F);
  return F;
}

// ---- instance data ---------------------------------------------------------------------------
// Each part's instance record: colours A, B, C, D (rgb), then mask and the second iBits value;
// the head adds hair shape (volume, length, fringe, curl).
export const STRIDE = 14, HEAD_STRIDE = 18;
const lin = (hex, out, o) => {
  // three.js colours are linear; the hex values above are sRGB
  for (let i = 0; i < 3; i++) { const c = ((hex >> (16 - i * 8)) & 255) / 255; out[o + i] = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4); }
};
function rec(n, a, b, c, d, mask, extra = 0) {
  const r = new Float32Array(n);
  lin(a, r, 0); lin(b, r, 3); lin(c, r, 6); lin(d, r, 9);
  r[12] = mask; r[13] = extra;
  return r;
}
const bits = (...list) => list.reduce((m, b) => (b === null || b === undefined || b === false ? m : m | (1 << b)), 0);

export function kitData(L) {
  if (L._kit) return L._kit;
  const skin = L.skin, t = L.topType, top = L.top, top2 = L.top2 ?? L.top;
  const long = !(L.shortSleeve || t === 'tank' || t === 'dress');
  const bare = t === 'tank' || t === 'dress';
  const sleeve = bare ? skin : top;
  const lower = long ? top : skin;
  // torso
  let tb = 0, tB = top2;
  const T = TORSO;
  switch (t) {
    case 'tee': tb = bits(T.CREW, L.print === 'stripe' && T.STRIPE, L.print === 'print' && T.PRINT); break;
    case 'tank': tb = bits(T.TANK); break;
    case 'hoodie': tb = bits(T.HOOD, T.POCKET, L.strings && T.STRINGS); tB = shade(top, 0.82); break;
    case 'jacket': tb = bits(T.OPEN, T.COLLAR); break;
    case 'bomber': tb = bits(T.RIB, T.ZIP); tB = shade(top, 0.62); break;
    case 'blazer': tb = bits(T.VNECK, T.LAPELS, T.BUTTONS); break;
    case 'sweater': tb = bits(T.CREW, T.RIB, L.print === 'stripe' && T.STRIPE); tB = shade(top, 0.84); break;
    case 'coat': tb = bits(T.OPEN, T.COLLAR); break;
    case 'dress': tb = bits(T.STRAPS); break;
    case 'shirt': tb = bits(T.COLLAR, T.BUTTONS); tB = shade(top, 0.9); break;
    case 'uniform': tb = bits(T.COLLAR, T.POCKETS, T.BADGE, T.BUTTONS); break;
  }
  if (L.bag === 'pack') tb |= bits(T.PACK);
  if (L.bag === 'cross') tb |= bits(T.CROSS);
  const fem = L.f ? 1 : 0;
  // pelvis
  const P = PELVIS;
  let pb = 0;
  if (['jeans', 'chinos', 'trousers'].includes(L.bottomType) && !['hoodie', 'sweater', 'coat'].includes(t)) pb |= bits(P.BELT);
  if (L.bottomType === 'skirt' || L.bottomType === 'dress') pb |= bits(P.SKIRT);
  if (t === 'jacket' || t === 'blazer') pb |= bits(P.HEM);
  if (t === 'coat') pb |= bits(P.COAT);
  if (L.cop) pb |= bits(P.DUTY);
  // legs
  const shortsLike = L.bottomType === 'shorts', skirtLike = L.bottomType === 'skirt' || L.bottomType === 'dress';
  const thighLow = shortsLike || skirtLike ? skin : L.bottom;
  const thighTop = skirtLike ? skin : L.bottom;
  const shin = shortsLike || skirtLike ? skin : L.bottom;
  const sh = SHIN;
  const shinB = bits(L.bottomType === 'joggers' && sh.CUFF, L.sock && sh.SOCK, L.shoeType === 'boot' && !shortsLike && !skirtLike && sh.BOOT);
  const fb = { sneaker: FOOT.SNEAKER, boot: FOOT.BOOT, sandal: FOOT.SANDAL, dress: FOOT.DRESS }[L.shoeType] ?? FOOT.SNEAKER;
  // head
  const H = HAIR[L.hairStyle] || HAIR.crop;
  const hb = bits(!H.none && HEAD.HAIR, ...(H.bits || []), L.hatType && { cap: HEAD.CAP, capback: HEAD.CAPBACK, beanie: HEAD.BEANIE, bucket: HEAD.BUCKET, sunhat: HEAD.SUNHAT, copcap: HEAD.COPCAP }[L.hatType],
    L.glasses && HEAD.GLASSES, L.phones && HEAD.PHONES, L.beard === 'beard' && HEAD.BEARD, L.beard && HEAD.STACHE, L.earrings && HEAD.EARRING);
  const head = new Float32Array(HEAD_STRIDE);
  head.set(rec(STRIDE, skin, L.hair, L.hatCol ?? top, L.accCol ?? 0x1d1e21, hb, (H.part || 0) * (L.f ? -1 : 1)));
  // hats squash the hair under them
  const hv = H.v, hat = !!L.hatType;
  head[14] = hat ? Math.min(hv[0], 0.04) : hv[0]; head[15] = hv[1]; head[16] = hat ? Math.min(hv[2], 0.4) : hv[2]; head[17] = hat ? 0 : hv[3];
  const fa = (side) => rec(STRIDE, lower, long ? shade(top, 0.85) : skin, skin, L.bagCol ?? 0x1d1e21,
    bits(long && ['hoodie', 'bomber', 'sweater'].includes(t) && FARM.CUFF, side > 0 && L.watch && FARM.WATCH, side > 0 && L.bag === 'tote' && FARM.TOTE));
  L._kit = {
    torso: rec(STRIDE, top, tB, skin, L.bagCol ?? 0x1d1e21, tb, fem),
    pelvis: rec(STRIDE, L.bottom, L.belt ?? 0x1d1e21, top, L.towel ?? 0xe07a5f, pb, fem),
    head,
    uarm: rec(STRIDE, sleeve, lower, skin, skin, bits(L.shortSleeve && UARM.SLEEVE)),
    farmL: fa(1), farmR: fa(-1),
    farArm: rec(STRIDE, sleeve, lower, skin, skin, bits(L.shortSleeve && UARM.SLEEVE)),
    thigh: rec(STRIDE, thighTop, thighLow, skin, skin, bits(shortsLike && THIGH.SHORTS)),
    shin: rec(STRIDE, shin, L.sock || 0xf1f1ee, L.shoe, L.sole ?? 0x2a2622, shinB),
    foot: rec(STRIDE, skin, skin, L.shoe, L.sole ?? 0x2a2622, bits(fb)),
  };
  return L._kit;
}
