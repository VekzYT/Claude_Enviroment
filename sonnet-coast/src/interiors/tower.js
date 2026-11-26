// Claude Tower: the lobby at the foot of the tower, and the Sky Deck near its top.
// The lobby is a tall white atrium with a terracotta wall, the spark, a curved reception desk and
// a bank of lifts. The lifts go to the Sky Deck — a real floor inside the tower's glass shaft, so
// the view is the city itself — or, when the helicopter service runs, to the roof pad.
import * as THREE from 'three';
import { G } from '../state.js';
import { Room, terrazzoTex, woodTex, labelTex, sofa, roundTable, plant } from './kit.js';
import { look, jobTip, weightRumour } from './people.js';
import { blocks } from '../world/cityplan.js';
import { allColliders, removeCollider, addCircle } from '../world/colliders.js';
import { CITY } from '../world/layout.js';
import { pick } from '../util/rng.js';

const GY = CITY.y + 0.16;
const W = 22, D = 16, H = 8;
const ADA = { who: 'ADA', role: 'Reception', color: '#d97757' };
const LIFT = { who: 'LIFT', role: 'Claude Tower', color: '#f0e8d8' };
const tower = () => blocks.find((b) => b.kind === 'tower').tower;

// Where a helicopter pad is near the tower, if the helicopter service is running.
function towerPad() {
  const pads = G.heliPads, T = tower();
  if (!Array.isArray(pads) || !pads.length || typeof G.heliTeleport !== 'function') return null;
  let best = null, bd = Infinity;
  for (const p of pads) { const d = Math.hypot(p.x - T.cx, p.z - T.cz); if (d < bd) { bd = d; best = p; } }
  return best;
}
function liftMenu(rooms, here) {
  const pad = towerPad();
  return { ...LIFT, text: 'Doors open with a soft chime. "Where to?"', choices: [
    here !== 'skydeck' ? { label: 'Sky Deck', note: 'floor 212 · the view', then: () => { rooms.go('skydeck'); return null; } } : { label: 'Lobby', note: 'ground floor', then: () => { rooms.go('lobby', { x: -9.4, z: 0, h: Math.PI / 2 }); return null; } },
    ...(pad ? [{ label: pad.name || 'Roof helipad', note: 'helicopters', then: () => { rooms.go(null, { heli: pad.id }); return null; } }] : []),
    { label: 'Stay here', then: () => null },
  ] };
}

