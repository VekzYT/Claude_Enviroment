// Context Café: oak floor, a tiled counter wall, sage booths, the smell of espresso. Food restores
// health; the regulars talk.
import * as THREE from 'three';
import { G } from '../state.js';
import { Room, woodTex, subwayTex, labelTex, chair, stool, roundTable, rectTable, booth, plant, pendant, art } from './kit.js';
import { look, price, pay, heal, weightRumour, jobTip, pointTo } from './people.js';
import { pick } from '../util/rng.js';

const W = 13, D = 10, H = 3.6;
const WHO = { who: 'MIRA', role: 'Barista', color: '#d97757' };
const MENU = [
  { id: 'flat', label: 'Flat white', cost: 40, hp: 25, say: 'One flat white. The foam is a diagram of a transformer, if you squint.' },
  { id: 'club', label: 'Context Club sandwich', cost: 90, hp: 60, say: 'Three layers of context, no truncation. Enjoy.' },
  { id: 'cake', label: 'The Long Context (cake)', cost: 150, hp: 100, say: 'A slice of the Long Context. Nobody has ever reached the end of one.' },
];

function build(origin) {
  const r = new Room(W, D, H, { floor: woodTex('oak'), floorRepeat: 2.2, floorRough: 0.42, wall: 0xeadfcd, leftWall: 0xe4dccb, rightWall: 0xc9724e, trim: 0xd9cdb6 });
  const CREAM = 0xf1e9db, OAK = 0xa8774c, DARK = 0x2b2622, BRASS = 0xc9a24a, SAGE = 0x7d9474;
  // tiled wall behind the counter, a lit name board, three menu boards
  r.quad(subwayTex('cafe', '#f4efe6'), 9, 2.4, -1.5, 1.2, -D / 2 + 0.012, 0, { rough: 0.25, repeat: [9 / 2, 2.4 / 2] });
  r.box('matte', 9.1, 0.06, 0.05, -1.5, 2.4, -D / 2 + 0.03, 0xd9cdb6);
  r.quad(labelTex('cafe-sign', 512, 128, '#2b2622', [{ t: 'CONTEXT CAFÉ', size: 58, color: '#f1e9db', y: 54, spacing: 6 }, { t: 'roasted on Sonnet Coast · since the first epoch', size: 20, color: '#d9a27a', y: 100, weight: 600 }]), 3.2, 0.8, -1.5, 3.05, -D / 2 + 0.015, 0, { basic: true });
  const menu = (k, x, items) => r.quad(labelTex('cafe-menu' + k, 256, 320, '#24211e', [{ t: ['COFFEE', 'FOOD', 'SWEET'][k], size: 30, color: '#e9b36a', y: 34, spacing: 3 }, ...items.map((t, i) => ({ t, size: 19, color: '#efe7da', y: 82 + i * 38, weight: 600 }))]), 1.1, 1.38, x, 3.0, -D / 2 + 0.015, 0, { basic: true });
  menu(0, -5.0, ['Flat white  40', 'Long black  35', 'Token latte  45', 'Cold brew  50', 'Oat cortado  45', 'Haiku tea  30']);
  menu(1, 2.0, ['Club sandwich  90', 'Avocado toast  70', 'Soup of the day  60', 'Grain bowl  85', 'Croissant  30']);
  menu(2, 3.3, ['Long Context  150', 'Gelato  40', 'Cinnamon knot  35', 'Lemon tart  55']);
  // the counter: oak front with a brass kick rail, stone top, the espresso machine and a pastry case
  r.rbox('matte', 7.4, 1.0, 0.72, -1.9, 0, -3.15, OAK, 0.03);
  for (let k = 0; k < 15; k++) r.box('matte', 0.03, 0.86, 0.02, -5.5 + k * 0.5, 0.07, -2.78, 0x8f6440);
  r.add('metal', new THREE.CylinderGeometry(0.022, 0.022, 7.2, 8), BRASS, -1.9, 0.2, -2.7, 0, 0, Math.PI / 2);
  r.rbox('gloss', 7.6, 0.05, 0.84, -1.9, 1.0, -3.15, 0xe9e4dc, 0.015);
  // espresso machine
  r.rbox('metal', 0.9, 0.48, 0.5, -3.6, 1.05, -3.3, 0xd8dbe0, 0.04);
  r.rbox('gloss', 0.92, 0.08, 0.52, -3.6, 1.53, -3.3, 0xc8643b, 0.02);
  for (const x of [-3.85, -3.35]) { r.cyl('metal', 0.035, 0.035, 0.12, x, 1.2, -3.02, 0x2a2b2f, 10); r.cyl('gloss', 0.04, 0.035, 0.08, x, 1.06, -2.98, 0xf4f2ee, 10); }
  r.cyl('metal', 0.12, 0.1, 0.3, -2.95, 1.05, -3.35, 0x9a9ea4, 14);   // grinder
  r.cyl('gloss', 0.12, 0.08, 0.22, -2.95, 1.35, -3.35, 0x3a2a1e, 14);
  // pastry case
  r.rbox('matte', 1.6, 0.5, 0.6, 0.6, 1.05, -3.2, 0x2b2622, 0.02);
  r.box('glass', 1.56, 0.5, 0.56, 0.6, 1.55, -3.2, 0xffffff);
  r.box('glow', 1.5, 0.015, 0.02, 0.6, 2.02, -2.95, 0xffe2b0);
  for (let i = 0; i < 6; i++) { const c = [0xd9a35a, 0xb8743a, 0xf0d9a8, 0x8a4a2a, 0xe7c9a0, 0xc9826a][i]; r.sphere('gloss', 0.07, 0.05 + (i % 3) * 0.48, 1.64 + Math.floor(i / 3) * 0.2, -3.2, c, 1.4, 0.55, 1); }
  r.box('gloss', 1.5, 0.015, 0.5, 0.6, 1.79, -3.2, 0xeeeeee);
  // till and a tip jar
  r.rbox('gloss', 0.34, 0.2, 0.28, -1.0, 1.05, -3.1, 0x1f2124, 0.03);
  r.box('glow', 0.24, 0.12, 0.01, -1.0, 1.28, -3.0, 0x9fe8d8);
  r.cyl('glass', 0.07, 0.07, 0.16, -0.55, 1.05, -2.9, 0xffffff, 12);
  // the back bar: open shelves of cups and bags of beans
  for (const y of [1.55, 2.0]) {
    r.box('matte', 3.0, 0.04, 0.26, -4.4, y, -D / 2 + 0.14, OAK);
    for (let i = 0; i < 9; i++) r.cyl('gloss', 0.045, 0.04, 0.09, -5.7 + i * 0.32, y + 0.04, -D / 2 + 0.14, i % 3 ? CREAM : 0xc8643b, 10);
  }
  for (let i = 0; i < 5; i++) r.rbox('soft', 0.18, 0.28, 0.12, 1.6 + i * 0.3, 1.05, -D / 2 + 0.2, [0xb07a4a, 0x3a4a3a, 0xc8643b, 0xe6dccb, 0x2b2622][i], 0.03);
  r.solid(-5.7, -3.6, 1.9, -2.75, 0, 1.1);
  r.solid(-5.9, -D / 2, 2.6, -D / 2 + 0.35, 0, 2.2);
  // booths along the terracotta wall, with lamps on brass arms over each table
  for (const z of [-2.55, 0.55]) {
    rectTable(r, 5.75, z, 1.0, 0.7, 0xe6ddcf, 0.74, Math.PI / 2);
    booth(r, 5.75, z - 0.86, 1.3, 0, SAGE);
    booth(r, 5.75, z + 0.86, 1.3, Math.PI, SAGE);
    r.cyl('metal', 0.012, 0.012, 0.5, 6.42, 1.75, z, BRASS, 6);
    r.add('metal', new THREE.SphereGeometry(0.13, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), BRASS, 6.1, 1.95, z);
    r.sphere('glow', 0.045, 6.1, 1.92, z, 0xffd9a8);
    r.lamp(6.0, 1.85, z, 0xffcf96, 3.2, 4.5);
    r.cyl('gloss', 0.05, 0.045, 0.1, 5.55, 0.74, z + 0.1, CREAM, 10);
    r.cyl('gloss', 0.11, 0.11, 0.012, 5.95, 0.74, z - 0.12, 0xf4f2ee, 16);
  }
  // café tables in the middle
  const tables = [[-4.3, 0.2], [-1.9, 0.0], [-4.4, 2.5], [-1.6, 2.4], [0.9, 1.0]];
  tables.forEach(([x, z], i) => {
    roundTable(r, x, z, 0.36, 0xe8e0d0, 0.74);
    chair(r, x - 0.62, z, Math.PI / 2, i % 2 ? 0x3a3c40 : 0x6d4a34);
    chair(r, x + 0.62, z, -Math.PI / 2, i % 2 ? 0x3a3c40 : 0x6d4a34);
    r.cyl('gloss', 0.045, 0.04, 0.09, x + 0.1, 0.74, z - 0.05, i % 2 ? CREAM : 0xc8643b, 10);
  });
  // a ledge along the front window with stools
  r.rbox('gloss', 7.6, 0.05, 0.42, -2.2, 1.04, D / 2 - 0.3, OAK, 0.015);
  for (const x of [-5.8, -2.2, 1.4]) r.box('metal', 0.04, 1.04, 0.04, x, 0, D / 2 - 0.2, DARK);
  r.solid(-6.0, D / 2 - 0.55, 1.6, D / 2, 0, 1.08);
  for (let i = 0; i < 6; i++) stool(r, -5.4 + i * 1.25, D / 2 - 0.85, 0x6d4a34, 0.75);
  r.streetWindow(-2.2, 8.0, 1.9, 1.12);
  r.exitDoor(4.6, 0x2b2622);
  // ceiling: oak beams, pendants over the counter and the room
  for (let k = 0; k < 7; k++) r.box('matte', 0.18, 0.22, D, -5.8 + k * 1.95, H - 0.22, 0, 0x9a6a42);
  for (const x of [-4.4, -1.9, 0.6]) pendant(r, x, -3.15, 1.25, 0x2b2622, 0xffd6a0, 5.5, 5.5, 'cone');
  pendant(r, -3.1, 1.3, 1.0, 0xe9e2d6, 0xffd9a8, 6, 6.5);
  pendant(r, -0.3, 1.4, 1.0, 0xe9e2d6, 0xffd9a8, 6, 6.5);
  // a soft wash down the back wall and daylight through the window
  r.lamp(-1.5, 3.2, -4.3, 0xffe0bc, 4, 6, [0, -1, 0.15], 1.1);
  r.lamp(-2.2, 2.2, D / 2 - 0.6, 0xdfeaff, 5, 7.5);
  // greenery, art, a coat stand by the door
  plant(r, -6.0, D / 2 - 1.3, 1.5, 'palm');
  plant(r, 6.05, 2.4, 1.2, 'bush');
  plant(r, 2.8, -4.4, 1.7, 'tree');
  for (let i = 0; i < 3; i++) art(r, 11 + i, -W / 2 + 0.02, 2.0, -2.2 + i * 1.6, 0.7, 0.9, Math.PI / 2);
  r.box('matte', 0.03, 1.1, D - 0.1, -W / 2 + 0.03, 0, 0, SAGE);   // sage wainscot on the left wall
  r.box('matte', 0.05, 0.05, D - 0.1, -W / 2 + 0.05, 1.1, 0, 0xd9cdb6);
  r.cyl('metal', 0.02, 0.03, 1.8, 3.4, 0, D / 2 - 0.4, DARK, 8);
  for (let k = 0; k < 4; k++) r.sphere('soft', 0.12, 3.4 + Math.cos(k * 1.6) * 0.14, 1.65 - k * 0.05, D / 2 - 0.4 + Math.sin(k * 1.6) * 0.14, [0xc8643b, 0x3a4a6a, 0xd2b98c, 0x2f5d46][k], 1, 1.6, 1);
  return r.build(origin);
}

