// Helicopters in the world: parked machines on the rooftop helipads (the Safety Center, the clinic and
// some downtown towers) and on pads at ground level, "Roof access" markers that take the player up to
// them and back down, respawning, map blips, the parachute canopy, rotor sound for machines nearby,
// and the police helicopter's clean-up. Other streams can use G.heliPads and G.heliTeleport(id).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { G, addPlugin, on } from '../state.js';
import { Input } from '../input.js';
import { Heli } from './heli.js';
import { buildHeliHud } from './heliHud.js';
import { buildings, blockAt, districtAt, SIDEWALK } from '../world/cityplan.js';
import { addBox, addCircle, queryColliders } from '../world/colliders.js';
import { groundHeight, roadAt, KERB } from '../world/roads.js';
import { CITY, POI, WATER_Y } from '../world/layout.js';
import { smoothstep } from '../util/math.js';
import { pick } from '../util/rng.js';
import { BLIP_STYLES } from '../ui/minimap.js';

const GY = CITY.y + KERB;
const DECK = 1.0;            // the pad deck stands this far above the building's collider (city.js)
const RESPAWN = 75;          // seconds before an empty pad gets a new machine
const MAX_TOWERS = 5;        // towers with a machine on the roof (besides the police and the clinic)
const LOD_NEAR = 100, LOD_FAR = 700;
const PAD_TOP = 0.12;         // height of a ground-level pad's deck
BLIP_STYLES.heli = { color: '#9ad4e6', glyph: 'H' };

// The deck of a rooftop pad: where city.js draws it and how far the roof reaches around it.
function roofDeck(b) {
  const circular = b.shape === 'round' || b.shape === 'hyper';
  if (circular) return { x: b.cx, z: b.cz, hw: b.topR * 0.8, hd: b.topR * 0.8, circular };
  const top = b.tiers[b.tiers.length - 1], i2 = top.ins || 0;
  return { x: (top.x0 + top.x1) / 2, z: (top.z0 + top.z1) / 2, hw: (top.x1 - top.x0) / 2 - i2, hd: (top.z1 - top.z0) / 2 - i2, circular, top, i2 };
}

// The building face nearest its block's kerb: the street side, where the roof access door goes.
function streetSide(b) {
  const block = blockAt(b.cx, b.cz), base = b.tiers[0] || { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 };
  const x0 = b.r ? b.cx - b.r : base.x0, x1 = b.r ? b.cx + b.r : base.x1, z0 = b.r ? b.cz - b.r : base.z0, z1 = b.r ? b.cz + b.r : base.z1;
  const m = SIDEWALK;
  const faces = [
    { d: x0 - (block.x0 + m), nx: -1, nz: 0, x: x0, z: (z0 + z1) / 2, span: z1 - z0 },
    { d: block.x1 - m - x1, nx: 1, nz: 0, x: x1, z: (z0 + z1) / 2, span: z1 - z0 },
    { d: z0 - (block.z0 + m), nx: 0, nz: -1, x: (x0 + x1) / 2, z: z0, span: x1 - x0 },
    { d: block.z1 - m - z1, nx: 0, nz: 1, x: (x0 + x1) / 2, z: z1, span: x1 - x0 },
  ];
  faces.sort((a, b) => a.d - b.d);
  const f = faces[0];
  // a little off the middle of the face, clear of the main doors
  const off = Math.min(5, f.span * 0.25);
  return { nx: f.nx, nz: f.nz, x: f.x + f.nx * 2.2 + Math.abs(f.nz) * off, z: f.z + f.nz * 2.2 + Math.abs(f.nx) * off };
}

// A flat, open spot near (x, z) for a pad at ground level: off the roads, out of the water, clear of
// anything a rotor could hit.
function openSpot(x, z, reach) {
  for (let r = 0; r <= reach; r += 6) {
    const n = Math.max(1, Math.round((r * Math.PI * 2) / 12));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      const y = groundHeight(px, pz, 9999);
      if (y < WATER_Y + 0.8) continue;
      if (roadAt(px, pz, 15)) continue;
      let flat = true;
      for (let q = 0; q < 8 && flat; q++) { const b = (q / 8) * Math.PI * 2; if (Math.abs(groundHeight(px + Math.cos(b) * 8, pz + Math.sin(b) * 8, 9999) - y) > 0.3) flat = false; }
      if (!flat) continue;
      let clear = true;
      for (const c of queryColliders(px, pz, 10)) {
        if (c.removed) continue;
        const d = c.type === 'box' ? Math.hypot(Math.max(c.x0 - px, 0, px - c.x1), Math.max(c.z0 - pz, 0, pz - c.z1)) : Math.hypot(c.x - px, c.z - pz) - c.r;
        if (d < 9) { clear = false; break; }
      }
      if (clear) return { x: px, y, z: pz };
    }
  }
  return null;
}