// ---- lobby ----------------------------------------------------------------------------------------
function buildLobby(origin) {
  const r = new Room(W, D, H, { floor: terrazzoTex('lobby', '#e9e4da', ['#cfc8bc', '#c49a80', '#d8cfc0', '#a39e96', '#f4f1ea', '#d8d2c8'], 3), floorRepeat: 4, floorRough: 0.14, wall: 0xf1eee8, ceiling: 0xf4f1ec, trim: 0xe2ddd4 });
  const WHITE = 0xf3f1ec, TERRA = 0xc8643b, OAK = 0xb48352, BRASS = 0xc9a24a;
  // the terracotta feature wall with the spark and the name
  r.rbox('matte', 14, 7.2, 0.3, 0, 0, -D / 2 + 0.15, TERRA, 0.05);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, len = [1.6, 1.15, 1.45, 1.05][i % 4];
    r.add('glow', new THREE.BoxGeometry(0.2, len, 0.12), 0xff9a72, Math.sin(a) * (len / 2 + 0.3), 5.0 + Math.cos(a) * (len / 2 + 0.3), -D / 2 + 0.36, 0, 0, -a);
  }
  r.sphere('glow', 0.28, 0, 5.0, -D / 2 + 0.36, 0xffc0a0, 1, 1, 0.4);
  r.quad(labelTex('lobby-name', 1024, 256, null, [{ t: 'CLAUDE TOWER', size: 100, color: '#faf6ee', y: 100, spacing: 14 }, { t: 'ANTHROPIC FIELD OPERATIONS', size: 34, color: '#f6d2bf', y: 200, spacing: 10, weight: 700 }]), 7.5, 1.9, 0, 2.6, -D / 2 + 0.32, 0, { basic: true });
  r.extra[r.extra.length - 1].material.transparent = true;
  r.lamp(0, 0.4, -D / 2 + 1.4, 0xffb090, 9, 8, [0, 0.4, -1], 1.2);
  // curved reception desk: white body, oak top, a lit plinth
  const cx = 0, cz = -7.4, R = 3.4;
  for (let i = 0; i < 9; i++) {
    const a = -0.95 + (i / 8) * 1.9, x = cx + Math.sin(a) * R, z = cz + Math.cos(a) * R;
    r.rbox('matte', 0.86, 1.05, 0.6, x, 0.06, z, WHITE, 0.04, a);
    r.rbox('gloss', 0.9, 0.05, 0.74, x - Math.sin(a) * 0.06, 1.1, z - Math.cos(a) * 0.06, OAK, 0.015, a);
    r.box('glow', 0.82, 0.03, 0.02, x + Math.sin(a) * 0.31, 0.05, z + Math.cos(a) * 0.31, 0xffd2a8, a);
    r.solid(x - 0.45, z - 0.4, x + 0.45, z + 0.4, 0, 1.15);
  }
  r.rbox('gloss', 0.5, 0.32, 0.04, -0.6, 1.15, cz + R - 0.45, 0x1f2124, 0.01, 0.15);
  r.box('glow', 0.44, 0.26, 0.01, -0.6, 1.18, cz + R - 0.43, 0xbfe6ff, 0.15);
  r.lamp(0, 3.4, -3.6, 0xffe6cc, 8, 7);
  // the lifts on the left wall: brass frames, dark doors, a floor readout over each
  for (const z of [-4.2, 0, 4.2]) {
    r.box('metal', 0.1, 3.3, 2.0, -W / 2 + 0.05, 0, z, BRASS);
    r.box('gloss', 0.06, 3.0, 1.7, -W / 2 + 0.11, 0, z, 0x2a2b2f);
    r.box('metal', 0.02, 2.9, 0.02, -W / 2 + 0.15, 0.05, z, 0x8a8e94);
    r.box('glow', 0.02, 0.16, 0.5, -W / 2 + 0.12, 3.5, z, 0xffb070);
    r.box('metal', 0.04, 0.24, 0.12, -W / 2 + 0.12, 1.2, z + 1.25, BRASS);
    r.sphere('glow', 0.025, -W / 2 + 0.15, 1.24, z + 1.25, 0xfff0dc);
  }
  r.lamp(-W / 2 + 1.5, 4.5, 0, 0xffe6cc, 6, 8);
  // security gates between the door and the lifts
  for (const z of [-3, -1.2, 0.6, 2.4]) { r.rbox('metal', 0.24, 1.0, 1.0, -6.6, 0, z, 0xd8dbe0, 0.05); r.box('glow', 0.02, 0.05, 0.8, -6.47, 0.9, z, 0x7dffb0); r.solid(-6.75, z - 0.5, -6.45, z + 0.5, 0, 1); }
  for (const z of [-2.1, -0.3, 1.5]) r.box('glass', 0.02, 0.9, 0.8, -6.6, 0.2, z, 0xffffff);
  // the lounge: sofas, a coffee table, a living wall behind
  sofa(r, 7.2, -1.4, 2.6, 0, 0xd9cdb8);
  sofa(r, 7.2, 3.0, 2.6, Math.PI, 0xd9cdb8);
  roundTable(r, 7.2, 0.8, 0.7, 0xb48352, 0.42, 0x2a2b2f);
  r.cyl('gloss', 0.12, 0.09, 0.2, 7.2, 0.42, 0.8, 0xf4f2ee, 14);
  r.sphere('leaf', 0.16, 7.2, 0.72, 0.8, 0x5a9a48, 1, 0.8, 1, 1);
  const greens = [0x3f7a3c, 0x4a8a3c, 0x2f6a3a, 0x5a9a48, 0x6aa84f];
  for (let i = 0; i < 26; i++) for (let j = 0; j < 12; j++) {
    const z = -5.6 + i * 0.46 + (j % 2) * 0.2, y = 0.9 + j * 0.46;
    r.sphere('leaf', 0.3 + ((i * 7 + j * 3) % 5) * 0.03, W / 2 - 0.18, y, z, greens[(i * 3 + j) % 5], 0.55, 0.8, 1, 0);
  }
  r.box('matte', 0.1, 0.3, 12.4, W / 2 - 0.05, 0.6, 0.4, 0x3a2e26);
  r.lamp(9.5, 5.2, 0.4, 0xfff2dc, 7, 8, [1, -1, 0], 1.0);
  // columns, the oak slat ceiling with light lines, big planters
  for (const [x, z] of [[-4.6, -3.6], [4.6, -3.6], [-4.6, 3.8], [4.6, 3.8]]) { r.cyl('matte', 0.42, 0.42, H, x, 0, z, WHITE, 28); r.cyl('metal', 0.46, 0.46, 0.14, x, 0, z, BRASS, 28); r.solid(x - 0.42, z - 0.42, x + 0.42, z + 0.42, 0, H); }
  for (let i = 0; i < 52; i++) r.box('matte', 0.12, 0.2, D - 0.4, -W / 2 + 0.4 + i * 0.41, H - 0.2, 0, OAK);
  for (const x of [-7.5, -2.5, 2.5, 7.5]) r.box('glow', 0.1, 0.02, D - 1.2, x, H - 0.24, 0, 0xfff1dc);
  for (const [x, z] of [[-7.5, -3], [2.5, 2], [-2.5, 5]]) r.lamp(x, H - 0.4, z, 0xfff1dc, 14, 12);
  plant(r, -9.8, -7.0, 2.4, 'tree', 0xe9e4da);
  plant(r, 9.6, -7.0, 2.6, 'palm', 0xe9e4da);
  plant(r, 3.2, 6.8, 2.0, 'tree', 0xe9e4da);
  plant(r, -3.2, 6.8, 2.0, 'tree', 0xe9e4da);
  // the way in: tall glass both sides of a double door
  r.streetWindow(-6.6, 8.0, 5.6, 0.3, false);
  r.streetWindow(6.6, 8.0, 5.6, 0.3, false);
  r.exitDoor(0, 0x2a2b2f, 2.2);
  r.lamp(0, 3.5, D / 2 - 1.2, 0xe2eeff, 8, 10);
  return r.build(origin);
}

