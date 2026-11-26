// Fine-Tune Barber: checker floor, teal tiles, two chrome-and-oxblood chairs at lit mirrors.
// Rafa changes your hair (and hat and shades) in front of the mirror, for a price.
import * as THREE from 'three';
import { G } from '../state.js';
import { Room, tileTex, subwayTex, labelTex, plant, pendant, art } from './kit.js';
import { look, price, pay } from './people.js';
import { OUTFITS } from '../entities/player.js';
import { pick } from '../util/rng.js';

const W = 9, D = 8, H = 3.4;
const RAFA = { who: 'RAFA', role: 'Barber', color: '#4a8fd0' };
const KEYS = ['hair', 'hair colour', 'headwear', 'shades'];
const COST = 45;

// A barber's pole: a striped glass cylinder that turns.
function poleTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, 64, 256);
  for (let k = -8; k < 16; k++) {
    g.fillStyle = k % 2 ? '#c8443b' : '#3557a8';
    g.beginPath(); g.moveTo(0, k * 32); g.lineTo(64, k * 32 - 48); g.lineTo(64, k * 32 - 34); g.lineTo(0, k * 32 + 14); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function chairAt(r, x, z) {
  const CHROME = 0xd8dbe0, OX = 0x6a2420;
  r.cyl('metal', 0.32, 0.36, 0.06, x, 0, z, CHROME, 24);
  r.cyl('metal', 0.07, 0.09, 0.42, x, 0.06, z, CHROME, 14);
  r.rbox('metal', 0.62, 0.08, 0.6, x, 0.46, z, 0x2a2b2f, 0.03);
  r.rbox('soft', 0.56, 0.14, 0.56, x, 0.52, z + 0.02, OX, 0.06);
  r.rbox('soft', 0.54, 0.7, 0.14, x, 0.62, z - 0.3, OX, 0.06);
  r.rbox('soft', 0.3, 0.16, 0.1, x, 1.34, z - 0.3, OX, 0.05);
  for (const o of [-0.34, 0.34]) { r.rbox('metal', 0.07, 0.04, 0.5, x + o, 0.84, z, CHROME, 0.02); r.box('metal', 0.03, 0.22, 0.03, x + o, 0.62, z + 0.18, CHROME); }
  r.box('metal', 0.36, 0.03, 0.18, x, 0.18, z + 0.46, CHROME);
  r.box('metal', 0.03, 0.34, 0.03, x, 0.18, z + 0.36, CHROME);
  r.solid(x - 0.36, z - 0.38, x + 0.36, z + 0.38, 0, 0.7);
}
// A mirror station on the back wall: lit frame, shelf of products, a drawer unit.
function station(r, x) {
  const z = -D / 2;
  r.box('metal', 1.3, 1.4, 0.04, x, 1.05, z + 0.03, 0x2a2b2f);
  r.quad(null, 1.18, 1.28, x, 1.75, z + 0.06, 0, { rough: 0.02, color: 0x8e9aa4 });
  r.extra[r.extra.length - 1].material.metalness = 1;
  for (let k = 0; k < 5; k++) { r.sphere('glow', 0.04, x - 0.7, 1.15 + k * 0.29, z + 0.08, 0xffe6c0); r.sphere('glow', 0.04, x + 0.7, 1.15 + k * 0.29, z + 0.08, 0xffe6c0); }
  r.rbox('matte', 1.4, 0.82, 0.46, x, 0, z + 0.25, 0x5a3a26, 0.02);
  r.rbox('gloss', 1.46, 0.04, 0.5, x, 0.82, z + 0.25, 0xf0ece4, 0.012);
  for (let i = 0; i < 5; i++) r.cyl('gloss', 0.035, 0.04, 0.12 + (i % 2) * 0.06, x - 0.5 + i * 0.25, 0.86, z + 0.18, [0x2a9d8f, 0xdca236, 0xf1f1ee, 0x3a4a6a, 0xc8443b][i], 10);
  r.solid(x - 0.75, z, x + 0.75, z + 0.5, 0, 0.9);
  r.lamp(x, 2.4, z + 0.8, 0xfff0dc, 3.5, 4);
}

function build(origin) {
  const r = new Room(W, D, H, { floor: tileTex('barber', '#efebe3', '#1d1e21', 8, '#8a8680'), floorRepeat: 1.6, floorRough: 0.2, wall: 0xece7dd, trim: 0x2a2b2f });
  const TEAL = '#4f8f88';
  // teal tiles up to shoulder height, a dark rail on top
  for (const [w, x, z, ry] of [[W, 0, -D / 2 + 0.01, 0], [D, -W / 2 + 0.01, 0, Math.PI / 2], [D, W / 2 - 0.01, 0, -Math.PI / 2]]) {
    r.quad(subwayTex('barber', TEAL, '#2c4a46'), w - 0.02, 1.5, x, 0.75, z, ry, { rough: 0.18, repeat: [w / 2, 0.75] });
    r.box('metal', w, 0.05, 0.05, x, 1.5, z, 0x2a2b2f, ry);
  }
  station(r, -2.2); station(r, 0.9);
  chairAt(r, -2.2, -2.5); chairAt(r, 0.9, -2.5);
  // a washbasin in the corner
  r.rbox('gloss', 0.7, 0.86, 0.5, 3.4, 0, -D / 2 + 0.28, 0x2a2b2f, 0.03);
  r.add('gloss', new THREE.SphereGeometry(0.24, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xf4f2ee, 3.4, 1.0, -D / 2 + 0.3);
  r.cyl('metal', 0.015, 0.015, 0.3, 3.4, 0.9, -D / 2 + 0.08, 0xd8dbe0, 8);
  r.solid(3.0, -D / 2, 3.8, -D / 2 + 0.55, 0, 1);
  // waiting bench and a low table with magazines along the left wall
  r.rbox('soft', 0.55, 0.12, 2.6, -W / 2 + 0.42, 0.42, 1.0, 0x6a2420, 0.05);
  r.rbox('soft', 0.12, 0.55, 2.6, -W / 2 + 0.12, 0.5, 1.0, 0x6a2420, 0.05);
  for (const z of [-0.2, 2.2]) r.box('metal', 0.5, 0.42, 0.05, -W / 2 + 0.42, 0, z, 0xd8dbe0);
  r.solid(-W / 2, -0.3, -W / 2 + 0.7, 2.3, 0, 0.5);
  r.rbox('gloss', 0.5, 0.04, 0.8, -W / 2 + 1.25, 0.42, 1.0, 0x5a3a26, 0.01);
  for (const z of [-0.25, 0.25]) r.box('metal', 0.04, 0.42, 0.04, -W / 2 + 1.25, 0, 1.0 + z, 0x2a2b2f);
  for (let i = 0; i < 3; i++) r.box('matte', 0.22, 0.012, 0.3, -W / 2 + 1.22 + i * 0.02, 0.46 + i * 0.012, 0.85 + i * 0.1, [0xd97757, 0x2a9d8f, 0xf0e8d8][i], i * 0.3);
  // shelf of products and the price board on the right wall
  for (const y of [1.75, 2.15]) {
    r.box('matte', 0.24, 0.03, 2.4, W / 2 - 0.13, y, -0.6, 0x5a3a26);
    for (let i = 0; i < 10; i++) r.cyl('gloss', 0.035, 0.035, 0.12 + (i % 3) * 0.04, W / 2 - 0.14, y + 0.03, -1.7 + i * 0.24, [0xf1f1ee, 0x1d1e21, 0xdca236, 0x2a9d8f, 0xc8443b][i % 5], 10);
  }
  r.quad(labelTex('barber-board', 256, 384, '#1d1e21', [{ t: 'FINE-TUNE', size: 40, color: '#f0e8d8', y: 44, spacing: 3 }, { t: 'BARBER', size: 26, color: '#4a8fd0', y: 84, spacing: 8 }, { t: 'Haircut ........ 45', size: 20, color: '#efe7da', y: 150, weight: 600 }, { t: 'Colour ......... 45', size: 20, color: '#efe7da', y: 190, weight: 600 }, { t: 'Hat & shades ... 45', size: 20, color: '#efe7da', y: 230, weight: 600 }, { t: 'Hot towel ... free', size: 20, color: '#efe7da', y: 270, weight: 600 }, { t: 'no refunds on regret', size: 16, color: '#8a8680', y: 340, weight: 600 }]), 1.0, 1.5, W / 2 - 0.02, 2.35, 1.9, -Math.PI / 2, { basic: true });
  art(r, 41, -W / 2 + 0.02, 2.35, 1.0, 0.8, 0.6, Math.PI / 2);
  // the pole by the door, turning
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 20, 1, true), new THREE.MeshBasicMaterial({ map: poleTex() }));
  pole.position.set(1.9, 1.9, D / 2 - 0.16); pole.userData.live = true;
  r.extra.push(pole);
  r.pole = pole;
  for (const y of [1.42, 2.38]) r.cyl('metal', 0.11, 0.11, 0.06, 1.9, y, D / 2 - 0.16, 0xd8dbe0, 16);
  r.box('metal', 0.03, 0.03, 0.14, 1.9, 1.9, D / 2 - 0.08, 0xd8dbe0);
  r.streetWindow(-1.5, 4.2, 1.9, 0.8, true);
  r.exitDoor(3.3, 0x2a2b2f);
  plant(r, -W / 2 + 0.5, D / 2 - 0.6, 1.4, 'palm');
  plant(r, W / 2 - 0.5, D / 2 - 0.9, 1.1, 'bush');
  for (const x of [-2.6, 0.0, 2.6]) pendant(r, x, 0.6, 0.85, 0x1d1e21, 0xffe0b8, 4.5, 6, 'dome');
  r.lamp(-1.5, 2.0, D / 2 - 0.6, 0xe6f0ff, 3.5, 6);
  return r.build(origin);
}