// A pad at ground level: a concrete disc with its markings and a ring of lamps (two meshes).
function padMesh(x, y, z) {
  const g = new THREE.Group();
  const parts = [];
  const add = (geo, hex, py) => { geo = geo.toNonIndexed(); geo.translate(0, py, 0); const c = new THREE.Color(hex), n = geo.getAttribute('position').count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); geo.deleteAttribute('uv'); parts.push(geo); };
  add(new THREE.CylinderGeometry(8.2, 8.5, 0.3, 40), 0x8e9094, PAD_TOP - 0.16);
  add(new THREE.CylinderGeometry(7.4, 7.4, 0.02, 40), 0x4a4c52, PAD_TOP);
  add(new THREE.RingGeometry(5.6, 6.0, 40).rotateX(-Math.PI / 2), 0xe8e2d4, PAD_TOP + 0.015);
  for (const [w, d, px] of [[0.7, 4.6, -1.5], [0.7, 4.6, 1.5], [2.3, 0.7, 0]]) { const b = new THREE.BoxGeometry(w, 0.02, d); b.translate(px, 0, 0); add(b, 0xf2f3f4, PAD_TOP + 0.02); }
  const deck = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  deck.receiveShadow = true;
  const lamps = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, s = new THREE.SphereGeometry(0.14, 8, 5); s.translate(Math.cos(a) * 7.8, PAD_TOP + 0.04, Math.sin(a) * 7.8); lamps.push(s); }
  const glow = new THREE.Mesh(mergeGeometries(lamps.map((s) => { s.deleteAttribute('uv'); return s; })), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe0a8).multiplyScalar(1.6), toneMapped: false }));
  g.add(deck, glow);
  g.position.set(x, y, z);
  return g;
}
class HeliWorld {
  constructor() {
    this.pads = [];
    this.markers = [];
    this.fade = null;          // { t, pad, up } while a roof-access fade is running
    this.checkT = 0;
    this.findPads();
    for (const p of this.pads) this.spawnAt(p);
    G.heliPads = this.pads.map((p) => ({ id: p.id, name: p.name, x: p.x, y: p.y, z: p.z, heading: p.heading, onRoof: p.onRoof }));
    G.heliTeleport = (id) => this.teleport(this.pads.find((p) => p.id === id), true);
    this.canopy = buildCanopy();
    G.scene.add(this.canopy);
    // pads show on the map with the other places
    const M = G.missions, refresh = M.refreshBlips.bind(M);
    M.refreshBlips = () => {
      refresh();
      for (const p of this.pads) G.hud.blips.push({ x: p.street ? p.street.x : p.x, z: p.street ? p.street.z : p.z, type: 'heli', name: p.name });
    };
    M.refreshBlips();
    // the controls, the first couple of times
    on('enteredVehicle', (v) => {
      if (v.cls !== 'heli' || (G.save.heliTips ??= 0) >= 2) return;
      G.save.heliTips++;
      G.hud.toast(Input.touch.on ? 'UP and DOWN climb and descend · the stick flies · GET OUT high up opens a parachute'
        : 'Space climb · Shift descend · W / S fly on or back off · A / D turn · F high up bails out with a parachute');
    });
    on('playerDied', () => this.cancelFade());
    on('playerBusted', () => this.cancelFade());
  }

