// Latent Space Bar: a club off Sonnet Boulevard. A lit dance floor, a DJ on a stage, a long bar
// with drinks that make the room sway, velvet booths, moving lights that keep to the beat — and a
// DJ who lets you take the decks if you can keep time (see rhythm.js).
import * as THREE from 'three';
import { G } from '../state.js';
import { Room, terrazzoTex, labelTex, stool, booth, roundTable, bottleShelf, plant } from './kit.js';
import { look, price, pay, heal, jobTip } from './people.js';
import { Rhythm } from './rhythm.js';
import { pick } from '../util/rng.js';

const W = 20, D = 16, H = 5.2;
const FLOOR = { x: 0.5, z: -0.5, w: 8, d: 6, nx: 8, nz: 6 };
const STAGE = { z0: -D / 2, z1: -5.2, y: 0.6 };
const BAR = { x: 8.1 };
const SPOTS = [0xffb347, 0xff5f8a, 0x2fd6c6, 0xb48cff];

// The dance floor: a grid of frosted tiles lit from below in waves that follow the music.
function floorMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uBeat: { value: 0 }, uT: { value: 0 }, uHype: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uBeat, uT, uHype;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 g = vUv * vec2(${FLOOR.nx}.0, ${FLOOR.nz}.0), id = floor(g), f = fract(g);
        float bar = floor(uBeat / 4.0), ph = fract(uBeat);
        // a ring that travels out from the middle on every beat, plus random tiles that flash
        float d = length(id + 0.5 - vec2(${FLOOR.nx / 2}.0, ${FLOOR.nz / 2}.0));
        float ring = smoothstep(1.2, 0.0, abs(d - ph * 5.0)) * (1.0 - ph);
        float flash = step(0.82 - uHype * 0.2, h(id + floor(uBeat))) * (1.0 - ph * 0.8);
        float k = max(ring, flash * 0.8) + 0.06;
        vec3 a = vec3(1.0, 0.55, 0.25), b = vec3(0.25, 0.85, 0.8), c = vec3(0.75, 0.45, 1.0);
        float m = fract(bar * 0.37 + h(id) * 0.3);
        vec3 col = m < 0.33 ? a : m < 0.66 ? b : c;
        // frosted glass: bright in the middle of a tile, dark grout between
        float edge = smoothstep(0.0, 0.08, f.x) * smoothstep(1.0, 0.92, f.x) * smoothstep(0.0, 0.08, f.y) * smoothstep(1.0, 0.92, f.y);
        float soft = 1.0 - 0.45 * length(f - 0.5);
        gl_FragColor = vec4(col * col * k * edge * soft * 1.6 + vec3(0.008), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

function build(origin) {
  const r = new Room(W, D, H, { floor: terrazzoTex('club', '#141317', ['#2a2830', '#3a3540', '#5a4a3a', '#1c1b20', '#6a5a7a']), floorRepeat: 3, floorRough: 0.18, wall: 0x2a2430, ceiling: 0x141317, trim: 0x18161c, frontWall: 0x231e29 });
  const BLACK = 0x121115, VELVET = 0x6a2438, BRASS = 0xc9a24a, PLUM = 0x3a2a44;
  const pulse = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(2, 2, 2), toneMapped: false });
  r.batch('pulse', pulse);
  r.pulse = pulse;
  // acoustic slats on the side walls, a glowing line along the top of the walls
  for (let i = 0; i < 46; i++) {
    const z = -D / 2 + 0.4 + i * 0.33;
    if (z > 7) break;
    r.box('matte', 0.06, 3.4, 0.12, -W / 2 + 0.06, 0.4, z, i % 2 ? 0x3a3040 : 0x2e2636);
  }
  for (const [x, ry, len] of [[-W / 2 + 0.05, Math.PI / 2, D], [W / 2 - 0.05, Math.PI / 2, D]]) r.box('pulse', len - 0.4, 0.035, 0.03, x, 4.1, 0, 0xff6a4a, ry);
  r.box('pulse', W - 0.4, 0.035, 0.03, 0, 4.1, -D / 2 + 0.05, 0xff6a4a);
  // dance floor: the tiles, a dark rim and a step
  const fm = floorMaterial();
  r.floorMat = fm;
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR.w, FLOOR.d).rotateX(-Math.PI / 2), fm);
  tiles.position.set(FLOOR.x, 0.08, FLOOR.z);
  r.extra.push(tiles);
  r.rbox('metal', FLOOR.w + 0.3, 0.075, FLOOR.d + 0.3, FLOOR.x, 0, FLOOR.z, 0x1a191d, 0.03);
  // stage with the DJ booth, decks, speakers and the screen
  r.rbox('gloss', W - 7.6, STAGE.y, STAGE.z1 - STAGE.z0, 0.5, 0, (STAGE.z0 + STAGE.z1) / 2, 0x1a181c, 0.03);
  r.box('pulse', W - 7.7, 0.03, 0.02, 0.5, STAGE.y - 0.08, STAGE.z1 + 0.01, 0xffb347);
  for (const x of [-2.4, 3.4]) { r.rbox('matte', 1.2, 0.3, 0.5, x, 0, STAGE.z1 + 0.25, 0x1f1d22, 0.03); r.solid(x - 0.6, STAGE.z1, x + 0.6, STAGE.z1 + 0.5, 0, 0.3); }
  r.solid(-5.9, STAGE.z0, 6.9, STAGE.z1, 0, STAGE.y);
  const by = STAGE.y, bz = -6.4;
  r.rbox('gloss', 3.2, 1.05, 0.9, 0.5, by, bz, BLACK, 0.06);
  r.box('pulse', 3.0, 0.05, 0.02, 0.5, by + 0.55, bz + 0.46, 0x2fd6c6);
  r.rbox('metal', 3.3, 0.04, 1.0, 0.5, by + 1.05, bz, 0x2a2b2f, 0.015);
  for (const x of [-0.45, 1.45]) {
    r.cyl('metal', 0.24, 0.24, 0.03, x, by + 1.09, bz, 0x3a3c40, 28);
    r.cyl('gloss', 0.18, 0.18, 0.012, x, by + 1.12, bz, 0x0e0e10, 28);
    r.cyl('glow', 0.03, 0.03, 0.014, x, by + 1.125, bz, 0xffb347, 10);
  }
  r.rbox('metal', 0.6, 0.06, 0.42, 0.5, by + 1.09, bz, 0x1f2023, 0.02);
  for (let i = 0; i < 8; i++) r.box('glow', 0.03, 0.012, 0.03, 0.28 + (i % 4) * 0.15, by + 1.15, bz - 0.1 + Math.floor(i / 4) * 0.2, i % 3 ? 0x2fd6c6 : 0xff5f8a);
  r.solid(-1.2, bz - 0.5, 2.2, bz + 0.5, 0, by + 1.1);
  for (const x of [-4.6, 5.6]) {
    r.rbox('matte', 1.1, 2.6, 0.9, x, by, -7.2, 0x151417, 0.05);
    for (const [y, rr] of [[0.6, 0.32], [1.5, 0.32], [2.25, 0.14]]) {
      r.add('metal', new THREE.CylinderGeometry(rr + 0.03, rr + 0.03, 0.02, 24), 0x3a3c40, x, by + y, -6.74, Math.PI / 2, 0, 0);
      r.sphere('gloss', rr * 0.75, x, by + y, -6.72, 0x0c0c0e, 1, 1, 0.3, 2);
    }
    r.solid(x - 0.6, -7.7, x + 0.6, -6.7, 0, by + 2.6);
  }
  r.quad(labelTex('club-screen', 1024, 384, '#0c0b10', [{ t: 'LATENT SPACE', size: 104, color: '#ff8a5c', y: 150, spacing: 10 }, { t: 'BAR · CLUB · TOKENS WELCOME', size: 40, color: '#b48cff', y: 270, spacing: 10, weight: 700 }]), 7.2, 2.7, 0.5, by + 2.9, -D / 2 + 0.07, 0, { basic: true });
  r.box('metal', 7.5, 3.0, 0.08, 0.5, by + 1.4, -D / 2 + 0.01, 0x1a191d);
  // the bar: a long counter down the right side with backlit shelves of bottles behind
  r.rbox('gloss', 1.0, 1.08, 8.6, BAR.x, 0, 0.6, 0x241f26, 0.04);
  r.box('pulse', 0.02, 0.04, 8.4, BAR.x - 0.51, 0.95, 0.6, 0xffb347);
  r.rbox('gloss', 1.2, 0.06, 8.8, BAR.x, 1.08, 0.6, 0x3a2a22, 0.02);
  r.add('metal', new THREE.CylinderGeometry(0.025, 0.025, 8.4, 8), BRASS, BAR.x - 0.62, 0.22, 0.6, Math.PI / 2, 0, 0);
  r.solid(BAR.x - 0.6, -3.7, BAR.x + 0.6, 4.9, 0, 1.12);
  r.solid(W / 2 - 0.4, -4, W / 2, 5, 0, 3);
  r.box('glow', 0.02, 2.0, 8.0, W / 2 - 0.03, 0.95, 0.6, 0x5a3a28);
  for (const z of [-2.6, 0.6, 3.8]) bottleShelf(r, W / 2 - 0.2, z, 2.9, -Math.PI / 2, 3, 1.15, true);
  for (let i = 0; i < 7; i++) stool(r, BAR.x - 1.05, -2.8 + i * 1.15, VELVET, 0.78);
  for (let i = 0; i < 5; i++) r.cyl('glass', 0.035, 0.03, 0.12, BAR.x - 0.2, 1.14, -2.4 + i * 1.7, 0xffffff, 10);
  // lounge: velvet booths round low tables, candles on them
  for (const z of [-2.6, 1.2, 4.6]) {
    booth(r, -W / 2 + 1.0, z, 2.4, Math.PI / 2, VELVET, 0x1a1418);
    roundTable(r, -W / 2 + 2.25, z, 0.42, 0x2a2228, 0.48, 0x18161a);
    r.cyl('glow', 0.03, 0.035, 0.07, -W / 2 + 2.25, 0.48, z, 0xffb06a, 10);
  }
  plant(r, -W / 2 + 0.7, 6.8, 1.9, 'palm', 0x2a2630);
  plant(r, W / 2 - 1.0, 6.7, 1.6, 'tree', 0x2a2630);
  // a truss over the floor that carries the moving heads and the mirror ball
  for (const z of [FLOOR.z - 3.2, FLOOR.z + 3.2]) r.box('metal', 10, 0.18, 0.18, FLOOR.x, H - 0.9, z, 0x2a2b2f);
  for (const x of [FLOOR.x - 4.9, FLOOR.x + 4.9]) r.box('metal', 0.18, 0.18, 6.6, x, H - 0.9, FLOOR.z, 0x2a2b2f);
  const heads = [[-3, -3.2], [4, -3.2], [-3, 2.7], [4, 2.7]].map(([x, z]) => [FLOOR.x + x * 0.95, FLOOR.z + z]);
  for (const [x, z] of heads) { r.rbox('metal', 0.3, 0.32, 0.3, x, H - 1.25, z, 0x1c1d20, 0.06); r.sphere('glow', 0.07, x, H - 1.26, z, 0xffffff); }
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), new THREE.MeshStandardMaterial({ color: 0xdde2e8, metalness: 1, roughness: 0.12, flatShading: true, envMapIntensity: 2.2 }));
  ball.position.set(FLOOR.x, H - 1.5, FLOOR.z); ball.userData.live = true;
  r.extra.push(ball);
  r.cyl('metal', 0.01, 0.01, 1.0, FLOOR.x, H - 1.1, FLOOR.z, 0x18191b, 4);
  r.ball = ball; r.heads = heads;
  // the door and the bouncer's rope
  r.exitDoor(-6.5, 0x18161a);
  for (const x of [-4.6, -2.6]) { r.cyl('metal', 0.03, 0.05, 0.95, x, 0, 6.6, BRASS, 10); r.sphere('metal', 0.06, x, 0.98, 6.6, BRASS); }
  r.add('soft', new THREE.TorusGeometry(1.0, 0.035, 6, 20, Math.PI), VELVET, -3.6, 0.9, 6.6, Math.PI, 0, 0);
  // lamps: four moving heads (aimed every frame), the bar, the lounge, the DJ and a fill
  for (const [x, z] of heads) r.lamp(x, H - 1.35, z, 0xffffff, 40, 11, [0, -1, 0], 0.32);
  r.lamp(BAR.x - 0.3, 3.2, -1.5, 0xffb070, 7, 7);
  r.lamp(BAR.x - 0.3, 3.2, 3.2, 0xffb070, 7, 7);
  r.lamp(-W / 2 + 2.2, 2.2, -0.7, 0xff9a6a, 4.5, 6);
  r.lamp(-W / 2 + 2.2, 2.2, 4.0, 0xff9a6a, 4.5, 6);
  r.lamp(0.5, by + 2.6, -5.6, 0xb48cff, 7, 7);
  r.lamp(FLOOR.x, 0.6, FLOOR.z, 0xffa060, 5, 6.5);
  r.lamp(-3, H - 0.4, 5.5, 0xffd2b0, 3, 9);
  return r.build(origin);
}