const BARBER_LOOK = look(88, { topType: 'shirt', top: 0xf1f1ee, top2: 0xf1f1ee, bottomType: 'trousers', bottom: 0x2b2d31, beard: 'beard', hairStyle: 'side', hair: 0x16110e, hatType: null, glasses: false, bag: null, shoeType: 'dress', shoe: 0x4a3020 });

export const BARBER = {
  id: 'barber', name: 'Fine-Tune Barber', shop: 'FINE-TUNE BARBER', near: [-288, 135], color: 0x4a8fd0, css: '#4a8fd0', icon: '✂', sub: 'cuts · colour · hats',
  signText: 'FINE-TUNE BARBER', signSub: 'WALK-INS WELCOME',
  make(origin, rooms) {
    const room = build(origin);
    // the restyle: Rafa's mirror with the menu camera on the player, paid for on the way out
    const restyle = () => {
      const pl = G.player, o = room.origin;
      pl.teleport(o.x - 2.2, o.y, o.z - 1.55, 0);
      const was = { ...pl.outfit };
      G.mode = 'menu';
      G.cam.yaw = pl.heading + Math.PI * 0.88; G.cam.pitch = 0.08; G.cam.idle = 0; G.cam.update(0.016, G.time);
      const rows = KEYS.map((k) => `<div class="row"><label>${k[0].toUpperCase() + k.slice(1)}</label><div class="picker" data-k="${k}"><button data-d="-1">‹</button><span></span><button data-d="1">›</button></div></div>`).join('');
      const d = G.menus.mount(`<div class="panel"><h2>FINE-TUNE BARBER</h2><p>Rafa squints at you in the mirror. ${price(COST)} for each change. You have <b style="color:var(--amber)" id="bt"></b>.</p>
        ${rows}<button class="btn primary" id="ok">PAY &amp; KEEP <small id="bc"></small></button><button class="btn" id="no">NEVER MIND</button></div>`, 'clear');
      G.menus.kind = 'sub';   // Esc goes through back(): puts the old look back
      const changed = () => KEYS.filter((k) => pl.outfit[k] !== was[k]).length;
      const paint = () => {
        d.querySelectorAll('.picker').forEach((p) => { const k = p.dataset.k; p.querySelector('span').textContent = OUTFITS[k][pl.outfit[k] % OUTFITS[k].length][0]; });
        const n = changed();
        d.querySelector('#bc').textContent = n ? price(n * COST) : 'no change';
        d.querySelector('#bt').textContent = price(G.save.tokens);
        d.querySelector('#ok').disabled = n * COST > G.save.tokens;
      };
      d.querySelectorAll('.picker button').forEach((b) => b.addEventListener('click', () => {
        const k = b.parentElement.dataset.k, n = OUTFITS[k].length;
        pl.outfit[k] = (((Number(pl.outfit[k]) + parseInt(b.dataset.d, 10)) % n) + n) % n;
        pl.applyOutfit(pl.outfit); paint(); G.audio?.play('uiMove');
      }));
      paint();
      const done = (keep) => {
        const n = changed();
        if (keep && n && !pay(n * COST)) keep = false;
        if (!keep) pl.applyOutfit(was);
        G.menus.hooks.resume();
        G.hud.say('RAFA', keep && n ? pick(['Look at you. Fine-tuned.', 'Sharp. Like a well-chosen learning rate.', 'Now that is a look with a low loss.']) : 'Come back when you are ready to commit.');
      };
      G.menus.bind(d, { '#ok': () => done(true), '#no': () => done(false) });
      G.menus.back = () => done(false);
    };
    const people = [
      { id: 'rafa', name: 'Rafa', ...RAFA, look: BARBER_LOOK, x: -1.3, z: -2.2, h: Math.PI / 2, pose: 'idle', reach: 2.0, prompt: 'Talk to Rafa',
        talk: (m) => ({ ...RAFA, text: m.n === 1 ? 'Welcome to Fine-Tune. Sit, relax. I adjust a few parameters and you walk out a new model.' : pick(['Back already? Your hair has been training without me.', 'The usual? Or are we exploring the hyperparameters today?', 'Sit. I will make you look like a release candidate.']),
          choices: [
            { label: 'New look', note: `${price(COST)} per change`, then: () => { restyle(); return null; } },
            { label: 'Any gossip?', then: () => ({ ...RAFA, text: pick(['A guy came in yesterday asking for a haircut "in the style of Claude Tower". I gave him a taper. He cried.', 'They say the receptionist at the tower knows everyone in this city. Bring her a coffee and she knows you too.', 'Someone keeps leaving glowing weights around town. Bad for my chairs. Good for your wallet.']) }) },
            { label: 'Just looking', then: () => null },
          ] }) },
      { id: 'lena', name: 'Lena', look: look(19, { f: true, hairStyle: 'bob' }), x: 0.9, z: -2.56, h: 0, pose: 'sit', seatH: 0.64,
        talk: () => ({ who: 'LENA', role: 'In the chair', color: '#d08aa6', text: pick(['Do not make me laugh, he is holding scissors.', 'I asked for "slightly different". We will see what that means to him.']) }) },
      { id: 'otto', name: 'Otto', look: look(171, { hatType: null, glasses: true }), x: -W / 2 + 0.32, z: 1.4, h: Math.PI / 2, pose: 'sitPhone', seatH: 0.54,
        talk: () => ({ who: 'OTTO', role: 'Waiting', color: '#9fb39a', text: pick(['I have been waiting so long my hair grew another centimetre. Efficient, really.', 'Have you tried the hot towel? It is like a reset for your face.']) }) },
    ];
    return {
      room, people, entry: { x: 3.3, z: D / 2 - 1.1, h: Math.PI },
      spots: [{ x: room.door.x, z: room.door.z + 0.4, r: 1.2, label: 'Leave', use: () => rooms.go(null) }],
      ambience: { sky: 0xeef2f0, ground: 0x4a4440, hemi: 0.5, env: 0.7, exposure: 1.0, bloom: [0.95, 0.25] },
      music: { station: 2, volume: 0.4 },
      onEnter: (n) => { if (n === 1) G.hud.toast('Fine-Tune Barber — Rafa changes your hair, hat and shades'); },
      update(dt) { room.pole.material.map.offset.y -= dt * 0.25; },
    };
  },
};
