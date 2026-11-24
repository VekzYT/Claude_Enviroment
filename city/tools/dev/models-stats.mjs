// Prints triangle counts, heights and build times of every voxel model.
// Run with: npx tsx tools/dev/models-stats.mjs
import { BUILDING_TYPES } from '../../src/core/defs.ts';
import { ZoneType } from '../../src/core/types.ts';
import * as M from '../../src/render/models/index.ts';

const rows = [];
const time = (label, fn) => {
  const t0 = performance.now();
  const parts = fn();
  const ms = performance.now() - t0;
  const tris = (parts.body.getAttribute('position').count + (parts.glow ? parts.glow.getAttribute('position').count : 0)) / 3;
  const glowTris = parts.glow ? parts.glow.getAttribute('position').count / 3 : 0;
  const spin = parts.spinner ? parts.spinner.geometry.getAttribute('position').count / 3 : 0;
  rows.push({ label, tris: tris + spin, glowTris, height: parts.height.toFixed(2), smoke: parts.smoke?.length ?? 0, ms: ms.toFixed(1) });
};
const zn = { [ZoneType.Res]: 'res', [ZoneType.Com]: 'com', [ZoneType.Ind]: 'ind' };
for (const z of [ZoneType.Res, ZoneType.Com, ZoneType.Ind]) {
  for (let l = 1; l <= 3; l++) for (let v = 0; v < M.ZONE_VARIANTS; v++) time(`${zn[z]} L${l} v${v}`, () => M.zoneModel(z, l, v));
}
for (const t of BUILDING_TYPES) time(t, () => M.buildingModel(t));
for (let v = 1; v <= 3; v++) time(`tree ${v}`, () => M.treeModel(v));
for (let v = 0; v < M.CAR_VARIANTS; v++) time(`car ${v}`, () => M.carModel(v));
console.table(rows);
const lots = rows.slice(0, 36);
const avg = (a) => (a.reduce((s, r) => s + r.tris, 0) / a.length).toFixed(0);
console.log('avg lot tris', avg(lots), ' res', avg(lots.slice(0, 12)), ' com', avg(lots.slice(12, 24)), ' ind', avg(lots.slice(24, 36)));
console.log('max lot', Math.max(...lots.map((r) => r.tris)));