  findPads() {
    const roofs = buildings.filter((b) => b.roof === 'helipad' && b.kind !== 'tower').map((b) => ({ b, d: roofDeck(b) })).filter((q) => q.d.hw > 8 && q.d.hd > 8);
    // the Safety Center and the clinic always; then the tallest towers
    const keep = roofs.filter((q) => q.b.kind === 'police' || q.b.kind === 'clinic');
    const rest = roofs.filter((q) => !keep.includes(q)).sort((a, b) => b.b.h - a.b.h);
    for (const q of rest) {
      if (keep.length >= MAX_TOWERS + 2) break;
      if (keep.every((k) => Math.hypot(k.d.x - q.d.x, k.d.z - q.d.z) > 90)) keep.push(q);
    }
    let n = 0;
    for (const { b, d } of keep) {
      const deckY = GY + b.h + DECK;
      // the deck and the roof slab around it are solid at their real height (the building's own
      // collider stops at the top of its walls)
      addCircle(d.x, d.z, 7, GY + b.h, deckY - 0.01, { deck: true });
      if (d.circular) addCircle(d.x, d.z, b.topR, GY + b.h, GY + b.h + 0.55, { deck: true });
      else addBox(d.top.x0 + d.i2, d.top.z0 + d.i2, d.top.x1 - d.i2, d.top.z1 - d.i2, GY + b.h, GY + b.h + 0.7, { deck: true });
      const st = streetSide(b);
      // skids along the bars of the H; the left door towards the way down when it can
      const heading = st.nx > 0 ? 0 : Math.PI;
      const reach = Math.abs(st.nx) ? d.hw : d.hd;
      const down = { x: d.x + st.nx * Math.min(10, reach - 1.6), z: d.z + st.nz * Math.min(10, reach - 1.6), y: deckY - DECK + (d.circular ? 0.55 : 0.7) };
      const name = b.kind === 'police' ? 'Safety Center helipad' : b.kind === 'clinic' ? 'Clinic helipad' : `${districtAt(d.x, d.z) || 'Downtown'} tower helipad`;
      const pad = {
        id: b.kind === 'police' ? 'police' : b.kind === 'clinic' ? 'clinic' : `tower${++n}`, name, x: d.x, y: deckY, z: d.z, heading, onRoof: true,
        type: b.kind === 'police' ? 'policeHeli' : b.kind === 'clinic' ? 'medHeli' : 'heli', locked: true,
        street: { x: st.x, z: st.z, y: groundHeight(st.x, st.z, 99), nx: st.nx, nz: st.nz }, down,
        v: null, cool: 0, wreckAt: null,
      };
      this.pads.push(pad);
      this.addMarker(pad, pad.street, true);
      this.addMarker(pad, down, false);
    }
    // pads at ground level, out in the open: unlocked, free to take
    const ground = [['port', 'Port of Sonnet helipad', POI.port, 140], ['ridge', 'Compute Ridge helipad', POI.ridge, 140], ['park', 'Alignment Park helipad', POI.park, 45]];
    for (const [id, name, at, reach] of ground) {
      const s = openSpot(at.x, at.z, reach);
      if (!s) continue;
      const pad = { id, name, x: s.x, y: s.y, z: s.z, heading: Math.atan2(at.x - s.x, at.z - s.z) || 0, onRoof: false, type: 'heli', locked: false, v: null, cool: 0, wreckAt: null };
      this.pads.push(pad);
      pad.mesh = padMesh(s.x, s.y, s.z);
      // a low deck, above the park paths and port paving it is laid over
      addCircle(s.x, s.z, 8.3, s.y - 1, s.y + PAD_TOP, { deck: true });
      pad.y = s.y + PAD_TOP + 0.01;
      G.scene.add(pad.mesh);
    }
  }
  addMarker(pad, at, up) {
    const vis = G.missions.makeRing(at.x, at.z, 1.6, 0x9ad4e6, at.y);
    this.markers.push({ pad, x: at.x, y: at.y, z: at.z, up, vis });
  }

  spawnAt(p) {
    const v = new Heli(p.type, p.x, p.z, p.heading, { locked: p.locked, paint: p.type === 'heli' ? pick(VEHICLE_PAINTS) : undefined });
    v.keep = true; v.padId = p.id;
    p.v = v;
    return v;
  }