// ---- sky deck -------------------------------------------------------------------------------------
const DECK_F = 0.9;
function buildDeck(T) {
  const shaft = (t) => T.r * (1 - 0.56 * Math.pow(t, 0.8));
  const R = shaft(DECK_F) - 0.55, Hd = 4.2;
  const r = new Room(R * 2, R * 2, Hd, { round: true, noCeiling: true, floor: woodTex('walnut'), floorRepeat: 2.4, floorRough: 0.3 });
  const WHITE = 0xf3f1ec, BRASS = 0xc9a24a;
  // ceiling disc with a ring of downlights
  const cg = new THREE.CircleGeometry(R + 0.2, 64); cg.rotateX(Math.PI / 2);
  r.add('matte', cg, 0xf2efe9, 0, Hd, 0);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; r.cyl('glow', 0.09, 0.09, 0.02, Math.cos(a) * (R - 1.4), Hd - 0.03, Math.sin(a) * (R - 1.4), 0xfff0dc, 12); }
  // glazing ring with mullions and a brass rail
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, x = Math.cos(a) * (R + 0.15), z = Math.sin(a) * (R + 0.15);
    r.box('metal', 0.08, Hd, 0.08, x, 0, z, 0x2a2b2f, -a);
    const mx = Math.cos((a + a1) / 2) * (R + 0.15), mz = Math.sin((a + a1) / 2) * (R + 0.15), w = 2 * (R + 0.15) * Math.sin(Math.PI / n);
    r.box('glass', w, Hd, 0.02, mx, 0, mz, 0xffffff, Math.PI / 2 - (a + a1) / 2);
    // one box round each pane, from end to end, so there is no gap to slip through
    const x1 = Math.cos(a1) * (R + 0.15), z1 = Math.sin(a1) * (R + 0.15);
    r.solid(Math.min(x, x1) - 0.15, Math.min(z, z1) - 0.15, Math.max(x, x1) + 0.15, Math.max(z, z1) + 0.15, 0, Hd + 1);
  }
  r.add('metal', new THREE.TorusGeometry(R - 0.05, 0.03, 6, 96), BRASS, 0, 1.05, 0, Math.PI / 2, 0, 0);
  // the lift core in the middle: white drum, terracotta band, two doors
  r.cyl('matte', 2.6, 2.6, Hd, 0, 0, 0, WHITE, 40);
  r.cyl('matte', 2.64, 2.64, 0.5, 0, 2.9, 0, 0xc8643b, 40);
  for (const s of [1, -1]) { r.box('metal', 1.7, 2.9, 0.12, 0, 0, s * 2.58, BRASS); r.box('gloss', 1.4, 2.7, 0.06, 0, 0, s * 2.64, 0x2a2b2f); r.box('glow', 0.5, 0.12, 0.03, 0, 3.1, s * 2.66, 0xffb070); }
  r.solid(-2.6, -2.6, 2.6, 2.6, 0, Hd + 1);
  r.quad(labelTex('deck-sign', 512, 128, null, [{ t: 'SKY DECK · 212', size: 54, color: '#f0e8d8', y: 50, spacing: 8 }, { t: 'please do not feed the drones', size: 24, color: '#e9b39a', y: 100, weight: 600 }]), 2.4, 0.6, 0, 3.15, 2.67, 0, { basic: true });
  r.extra[r.extra.length - 1].material.transparent = true;
  // benches facing out, coin binoculars at the glass, planters
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26, x = Math.cos(a) * (R - 3.6), z = Math.sin(a) * (R - 3.6);
    r.rbox('gloss', 1.8, 0.08, 0.5, x, 0.42, z, 0xb48352, 0.02, Math.PI / 2 - a);
    for (const o of [-0.7, 0.7]) r.box('metal', 0.06, 0.42, 0.42, x + Math.cos(a + Math.PI / 2) * o, 0, z + Math.sin(a + Math.PI / 2) * o, 0x2a2b2f, Math.PI / 2 - a);
    r.solid(x - 0.6, z - 0.6, x + 0.6, z + 0.6, 0, 0.5);
    const b = a + Math.PI / 6, bx = Math.cos(b) * (R - 0.8), bz = Math.sin(b) * (R - 0.8);
    r.cyl('metal', 0.05, 0.08, 1.15, bx, 0, bz, 0x5a8f8a, 10);
    r.add('metal', new THREE.CylinderGeometry(0.1, 0.12, 0.42, 14), 0x5a8f8a, bx, 1.3, bz, Math.PI / 2, -b + Math.PI / 2, 0);
    r.solid(bx - 0.15, bz - 0.15, bx + 0.15, bz + 0.15, 0, 1.4);
    if (i % 2 === 0) plant(r, Math.cos(a + 0.5) * (R - 2.0), Math.sin(a + 0.5) * (R - 2.0), 1.3, 'bush', 0xe9e4da);
  }
  r.lamp(0, Hd - 0.3, R - 3, 0xfff0dc, 6, 9);
  r.lamp(0, Hd - 0.3, -R + 3, 0xfff0dc, 6, 9);
  r.lamp(R - 3, Hd - 0.3, 0, 0xfff0dc, 6, 9);
  r.lamp(-R + 3, Hd - 0.3, 0, 0xfff0dc, 6, 9);
  r.R = R;
  return r.build({ x: T.cx, y: GY + DECK_F * T.h, z: T.cz });
}