const DJ = look(52, { topType: 'bomber', top: 0x17181c, top2: 0x0d0d0f, phones: true, glasses: true, hatType: 'capback', hatCol: 0xff8a5c, bottomType: 'joggers', bottom: 0x1d1e21 });
const BARTENDER = look(140, { f: true, topType: 'shirt', top: 0x1d1e21, top2: 0x1d1e21, bottomType: 'trousers', bottom: 0x1d1e21, hairStyle: 'pony', hair: 0x8f4a26, hatType: null, glasses: false, bag: null });
const BOUNCER = look(77, { topType: 'blazer', top: 0x17181c, top2: 0x2b2d31, bottomType: 'trousers', bottom: 0x17181c, glasses: true, hairStyle: 'buzz', hatType: null, build: 1.14, depth: 1.1, bag: null, shoeType: 'dress', shoe: 0x111214 });
const NADIA = { who: 'NADIA', role: 'Bartender', color: '#ffb347' };
const DRINKS = [
  { label: 'Latent Lager', cost: 30, sway: 45, amp: 0.55, hp: 0, say: 'One Latent Lager. It tastes like a vector pointing at "beer".' },
  { label: 'Gradient Fizz (no alcohol)', cost: 25, sway: 0, amp: 0, hp: 15, say: 'Gradient Fizz: starts sweet, ends sour, converges eventually.' },
  { label: 'Context Overflow', cost: 80, sway: 100, amp: 1.0, hp: 0, say: 'The Context Overflow. Nobody remembers finishing one. That is the point.' },
];

