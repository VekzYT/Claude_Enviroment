// Pre-rendered world map + the rotating circular minimap and the full-screen map.
import { G } from '../state.js';
import { WORLD_MIN, WORLD_MAX, CITY, POI } from '../world/layout.js';
import { rawHeight, forestMask, swampMask, landDist } from '../world/terrain.js';
import { edges, nodes, nearestNode, findPath } from '../world/roads.js';
import { blocks, buildings } from '../world/cityplan.js';
import { PIER } from '../world/landmarks.js';
import { clamp } from '../util/math.js';

const SIZE = WORLD_MAX - WORLD_MIN;
export const MAP_PX = 1536;
const S = MAP_PX / SIZE; // px per metre
const mx = (x) => (x - WORLD_MIN) * S;

export const BLIP_STYLES = {
  mission: { color: '#ffb347', glyph: '★' },
  objective: { color: '#ffd84a', glyph: '' },
  safehouse: { color: '#7dffb0', glyph: '⌂' },
  garage: { color: '#b4ff5c', glyph: 'G' },
  retune: { color: '#ffb347', glyph: 'R' },
  shop: { color: '#5ff3ff', glyph: 'S' },
  race: { color: '#ff5fd8', glyph: '⚑' },
  police: { color: '#6ab6ff', glyph: '' },
  clinic: { color: '#ff8a5c', glyph: '+' },
  waypoint: { color: '#d97757', glyph: '' },
  vehicle: { color: '#ffd84a', glyph: '◆' },
  collect: { color: '#5ff3ff', glyph: '◈' },
  activity: { color: '#c77dff', glyph: '!' },
};

export class MapRenderer {
  constructor() {
    this.base = document.createElement('canvas');
    this.base.width = this.base.height = MAP_PX;
    this.paintBase();
    this.route = null; this.routeDest = null; this.routeT = 0;
  }

  paintBase() {
    const g = this.base.getContext('2d');
    // terrain layer, painted small and scaled up
    const N = 384;
    const t = document.createElement('canvas');
    t.width = t.height = N;
    const tg = t.getContext('2d');
    const img = tg.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = WORLD_MIN + ((i + 0.5) / N) * SIZE, z = WORLD_MIN + ((j + 0.5) / N) * SIZE;
      const h = rawHeight(x, z);
      let r, gg, b;
      if (h < -0.15) { const k = clamp(-h / 8, 0, 1); r = 22 - k * 10; gg = 62 - k * 24; b = 84 - k * 26; if (swampMask(x, z) > 0.4) { r = 26; gg = 50; b = 44; } }
      else {
        const f = forestMask(x, z), s = swampMask(x, z), d = landDist(x, z);
        r = 52; gg = 62; b = 46;
        if (f > 0.5) { r = 26; gg = 54; b = 44; }
        else if (s > 0.5) { r = 48; gg = 54; b = 34; }
        else if (d < 85 && h < 3.5) { r = 150; gg = 132; b = 96; }
        const k = clamp(h / 45, 0, 1) * 26;
        r += k; gg += k; b += k;
      }
      const o = (j * N + i) * 4;
      img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    tg.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(t, 0, 0, MAP_PX, MAP_PX);
    // city ground
    g.fillStyle = '#3a3936';
    g.fillRect(mx(CITY.x0 - 9), mx(CITY.z0 - 9), (CITY.x1 - CITY.x0 + 20) * S, (CITY.z1 - CITY.z0 + 18) * S);
    for (const b of blocks) {
      g.fillStyle = b.park ? '#3f6a3a' : b.plaza ? '#5a564e' : '#46443f';
      g.fillRect(mx(b.x0), mx(b.z0), (b.x1 - b.x0) * S, (b.z1 - b.z0) * S);
    }
    g.fillStyle = '#6a5a44';
    const p = CITY.promenade;
    g.fillRect(mx(p.x0), mx(p.z0), (p.x1 - p.x0) * S, (p.z1 - p.z0) * S);
    g.fillRect(mx(PIER.x0), mx(PIER.z0), (PIER.x1 - PIER.x0) * S, (PIER.z1 - PIER.z0) * S);
    g.fillStyle = '#5b5852';
    for (const b of buildings) g.fillRect(mx(b.x0), mx(b.z0), (b.x1 - b.x0) * S, (b.z1 - b.z0) * S);
    // roads
    g.lineCap = 'round'; g.lineJoin = 'round';
    const stroke = (e, color, w, dash = null) => {
      g.strokeStyle = color; g.lineWidth = w; g.setLineDash(dash || []);
      g.beginPath();
      e.pts.forEach((q, i) => (i ? g.lineTo(mx(q.x), mx(q.z)) : g.moveTo(mx(q.x), mx(q.z))));
      g.stroke();
    };
    for (const e of edges) if (e.type === 'dirt') stroke(e, '#a08258', 3.2, [5, 5]);
    for (const e of edges) if (e.type !== 'dirt') stroke(e, '#1c1c1e', e.spec.hw * 2 * S + 2.5);
    for (const e of edges) if (e.type !== 'dirt') stroke(e, e.type === 'highway' ? '#c9a87c' : e.type === 'blvd' ? '#b7b2a8' : '#8f8b83', Math.max(2.2, e.spec.hw * 2 * S));
    g.setLineDash([]);
  }

