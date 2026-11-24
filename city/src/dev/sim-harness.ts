// Dev harness (sim): runs the simulation in a browser page, times it, and draws a minimap.
// Bundle: npx esbuild src/dev/sim-harness.ts --bundle --format=iife --target=safari15 --outfile=.cache/sim/harness.js
import { applyPlan, planTool } from '../sim/actions';
import { newGame, recompute, simulateDay } from '../sim/index';
import { deserialize, serialize } from '../sim/save';
import { describeTile } from '../sim/inspect';
import type { GameState, ToolId } from '../core/types';
import { Terrain, TileKind, ZoneType } from '../core/types';

function colour(s: GameState, i: number): string {
  const T = s.tiles;
  if (T.terrain[i] === Terrain.Water) return '#408cdc';
  if (T.kind[i] === TileKind.Road) return '#5a5a62';
  if (T.kind[i] === TileKind.Building) return '#b070d0';
  if (T.kind[i] === TileKind.Zone) {
    const l = T.level[i];
    const base = T.zone[i] === ZoneType.Res ? [76, 199, 100] : T.zone[i] === ZoneType.Com ? [61, 139, 255] : [242, 182, 50];
    const f = l === 0 ? 0.35 : 0.5 + l * 0.17;
    return `rgb(${base.map((v) => Math.round(l === 0 ? v * f + 150 : v * f)).join(',')})`;
  }
  if (T.trees[i]) return ['', '#469640', '#2d7d2d', '#195f23'][T.trees[i]];
  if (T.terrain[i] === Terrain.Sand) return '#e6d696';
  return '#96cd6e';
}

function run() {
  const out: Record<string, unknown> = {};
  let t0 = performance.now();
  const s = newGame(12345, 'Harness');
  out.newGameMs = performance.now() - t0;
  const ap = (tool: ToolId, a: { x: number; z: number }, b = a) => applyPlan(s, planTool(s, tool, a, b)).ok;
  const c = 32;
  ap('road', { x: c - 12, z: c }, { x: c + 12, z: c });
  ap('road', { x: c, z: c - 10 }, { x: c, z: c + 10 });
  ap('zone_res', { x: c - 12, z: c - 4 }, { x: c - 1, z: c - 1 });
  ap('zone_res', { x: c - 12, z: c + 1 }, { x: c - 1, z: c + 4 });
  ap('zone_com', { x: c + 1, z: c - 4 }, { x: c + 6, z: c - 1 });
  ap('zone_ind', { x: c + 1, z: c + 1 }, { x: c + 8, z: c + 4 });
  ap('build:power_coal', { x: c + 10, z: c - 2 });
  ap('build:water_tower', { x: c - 6, z: c + 5 });
  ap('build:park_small', { x: c - 6, z: c - 2 });
  t0 = performance.now();
  for (let d = 0; d < 720; d++) simulateDay(s);
  out.dayMs = (performance.now() - t0) / 720;
  t0 = performance.now();
  for (let k = 0; k < 20; k++) recompute(s);
  out.recomputeMs = (performance.now() - t0) / 20;
  const text = serialize(s);
  const back = deserialize(text);
  out.roundTrip = serialize(back) === text;
  out.saveKB = Math.round(text.length / 1024);
  out.population = s.stats.population;
  out.money = s.money;
  out.inspect = describeTile(s, c - 5, c - 2).title;

  const canvas = document.createElement('canvas');
  const px = 5;
  canvas.width = s.size * px;
  canvas.height = s.size * px;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < s.size * s.size; i++) {
    ctx.fillStyle = colour(s, i);
    ctx.fillRect((i % s.size) * px, Math.floor(i / s.size) * px, px, px);
  }
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(out, null, 1);
  document.body.appendChild(pre);
  (window as unknown as { __simResult: unknown }).__simResult = out;
}

run();