const RECEPTION = look(66, { f: true, topType: 'blazer', top: 0xc8643b, top2: 0xf1f1ee, bottomType: 'trousers', bottom: 0x25314f, hairStyle: 'side', hair: 0x16110e, hatType: null, glasses: true, bag: null, shoeType: 'dress', shoe: 0x1d1e21 });
const GUARD = look(102, { topType: 'blazer', top: 0x25314f, top2: 0xf1f1ee, bottomType: 'trousers', bottom: 0x25314f, hairStyle: 'crop', hatType: null, glasses: false, bag: null, build: 1.1, shoeType: 'dress', shoe: 0x111214 });
const STAFF = (seed, top) => look(seed, { topType: seed % 2 ? 'blazer' : 'shirt', top, top2: 0xf1f1ee, bottomType: seed % 3 ? 'trousers' : 'chinos', hatType: null, bag: seed % 2 ? 'cross' : null });

// people who walk the lobby between a few spots, pausing at each
function walker(route) {
  let k = 0, wait = Math.random() * 3;
  return (p, dt) => {
    const o = G.rooms.cur.inst.room.origin;
    if (wait > 0) { wait -= dt; p.dest = null; p.pose = 'phone'; return 0; }
    p.pose = null;
    const [x, z] = route[k];
    if (!p.dest) p.dest = { x: 0, z: 0 };
    p.dest.x = o.x + x; p.dest.z = o.z + z;
    if (Math.hypot(p.dest.x - p.pos.x, p.dest.z - p.pos.z) < 0.6) { k = (k + 1) % route.length; wait = 2 + Math.random() * 4; }
    return 1.3;
  };
}

