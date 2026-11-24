// Prints triangle counts, heights and build times of every voxel model.
// Run with: npx tsx tools/dev/models-stats.mjs
import { BUILDINGS, BUILDING_TYPES } from '../../src/core/defs.ts';
import { ZoneType } from '../../src/core/types.ts';
import * as M from '../../src/render/models/index.ts';

const rows = [];
const outside = [];
const time = (label, fn, size = 1) => {
  const t0 = performance.now();
  const parts = fn();
  const ms = performance.now() - t0;
  const tris = (parts.body.getAttribute('position').count + (parts.glow ? parts.glow.getAttribute('position').count : 0)) / 3;
  const glowTris = parts.glow ? parts.glow.getAttribute('position').count / 3 : 0;
  const spin = parts.spinner ? parts.spinner.geometry.getAttribute('position').count / 3 : 0;
  rows.push({ label, tris: tris + spin, glowTris, height: parts.height.toFixed(2), smoke: parts.smoke?.length ?? 0, ms: ms.toFixed(1) });
  // everything must stay inside its footprint (the turbine rotor is a spinner and may overhang)
  parts.body.computeBoundingBox();
  const b = parts.body.boundingBox;
  const h = size / 2 + 1e-6;
  if (b.min.x < -h || b.max.x > h || b.min.z < -h || b.max.z > h || b.min.y < -1e-6) outside.push(`${label}: ${b.min.x.toFixed(3)}..${b.max.x.toFixed(3)} x, ${b.min.z.toFixed(3)}..${b.max.z.toFixed(3)} z, min y ${b.min.y.toFixed(3)}`);
};
const zn = { [ZoneType.Res]: 'res', [ZoneType.Com]: 'com', [ZoneType.Ind]: 'ind' };
for (const z of [ZoneType.Res, ZoneType.Com, ZoneType.Ind]) {
  for (let l = 1; l <= 3; l++) for (let v = 0; v < M.ZONE_VARIANTS; v++) time(`${zn[z]} L${l} v${v}`, () => M.zoneModel(z, l, v));
}
for (const t of BUILDING_TYPES) time(t, () => M.buildingModel(t), BUILDINGS[t].size);
for (let v = 1; v <= 3; v++) time(`tree ${v}`, () => M.treeModel(v));
for (let v = 0; v < M.CAR_VARIANTS; v++) time(`car ${v}`, () => M.carModel(v), 0.4);
console.table(rows);
const lots = rows.slice(0, 36);
const avg = (a) => (a.reduce((s, r) => s + r.tris, 0) / a.length).toFixed(0);
console.log('avg lot tris', avg(lots), ' res', avg(lots.slice(0, 12)), ' com', avg(lots.slice(12, 24)), ' ind', avg(lots.slice(24, 36)));
console.log('max lot', Math.max(...lots.map((r) => r.tris)));
console.log(outside.length ? 'OUTSIDE FOOTPRINT:\n  ' + outside.join('\n  ') : 'all models inside their footprint');
// caching: the same arguments give the same object
console.log('cached', M.zoneModel(ZoneType.Res, 2, 1) === M.zoneModel(ZoneType.Res, 2, 5), M.carModel(2) === M.carModel(8), M.treeModel(2) === M.treeModel(2));