  // ---- roof access -----------------------------------------------------------------------------
  teleport(pad, up) {
    const pl = G.player;
    if (!pad || this.fade || pl.vehicle || !pl.alive) return false;
    this.fade = { t: 0, pad, up, done: false };
    G.menus.fadeTo(true);
    return true;
  }
  cancelFade() { if (this.fade) { this.fade = null; G.menus.fadeTo(false); } }
  arrive(pad, up) {
    const pl = G.player;
    if (up) {
      // beside the machine's door, or at the pad's edge when it is gone
      const v = pad.v && !pad.v.removed && Math.hypot(pad.v.pos.x - pad.x, pad.v.pos.z - pad.z) < 8 ? pad.v : null;
      let x = pad.x, z = pad.z, y = pad.y, h = pad.heading;
      if (v) { const d = v.doorPos(-1); x = d.x; z = d.z; y = v.pos.y; h = Math.atan2(v.pos.x - x, v.pos.z - z); }
      else if (pad.down) { x = pad.x + (pad.down.x - pad.x) * 0.5; z = pad.z + (pad.down.z - pad.z) * 0.5; }
      pl.teleport(x, y + 0.02, z, h);
    } else {
      // out of the door, a step past the marker, facing the street
      const s = pad.street;
      if (s) pl.teleport(s.x + s.nx * 1.8, s.y, s.z + s.nz * 1.8, Math.atan2(s.nx, s.nz));
    }
    G.cam.yaw = pl.heading; G.cam.first = true;
  }

  update(dt, t) {
    const pl = G.player, pp = pl.worldPos;
    // fading to the roof or the street
    if (this.fade) {
      const f = this.fade;
      f.t += dt;
      if (!f.done && f.t > 0.5) { f.done = true; this.arrive(f.pad, f.up); }
      if (f.t > 0.8) { G.menus.fadeTo(false); this.fade = null; }
    }
    // the markers
    let hot = null;
    for (const m of this.markers) {
      const d = Math.hypot(m.x - pp.x, m.z - pp.z), dy = Math.abs(pp.y - m.y);
      m.vis.mesh.visible = d < 120 && dy < 40 && !G.indoors;
      if (!m.vis.mesh.visible) continue;
      const pulse = 1 + Math.sin(t * 3 + m.x) * 0.06;
      m.vis.ring.scale.set(1.6 * pulse, 1, 1.6 * pulse);
      m.vis.beam.material.opacity = 0.12 + 0.06 * Math.sin(t * 2 + m.z);
      if (d < 2 && dy < 2.5 && pl.alive && !pl.vehicle && !this.fade) hot = m;
    }
    if (hot) {
      G.hud.prompt(`<kbd>E</kbd>${hot.up ? `Roof access · ${hot.pad.name}` : 'Back down to the street'}`);
      G.interact.active = true;
      if (Input.hit('KeyE')) { G.audio?.play('uiSelect'); this.teleport(hot.pad, hot.up); }
    }
    // machines that were flown off or wrecked are replaced after a while, out of sight
    this.checkT -= dt;
    if (this.checkT <= 0) {
      this.checkT = 1;
      for (const p of this.pads) {
        const v = p.v;
        if (v && v.destroyed && p.wreckAt === null) p.wreckAt = t;
        if (v && (v.removed || v.sunk || (v !== pl.vehicle && Math.hypot(v.pos.x - p.x, v.pos.z - p.z) > 25) || (v.destroyed && t - p.wreckAt > 30))) {
          if (!v.removed) v.keep = false;
          p.v = null; p.cool = t + RESPAWN; p.wreckAt = null;
        }
        if (!p.v && t > p.cool && Math.hypot(pp.x - p.x, pp.z - p.z) > 110 && !G.vehicles.some((o) => Math.hypot(o.pos.x - p.x, o.pos.z - p.z) < 8 && Math.abs(o.pos.y - p.y) < 4)) this.spawnAt(p);
      }
    }
    // police helicopters that have flown off; one shot down on its way out is left to traffic.js's wreck clean-up
    for (let i = G.vehicles.length - 1; i >= 0; i--) {
      const v = G.vehicles[i];
      if (v.cls !== 'heli' || !v.ai) continue;
      if (v.ai.done) v.dispose();
      else if (v.ai.leaving && v.destroyed) v.keep = false;
    }
    this.updateCanopy(dt, t);
  }