  // ---- routing ---------------------------------------------------------------
  setDestination(dest) { this.routeDest = dest ? { x: dest.x, z: dest.z } : null; this.route = null; this.routeT = 0; }
  updateRoute(dt, px, pz, boat = false) {
    if (!this.routeDest) { this.route = null; return; }
    this.routeT -= dt;
    if (this.routeT > 0) return;
    this.routeT = 1.1;
    const d = Math.hypot(this.routeDest.x - px, this.routeDest.z - pz);
    if (d < 45 || boat) { this.route = [{ x: px, z: pz }, this.routeDest]; return; }
    const a = nearestNode(px, pz), b = nearestNode(this.routeDest.x, this.routeDest.z);
    const path = findPath(a, b, true);
    const pts = [{ x: px, z: pz }];
    if (path) for (const s of path) {
      const list = s.forward ? s.e.pts : s.e.pts.slice().reverse();
      for (let i = 0; i < list.length; i += 2) pts.push(list[i]);
      pts.push(list[list.length - 1]);
    }
    pts.push(this.routeDest);
    // drop the detour back to the first node when we are already past it
    if (pts.length > 3) {
      const d0 = Math.hypot(pts[1].x - px, pts[1].z - pz), d1 = Math.hypot(pts[2].x - px, pts[2].z - pz);
      if (d1 < d0) pts.splice(1, 1);
    }
    this.route = pts;
  }