export const LOBBY = {
  id: 'lobby', name: 'Claude Tower', shop: null, color: 0xd97757, css: '#c8643b', icon: '✳', sub: 'lobby · sky deck',
  signText: 'CLAUDE TOWER', signSub: 'LOBBY · SKY DECK',
  // the door is on the tower's round base, facing the boulevard a little east of the sculpture
  door() {
    const T = tower(), a = 0.36, R = T.r + 2.45;
    const nx = Math.sin(a), nz = Math.cos(a), x = T.cx + nx * R, z = T.cz + nz * R;
    return { x, z, y: GY, nx, nz, mx: x + nx * 1.1, mz: z + nz * 1.1 };
  },
  make(origin, rooms) {
    const room = buildLobby(origin);
    const S = () => G.save.interiors;
    const people = [
      { id: 'ada', name: 'Ada', ...ADA, look: RECEPTION, x: 0, z: -6.7, h: 0, pose: 'idle', reach: 2.6, prompt: 'Talk to Ada at reception',
        talk: (m) => ({ ...ADA, text: m.n === 1 ? 'Welcome to Claude Tower. Visitors are welcome on the Sky Deck — the lifts are on your left. Everything above it is, I am afraid, need-to-know.'
          : pick(['Good to see you again. The Sky Deck is quiet today.', 'Back again? The lifts are where you left them.', 'Hello again. Please do not ask me what floor MERIDIAN is on.']),
        choices: [
          { label: 'What happens in this tower?', then: () => ({ ...ADA, text: pick(['Research, mostly. Lots of very careful people thinking very carefully.', 'Think of it as a lighthouse. Big, bright, and mostly concerned with not hitting anything.', 'Officially? Field operations. Unofficially? Also field operations, but with better coffee.']) }) },
          { label: 'Any work going?', then: () => { const j = jobTip(); return { ...ADA, text: j ? `Someone left a note at the desk for "the operative". It just says: "${j}". I have marked it on your map.` : 'Nothing at the desk today. Enjoy the quiet.' }; } },
          { label: 'Seen anything strange around town?', then: () => { const w = weightRumour(); return { ...ADA, text: w ? `Security keeps reporting a glow near ${w}` : 'Strange? This is Sonnet Coast. Define "strange".' }; } },
        ] }) },
      { id: 'marcus', name: 'Marcus', look: GUARD, x: -7.4, z: 3.4, h: Math.PI / 2 + 0.4, pose: 'cross',
        talk: () => ({ who: 'MARCUS', role: 'Security', color: '#6ab6ff', text: pick(['Lifts are for the Sky Deck only. Anything else needs a badge I do not think you have.', 'I have stood at this gate for six years. The plants and I are very close.', 'Keep it calm in here and we will get along fine.']) }) },
      { id: 'kai', name: 'Kai', look: look(119, { topType: 'hoodie', top: 0x2a9d8f }), x: 6.6, z: 2.45, h: Math.PI, pose: 'sitPhone', seatH: 0.44,
        talk: () => ({ who: 'KAI', role: 'Visitor', color: '#2a9d8f', text: pick(['I have an interview upstairs. They asked me to write a haiku about my weaknesses.', 'The guard said the plants on that wall are real. I touched one. It was real. I apologised.']) }) },
      { id: 'w1', name: 'Staff', look: STAFF(131, 0xf0e8d8), x: -3, z: -2, h: 0, brain: walker([[-3, -2], [3.2, -2.5], [-8.8, 4.0], [5.6, 5.4]]) },
      { id: 'w2', name: 'Staff', look: STAFF(142, 0x25314f), x: 2, z: 5, h: Math.PI, brain: walker([[2, 5], [-8.8, -4.0], [2.8, -3.2], [8.6, 5.2]]) },
      { id: 'w3', name: 'Staff', look: STAFF(157, 0x6b7a3c), x: -1, z: 1, h: 0, brain: walker([[-8.8, 0.2], [0.8, 2.2], [4.4, -5.4], [-2.6, 4.2]]) },
    ];
    return {
      room, people, entry: { x: 0, z: D / 2 - 1.2, h: Math.PI },
      spots: [
        { x: room.door.x, z: room.door.z + 0.4, r: 1.6, label: 'Leave', use: () => rooms.go(null) },
        { x: -W / 2 + 1.2, z: 0, r: 2.4, label: 'Call a lift', use: () => rooms.talkTo(liftMenu(rooms, 'lobby')) },
      ],
      ambience: { sky: 0xfff4e8, ground: 0x8a7a6a, hemi: 0.55, env: 0.75, exposure: 0.98, bloom: [0.98, 0.24] },
      onEnter: (n) => { if (n === 1) G.hud.toast('Claude Tower — the lifts on the left go up to the Sky Deck'); },
    };
  },
};