export const CLUB = {
  id: 'club', name: 'Latent Space Bar', shop: 'LATENT SPACE BAR', near: [318, -15], color: 0xb48cff, css: '#a14fc9', icon: '♫', sub: 'drinks · dancing · the decks',
  signText: 'LATENT SPACE', signSub: 'CLUB · OPEN LATE',
  make(origin, rooms) {
    const room = build(origin);
    const S = () => G.save.interiors;
    const bar = () => ({ ...NADIA, text: pick(['What are we drinking?', 'Name your poison. Metaphorically. We are fully licensed.', 'Thirsty? The menu is short and the pours are long.']),
      choices: [
        ...DRINKS.map((d) => ({ label: d.label, note: price(d.cost) + (d.hp ? ` · +${d.hp} health` : ' · the room sways'), disabled: G.save.tokens < d.cost, then: () => {
          if (!pay(d.cost)) return null;
          if (d.hp) heal(d.hp);
          if (d.sway) rooms.drink(d.sway, d.amp);
          S().best.drinks = (S().best.drinks || 0) + 1;
          return { ...NADIA, text: d.say };
        } })),
        { label: 'Just water', then: () => { heal(5); return { ...NADIA, text: 'Hydration. The most aligned drink of all.' }; } },
      ] });
    const dancers = [];
    const people = [
      { id: 'dj', name: 'DJ Vector', who: 'DJ VECTOR', look: DJ, x: 0.5, z: -7.05, h: 0, pose: 'dance', reach: 2.6, prompt: 'Talk to DJ Vector', y: STAGE.y,
        talk: (m) => {
          const best = S().best.dance || 0;
          return { who: 'DJ VECTOR', role: 'Resident DJ', color: '#2fd6c6',
            text: m.n === 1 ? 'You look like somebody with rhythm. Want to take the decks? Hit the pads on the beat, keep the floor moving, I pay you in tokens.'
              : best ? `Back for more? Your best set scored ${best.toLocaleString()}. Beat it.` : 'The decks are still warm. Ready?',
            choices: [
              { label: 'Take the decks', note: Rhythm.feeWait() ? `encore · paid again in ${Math.ceil(Rhythm.feeWait() / 60)} min` : 'mini-game · pays Tokens', then: () => { Rhythm.start(rooms, room, () => dancers); return null; } },
              { label: 'Play something for me', then: () => ({ who: 'DJ VECTOR', role: 'Resident DJ', color: '#2fd6c6', text: pick(['This one is off CONSTITUTION 106.1. Four on the floor, fully aligned.', 'You want requests? Request accepted. Request ignored. That is how it works here.']) }) },
              { label: 'Later', then: () => null },
            ] };
        } },
      { id: 'nadia', name: 'Nadia', ...NADIA, look: BARTENDER, x: BAR.x + 0.95, z: 0.4, h: -Math.PI / 2, pose: 'idle', reach: 2.4, prompt: 'Order a drink', talk: (m) => (m.n === 1 ? { ...NADIA, text: 'First time at the Latent? Welcome. Drinks here make the room move. That is a feature.', next: bar } : bar()) },
      { id: 'brick', name: 'Brick', look: BOUNCER, x: -5.2, z: 6.2, h: Math.PI, pose: 'cross',
        talk: () => ({ who: 'BRICK', role: 'Door', color: '#ff4d5e', text: pick(['Behave and we are friends. Throw a punch and you are on the pavement.', 'No weapons, no drama, no recursion.', 'I have one job and I am very aligned with it.']) }) },
      { id: 'ivy', name: 'Ivy', look: look(33, { f: true, topType: 'dress', top: 0xa898cf }), x: -W / 2 + 1.15, z: -2.0, h: Math.PI / 2, pose: 'sit', seatH: 0.5,
        talk: () => { const j = jobTip(); return { who: 'IVY', role: 'Regular', color: '#c77dff', text: j ? `You look like you do... jobs. Somebody here was whispering about "${j}". Marked it for you. You did not hear it from me.` : 'Everyone in here is somebody. Tonight I am nobody. It is relaxing.' }; } },
      { id: 'omar', name: 'Omar', look: look(150, { topType: 'shirt', top: 0xdca236 }), x: -W / 2 + 1.15, z: 1.8, h: Math.PI / 2, pose: 'sit', seatH: 0.5,
        talk: () => ({ who: 'OMAR', role: 'Dancer, retired', color: '#dca236', text: pick(['I used to dance every night. Then my knees started asking for a refusal policy.', 'The DJ? Vector. Plays nothing but four on the floor. Never misses a beat. Suspicious, honestly.']) }) },
    ];
    // a crowd on the dance floor, each moving a little differently
    for (let i = 0; i < 10; i++) {
      const a = i * 2.39996, rr = 0.8 + (i % 4) * 0.7;
      people.push({ id: 'dancer' + i, name: 'Dancer', look: look(200 + i * 7), x: FLOOR.x + Math.cos(a) * rr * 1.2, z: FLOOR.z + Math.sin(a) * rr * 0.9, h: Math.PI + ((i % 5) - 2) * 0.35, pose: 'dance', y: 0.08,
        talk: i % 3 === 0 ? () => ({ who: 'DANCER', role: '', color: '#ff5f8a', text: pick(['WHAT? I CANNOT HEAR YOU!', 'This song is my whole personality!', 'Come dance! Or take the decks, the DJ lets people!']) }) : null });
    }
    const djSpot = { x: 0.5, z: -7.0 };
    return {
      room, people, entry: { x: -6.5, z: D / 2 - 2.2, h: Math.PI },
      spots: [{ x: room.door.x, z: room.door.z + 0.4, r: 1.2, label: 'Leave', use: () => rooms.go(null) }],
      ambience: { sky: 0x9a7ab0, ground: 0x3a2430, hemi: 0.32, env: 0.45, exposure: 1.12, bloom: [0.82, 0.55] },
      music: { station: 4, volume: 0.9 },
      djSpot, stage: STAGE, rhythm: Rhythm,
      onEnter: (n) => {
        dancers.length = 0;
        for (const p of people) if (p.pose === 'dance' && p.p) dancers.push(p.p);
        if (n === 1) G.hud.toast('Latent Space Bar — Nadia serves drinks, DJ Vector lets you take the decks');
      },
      update(dt, t) {
        const beat = rooms.beat() ?? t * (128 / 60);
        const ph = beat % 1, kick = Math.exp(-ph * 5);
        room.floorMat.uniforms.uBeat.value = beat;
        room.floorMat.uniforms.uHype.value = Rhythm.hype;
        room.pulse.color.setScalar(1.2 + kick * 1.4);
        room.ball.rotation.y += dt * 0.6;
        // moving heads sweep in figure-eights and change colour every bar
        const bar = Math.floor(beat / 4);
        room.heads.forEach(([x, z], i) => {
          const a = t * 0.7 + i * 1.6, sx = Math.sin(a) * 0.55, sz = Math.sin(a * 2) * 0.35;
          rooms.setLamp(i, { x, y: H - 1.35, z, color: SPOTS[(i + bar) % 4], power: 34 + kick * 24, range: 11, dir: [sx, -1, sz], cone: 0.3 });
        });
        rooms.setLamp(9, { x: FLOOR.x, y: 0.6, z: FLOOR.z, color: SPOTS[bar % 4], power: 3 + kick * 5, range: 6.5 });
        // the dancers keep their spots but turn a little now and then
        for (const p of dancers) if (!p.removed && Math.random() < dt * 0.15) p.heading += (Math.random() - 0.5) * 1.2;
      },
      lateUpdate(dt, t) { Rhythm.frame(dt, t); },
      onLeave() { Rhythm.stop(true); },
    };
  },
};