  // ---- minimap ---------------------------------------------------------------
  drawMini(ctx, size, opts) {
    const { x, z, yaw, heading, radius, blips, cones, flash } = opts;
    const R = size / 2;
    const k = R / radius; // px per metre on screen
    ctx.save();
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath(); ctx.arc(R, R, R - 2, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#16323f'; ctx.fillRect(0, 0, size, size);
    const th = yaw - Math.PI;
    ctx.translate(R, R);
    ctx.rotate(th);
    ctx.scale(k / S, k / S);
    ctx.translate(-mx(x), -mx(z));
    ctx.imageSmoothingEnabled = true;
    // only draw the part of the base map we can see
    const span = (radius * 1.5) * S;
    const sx = clamp(mx(x) - span, 0, MAP_PX), sy = clamp(mx(z) - span, 0, MAP_PX);
    const sw = clamp(mx(x) + span, 0, MAP_PX) - sx, sh = clamp(mx(z) + span, 0, MAP_PX) - sy;
    if (sw > 0 && sh > 0) ctx.drawImage(this.base, sx, sy, sw, sh, sx, sy, sw, sh);
    // route
    if (this.route && this.route.length > 1) {
      ctx.strokeStyle = '#ff9a6b'; ctx.lineWidth = 7 * S / k * 1.0 + 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      this.route.forEach((q, i) => (i ? ctx.lineTo(mx(q.x), mx(q.z)) : ctx.moveTo(mx(q.x), mx(q.z))));
      ctx.stroke();
    }
    // police vision cones
    for (const c of cones) {
      const cx = mx(c.x), cz = mx(c.z);
      ctx.fillStyle = c.alert ? (flash ? 'rgba(255,70,90,0.30)' : 'rgba(80,150,255,0.30)') : 'rgba(110,170,255,0.16)';
      ctx.beginPath();
      if (c.drone) ctx.arc(cx, cz, c.range * S, 0, Math.PI * 2);
      else {
        // heading h points along (sin h, cos h); canvas angle of that direction is atan2(cos h, sin h)
        const a = Math.PI / 2 - c.heading;
        ctx.moveTo(cx, cz);
        ctx.arc(cx, cz, c.range * S, a - c.fov, a + c.fov);
        ctx.closePath();
      }
      ctx.fill();
    }
    ctx.restore();

    // blips in screen space (so glyphs stay upright and can clamp to the rim)
    ctx.save();
    ctx.translate(R, R);
    const cs = Math.cos(th), sn = Math.sin(th);
    const place = (wx, wz) => {
      const dx = (wx - x) * k, dz = (wz - z) * k;
      return [dx * cs - dz * sn, dx * sn + dz * cs];
    };
    for (const c of cones) {
      const [bx, by] = place(c.x, c.z);
      if (bx * bx + by * by > (R - 8) * (R - 8)) continue;
      ctx.fillStyle = c.alert ? (flash ? '#ff4d5e' : '#6ab6ff') : '#6ab6ff';
      ctx.beginPath(); ctx.arc(bx, by, c.drone ? 3.5 : 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0c0c0e'; ctx.lineWidth = 1; ctx.stroke();
    }
    for (const b of blips) {
      let [bx, by] = place(b.x, b.z);
      const d = Math.hypot(bx, by);
      const edge = R - 11;
      const off = d > edge;
      if (off) { if (b.local) continue; bx *= edge / d; by *= edge / d; }
      drawBlip(ctx, bx, by, b, off ? 0.8 : 1);
    }
    // player arrow
    ctx.rotate(-(heading - yaw));
    ctx.fillStyle = '#faf6ee'; ctx.strokeStyle = '#17110d'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6.5, 7); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // north marker on the rim
    ctx.save();
    ctx.translate(R, R);
    const nx = Math.sin(-th) * (R - 9), ny = -Math.cos(-th) * (R - 9);
    void nx; void ny;
    const [qx, qy] = [(0) * cs - (-1) * sn, (0) * sn + (-1) * cs];
    ctx.fillStyle = '#17110d'; ctx.beginPath(); ctx.arc(qx * (R - 10), qy * (R - 10), 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#faf6ee'; ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', qx * (R - 10), qy * (R - 10) + 0.5);
    ctx.restore();
  }

  // ---- full map ----------------------------------------------------------------
  drawFull(ctx, w, h, opts) {
    const { x, z, heading, blips, cones, view } = opts;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d2028'; ctx.fillRect(0, 0, w, h);
    const k = view.scale; // screen px per map px
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(k, k);
    ctx.translate(-mx(view.x), -mx(view.z));
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, 0, 0);
    if (this.route && this.route.length > 1) {
      ctx.strokeStyle = '#ff9a6b'; ctx.lineWidth = 5 / k + 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      this.route.forEach((q, i) => (i ? ctx.lineTo(mx(q.x), mx(q.z)) : ctx.moveTo(mx(q.x), mx(q.z))));
      ctx.stroke();
    }
    for (const c of cones) {
      ctx.fillStyle = c.alert ? 'rgba(255,90,110,0.30)' : 'rgba(110,170,255,0.2)';
      ctx.beginPath();
      if (c.drone) ctx.arc(mx(c.x), mx(c.z), c.range * S, 0, Math.PI * 2);
      else { const a = Math.PI / 2 - c.heading; ctx.moveTo(mx(c.x), mx(c.z)); ctx.arc(mx(c.x), mx(c.z), c.range * S, a - c.fov, a + c.fov); ctx.closePath(); }
      ctx.fill();
    }
    ctx.restore();
    const toScreen = (wx, wz) => [w / 2 + (mx(wx) - mx(view.x)) * k, h / 2 + (mx(wz) - mx(view.z)) * k];
    // district labels
    ctx.font = '700 12px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(250,246,238,0.55)';
    for (const [name, lx, lz] of LABELS) { const [sx, sy] = toScreen(lx, lz); ctx.fillText(name.toUpperCase(), sx, sy); }
    for (const c of cones) { const [sx, sy] = toScreen(c.x, c.z); ctx.fillStyle = '#6ab6ff'; ctx.beginPath(); ctx.arc(sx, sy, 4, 0, 6.3); ctx.fill(); }
    for (const b of blips) { const [sx, sy] = toScreen(b.x, b.z); drawBlip(ctx, sx, sy, b, 1.25, true); }
    const [px, py] = toScreen(x, z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI - heading);
    ctx.fillStyle = '#faf6ee'; ctx.strokeStyle = '#17110d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8.5, 9); ctx.lineTo(0, 4.5); ctx.lineTo(-8.5, 9); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    return toScreen;
  }
  // screen -> world for clicks on the full map
  fullToWorld(sx, sy, w, h, view) {
    return { x: (sx - w / 2) / view.scale / S + view.x, z: (sy - h / 2) / view.scale / S + view.z };
  }
}

const LABELS = [
  ['Downtown', 150, -120], ['Token Row', 550, 0], ['Oceanfront', 740, -330], ['Old Town', -280, 380], ['Docklands', 420, 520],
  ['Uptown Tech Park', 0, -440], ['Riverside', -440, -100], ['Glowwood', -300, -1150], ['Compute Ridge', 530, -800],
  ['Opus Bayou', -1050, 700], ['Port of Sonnet', 650, 1010], ['Token Beach', 905, 300], ['Marsh Flats', 80, 760],
];

function drawBlip(ctx, x, y, b, scale = 1, label = false) {
  const st = BLIP_STYLES[b.type] || BLIP_STYLES.objective;
  const r = (b.big ? 8.5 : 6.5) * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = b.color || st.color; ctx.strokeStyle = '#17110d'; ctx.lineWidth = 1.6;
  if (b.type === 'objective' || b.type === 'waypoint') {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#17110d'; ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.rect(-r, -r, r * 2, r * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#17110d'; ctx.font = `900 ${Math.round(r * 1.5)}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(b.glyph || st.glyph, 0, 0.5);
  }
  if (label && b.name) {
    ctx.font = '700 11px "Trebuchet MS", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(12,12,14,0.85)'; ctx.strokeText(b.name, r + 5, 0);
    ctx.fillStyle = '#faf6ee'; ctx.fillText(b.name, r + 5, 0);
  }
  ctx.restore();
}