export const SKYDECK = {
  id: 'skydeck', name: 'Sky Deck', hidden: true, icon: '✳', sub: 'claude tower · floor 212',
  make(origin, rooms) {
    const T = tower();
    const room = buildDeck(T);
    let cols = [];
    const people = [
      { id: 'tour1', name: 'Tourist', look: look(23, { f: true, hatType: 'sunhat', glasses: true, bag: 'tote' }), x: room.R - 1.2, z: 1.0, h: Math.PI / 2, pose: 'phone',
        talk: () => ({ who: 'TOURIST', role: 'Visiting', color: '#dca236', text: pick(['You can see the whole coast from here! Is that a swamp? Is that a racetrack?', 'I came for the view and stayed because I cannot find the lift button.']) }) },
      { id: 'tour2', name: 'Tourist', look: look(37, { glasses: true }), x: -1.5, z: -(room.R - 1.3), h: Math.PI, pose: 'lean' },
      { id: 'guide', name: 'Rosa', look: look(74, { f: true, topType: 'blazer', top: 0xc8643b }), x: -(room.R - 2.2), z: 2.4, h: -Math.PI / 2, pose: 'talk',
        talk: () => ({ who: 'ROSA', role: 'Guide', color: '#d97757', text: pick(['Two hundred and thirty metres up. On a clear day you can see Compute Ridge, the port, and every decision you have ever made.', 'The spark on top is lit every night. It uses less power than you would think. It thinks about it a lot.']),
          choices: [{ label: 'Where should I go next?', then: () => { const j = jobTip(); return { who: 'ROSA', role: 'Guide', color: '#d97757', text: j ? `People who look like you usually end up at "${j}". It is on your map now.` : 'Anywhere. Down is the fastest way, but please use the lift.' }; } }, { label: 'Thanks', then: () => null }] }) },
    ];
    return {
      room, people, outdoorView: true, entry: { x: 0, z: 3.2, h: 0 },
      spots: [
        { x: 0, z: 3.0, r: 1.5, label: 'Take the lift', use: () => rooms.talkTo(liftMenu(rooms, 'skydeck')) },
        { x: 0, z: -3.0, r: 1.5, label: 'Take the lift', use: () => rooms.talkTo(liftMenu(rooms, 'skydeck')) },
      ],
      // the deck is inside the tower's own collision drum: set it aside while we are up here
      tower(on) {
        if (on) { cols = allColliders.filter((c) => c.building === T && !c.removed); for (const c of cols) removeCollider(c); }
        else { for (const c of cols) addCircle(c.x, c.z, c.r, c.y0, c.y1, { building: T }); cols = []; }
      },
      onEnter: (n) => { if (n === 1) G.hud.toast('The Sky Deck — 230 m above Sonnet Coast'); },
    };
  },
};
