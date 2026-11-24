// Uniform-grid index over 2D line segments for fast nearest-segment queries.
import { segProject } from './math.js';

export class SegmentIndex {
  constructor(cell = 48) {
    this.cell = cell;
    this.map = new Map();
    this.segs = [];
  }
  key(cx, cz) { return cx * 73856093 ^ cz * 19349663; }
  add(ax, az, bx, bz, pad, data) {
    const seg = { ax, az, bx, bz, data };
    this.segs.push(seg);
    const c = this.cell;
    const x0 = Math.floor((Math.min(ax, bx) - pad) / c), x1 = Math.floor((Math.max(ax, bx) + pad) / c);
    const z0 = Math.floor((Math.min(az, bz) - pad) / c), z1 = Math.floor((Math.max(az, bz) + pad) / c);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
      const k = this.key(i, j);
      let list = this.map.get(k);
      if (!list) { list = []; this.map.set(k, list); }
      list.push(seg);
    }
    return seg;
  }
  // Every segment registered in the cell containing (x,z). Segments were padded on insert.
  cellList(x, z) {
    return this.map.get(this.key(Math.floor(x / this.cell), Math.floor(z / this.cell))) || null;
  }
  nearest(x, z, maxDist = Infinity) {
    const list = this.cellList(x, z);
    let best = null, bestD2 = maxDist * maxDist;
    if (!list) return null;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const p = segProject(x, z, s.ax, s.az, s.bx, s.bz);
      if (p.d2 < bestD2) { bestD2 = p.d2; best = { seg: s, t: p.t, d: Math.sqrt(p.d2), cx: p.cx, cz: p.cz }; }
    }
    return best;
  }
}