  // Small parts are only drawn up close, and the whole machine not at all past the far range; the
  // nearest machine with its rotor turning, other than the player's, is heard.
  lateUpdate() {
    G.heliHud.update();
    const cp = G.camera.position, mine = G.player.vehicle;
    let near = null, nd = Infinity;
    for (const v of G.vehicles) {
      if (v.cls !== 'heli') continue;
      const d = Math.hypot(v.pos.x - cp.x, v.pos.z - cp.z);
      const show = d < LOD_FAR || v === mine;
      v.mesh.visible = show;
      // close by: the full model; further off: the one-mesh stand-in, which casts no shadow
      const full = d < LOD_NEAR || v === mine;
      if (v.m.full !== full) { v.m.full = full; v.m.body.visible = full; v.m.far.visible = !full; }
      // a machine circling high overhead throws its shadow nowhere near the view
      const cast = v === mine || v.agl < 30;
      if (v.m.cast !== cast) { v.m.cast = cast; for (const o of v.m.casters) o.castShadow = cast; }
      if (v !== mine && v.spool > 0.05 && !v.destroyed && d < nd) { nd = d; near = v; }
    }
    if (G.audio && G.audio.rotor) G.audio.rotor(near ? { x: near.pos.x, z: near.pos.z, level: near.spool } : null);
  }

  // ---- the parachute ---------------------------------------------------------------------------
  updateCanopy(dt, t) {
    const pl = G.player, c = this.canopy;
    const on = pl.state === 'parachute';
    c.visible = on;
    if (!on) return;
    const open = smoothstep(0.2, 1.2, pl.stateT);
    c.position.set(pl.pos.x, pl.pos.y + 1.9 + 2.6 * open, pl.pos.z);
    c.rotation.set(-0.12, pl.heading, -(pl.chuteTurn || 0) * 0.22, 'YXZ');
    c.scale.set(0.2 + 0.8 * open, 0.3 + 0.7 * open, 0.25 + 0.75 * open);
  }
}

// paints for parked civilian machines (natural colours: cream, sage, deep teal, terracotta, sand)
const VEHICLE_PAINTS = [0xe8e2d4, 0x5c7f6b, 0x2f5d73, 0xc8643b, 0xd9b26a, 0x3f6b4f, 0xf2f3f4];

// A ram-air canopy: an arched wing of cells in two colours, with lines down to the harness.
function buildCanopy() {
  const g = new THREE.Group();
  const span = 8.4, chord = 3.2, arc = 1.1, cells = 9;
  const geo = new THREE.BufferGeometry();
  const pos = [], col = [], idx = [];
  const A = new THREE.Color(0xd97757), B = new THREE.Color(0xf0e8d8);
  const N = cells * 4, M = 8;
  for (let i = 0; i <= N; i++) {
    const u = i / N - 0.5, a = u * arc * 2;
    const x = Math.sin(a) * span * 0.5 / Math.sin(arc), y = (Math.cos(a) - Math.cos(arc)) * span * 0.5 / Math.sin(arc) - 1.0;
    const c = Math.floor(i / 4) % 2 ? A : B;
    for (let j = 0; j <= M; j++) {
      const v = j / M, z = (0.5 - v) * chord;
      // aerofoil: thicker towards the front, the top surface only (seen from below it reads as a wing)
      const th = Math.sin(Math.PI * Math.min(1, v * 1.4)) * 0.28 * (1 - v * 0.5);
      pos.push(x * (1 - th * 0.1), y + th, z);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
    const a = i * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const wing = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0, side: THREE.DoubleSide }));
  wing.castShadow = true;
  // lines from the underside of the wing to the shoulders
  const lp = [];
  for (let k = 0; k <= 6; k++) {
    const a = (k / 6 - 0.5) * arc * 2;
    const x = Math.sin(a) * span * 0.5 / Math.sin(arc), y = (Math.cos(a) - Math.cos(arc)) * span * 0.5 / Math.sin(arc) - 1.0;
    for (const z of [chord * 0.35, -chord * 0.3]) lp.push(x, y, z, Math.sign(x) * 0.22, -3.0, 0);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x3a3a3a, transparent: true, opacity: 0.7 }));
  g.add(wing, lines);
  g.visible = false;
  return g;
}

let world = null;
addPlugin({
  init() { world = new HeliWorld(); buildHeliHud(); G.heliWorld = world; },
  update(dt, t) { world.update(dt, t); },
  lateUpdate() { world.lateUpdate(); },
});