const BARISTA = look(17, { f: true, topType: 'shirt', top: 0xefe5d1, top2: 0xefe5d1, bottomType: 'trousers', bottom: 0x2b2d31, hairStyle: 'bun', hair: 0x2a1c13, hatType: null, glasses: false, bag: null, shoeType: 'sneaker', shoe: 0x1d1e21 });

export const CAFE = {
  id: 'cafe', name: 'Context Café', shop: 'CONTEXT CAFÉ', near: [-418, 212], color: 0xd97757, css: '#b9825a', icon: '☕', sub: 'coffee · food · gossip',
  signText: 'CONTEXT CAFÉ', signSub: 'OPEN · COFFEE & FOOD',
  make(origin, rooms) {
    const room = build(origin);
    const S = () => G.save.interiors;
    const order = () => {
      const regular = (S().best.cafeBuys || 0) >= 3;
      return {
        ...WHO, text: regular ? 'Regulars get ten percent off. Same as always?' : 'What can I get you?',
        choices: [
          ...MENU.map((m) => {
            const cost = Math.round(m.cost * (regular ? 0.9 : 1));
            return { label: m.label, note: `${price(cost)} · +${m.hp} health`, disabled: G.save.tokens < cost, then: () => {
              if (!pay(cost)) return null;
              heal(m.hp);
              S().best.cafeBuys = (S().best.cafeBuys || 0) + 1;
              if (S().best.cafeBuys === 3) G.hud.toast('Mira knows your order now — regulars get 10% off', '#d97757');
              return { ...WHO, text: m.say };
            } };
          }),
          { label: 'Nothing for now', then: () => ({ ...WHO, text: pick(['No rush. The coffee is patient.', 'Sure. Holler when the craving hits.']) }) },
        ],
      };
    };
    const people = [
      { id: 'mira', name: 'Mira', ...WHO, look: BARISTA, x: -2.4, z: -3.95, h: 0, pose: 'idle', reach: 2.4, prompt: 'Order from Mira', faceH: 0,
        talk: (m) => {
          const v = S().visits.cafe || 1;
          const hello = m.n === 1 && v <= 1 ? 'Welcome to Context Café. House rule: we remember your order for exactly as long as you stay.'
            : v > 4 ? pick(['Kestrel! Your usual is on the tip of my context window.', 'There she is. Or he. Or the operative. You know what I mean.', 'Back again. You keep this place in business.'])
              : pick(['Hey, you came back. Good taste.', 'Look who it is. Coffee?', 'Welcome back. The beans missed you.']);
          return { ...WHO, text: hello, choices: [
            { label: 'Order something', then: order },
            { label: 'Heard anything interesting?', then: () => {
              const job = jobTip();
              return { ...WHO, text: job ? `A courier was in earlier, all twitchy, talking about "${job}". I put it on your map — I didn't say it was me.` : 'Quiet week. Even the gossip is rate limited.' };
            } },
            { label: 'How is business?', then: () => ({ ...WHO, text: pick(['Busy. Everyone downtown runs on tokens and espresso, in that order.', 'Good. A man ordered a coffee "with infinite context" this morning. I gave him a refill card.', 'Ever since the tower opened, we sell more cold brew than water.']) }) },
          ] };
        } },
      { id: 'theo', name: 'Theo', role: 'Regular', color: '#7d9474', look: look(44, { glasses: true, topType: 'sweater', top: 0x6b7a3c }), x: 5.75, z: -1.5, h: Math.PI, pose: 'sit', seatH: 0.5,
        talk: (m) => ({ who: 'THEO', role: 'Writer, allegedly', color: '#9fb39a',
          text: m.n > 1 ? 'Chapter forty-one is also just the word "continue". It is a stylistic choice.' : 'I am writing a novel. Well — prompting one. Chapter forty is just the word "continue".',
          choices: [
            { label: 'Seen anything odd lately?', then: () => { const w = weightRumour(); return { who: 'THEO', role: 'Writer, allegedly', color: '#9fb39a', text: w ? `For my research, of course: there is one of those glowing Lost Weights out by ${w}` : 'You found them all? Then my plot is ruined.' }; } },
            { label: 'Good luck with it', then: () => ({ who: 'THEO', role: 'Writer, allegedly', color: '#9fb39a', text: 'Luck is just a well-tuned temperature.' }) },
          ] }) },
      { id: 'priya', name: 'Priya', role: 'Customer', color: '#c77dff', look: look(61, { f: true }), x: -1.9 + 0.62, z: 0.0, h: -Math.PI / 2, pose: 'sitPhone', seatH: 0.47,
        talk: () => ({ who: 'PRIYA', role: 'On hold', color: '#c9a0e8', text: pick(['Shh — I am on hold with the Safety Center. They want to know if my toaster is aligned.', 'Do you know how long the wait music at the clinic is? Forty minutes. It is one note.']) }) },
      { id: 'jun', name: 'Jun', role: 'Customer', color: '#5ff3ff', look: look(93, { phones: true }), x: -1.65, z: D / 2 - 0.85, h: 0, pose: 'sit', seatH: 0.78,
        talk: () => ({ who: 'JUN', role: 'Radio head', color: '#5ff3ff', text: 'Have you heard HAIKU RADIO after midnight? Five, seven, five, all the way down. Changed my life. Slightly.',
          choices: [{ label: 'Any other tips?', then: () => { const c = rooms.places.get('club'); if (c && c.door) pointTo(c.door.mx, c.door.mz); return { who: 'JUN', role: 'Radio head', color: '#5ff3ff', text: 'The Latent Space Bar on Sonnet Boulevard. The DJ lets you take the decks if you can keep the beat. Pays, too. I marked it for you.' }; } }, { label: 'Later', then: () => null }] }) },
      { id: 'sam', name: 'Sam', role: 'Customer', color: '#ffb347', look: look(128), x: 0.3, z: -2.25, h: Math.PI, pose: 'phone',
        talk: () => ({ who: 'SAM', role: 'Waiting', color: '#ffb347', text: pick(['I ordered an oat cortado twenty minutes ago. Mira says it is "thinking".', 'They put a tiny tower in the foam. I could not drink it. I took a photo instead.']) }) },
    ];
    const dayLamp = room.lamps.length - 1;
    return {
      room, people, entry: { x: 4.6, z: D / 2 - 1.1, h: Math.PI },
      spots: [{ x: room.door.x, z: room.door.z + 0.4, r: 1.2, label: 'Leave', use: () => rooms.go(null) }],
      ambience: { sky: 0xffe6cc, ground: 0x6a4a34, hemi: 0.42, env: 0.65, exposure: 1.0, bloom: [0.95, 0.28] },
      music: { station: 3, volume: 0.45 },
      onEnter: (n) => { if (n === 1) G.hud.toast('Context Café — talk to Mira at the counter for food (restores health)'); },
      update() {
        // daylight through the window fades out at night
        rooms.setLamp(dayLamp, { ...room.lamps[dayLamp], power: 5 * (1 - G.env.night * 0.9) });
      },
    };
  },
};
