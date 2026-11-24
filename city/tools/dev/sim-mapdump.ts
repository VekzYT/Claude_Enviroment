// Dev tool (sim): render generated maps (or a played city) to a PNG contact sheet so they can be eyeballed.
// Usage: npx tsx tools/dev/sim-mapdump.ts [firstSeed=1] [count=12] [out=.cache/sim/maps.png]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync } from 'node:zlib';
import { newGame } from '../../src/sim/index';
import { buildableShare } from '../../src/sim/mapgen';
import type { GameState } from '../../src/core/types';
import { Terrain, TileKind, ZoneType } from '../../src/core/types';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function writePng(path: string, w: number, h: number, rgb: Uint8Array): void {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', new Uint8Array(0)),
  ]);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

/** Colour of one tile, roughly as the game would show it from above. */
export function tileColor(s: GameState, i: number): [number, number, number] {
  const T = s.tiles;
  if (T.terrain[i] === Terrain.Water) return [64, 140, 220];
  if (T.kind[i] === TileKind.Road) return [90, 90, 98];
  if (T.kind[i] === TileKind.Building) {
    const b = s.buildings[T.bld[i]];
    if (!b) return [255, 0, 255];
    if (b.type.startsWith('power')) return [150, 60, 60];
    if (b.type.startsWith('water')) return [40, 200, 220];
    if (b.type.startsWith('park')) return [30, 160, 60];
    return [200, 120, 220];
  }
  if (T.kind[i] === TileKind.Zone) {
    const l = T.level[i];
    const f = 0.45 + 0.18 * l;
    const base = T.zone[i] === ZoneType.Res ? [76, 199, 100] : T.zone[i] === ZoneType.Com ? [61, 139, 255] : [242, 182, 50];
    if (l === 0) return [base[0] * 0.4 + 140, base[1] * 0.4 + 140, base[2] * 0.4 + 140].map(Math.round) as [number, number, number];
    return base.map((v) => Math.round(v * f)) as [number, number, number];
  }
  if (T.trees[i]) return [[0, 0, 0], [70, 150, 60], [45, 125, 45], [25, 95, 35]][T.trees[i]] as [number, number, number];
  if (T.terrain[i] === Terrain.Sand) return [230, 214, 150];
  return [150, 205, 110];
}

export function renderSheet(states: GameState[], cols: number, scale: number, path: string): void {
  const size = states[0].size;
  const cell = size * scale + 6;
  const rows = Math.ceil(states.length / cols);
  const w = cols * cell;
  const h = rows * cell;
  const rgb = new Uint8Array(w * h * 3).fill(255);
  states.forEach((s, k) => {
    const ox = (k % cols) * cell + 3;
    const oy = Math.floor(k / cols) * cell + 3;
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const c = tileColor(s, z * size + x);
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const p = ((oy + z * scale + dy) * w + ox + x * scale + dx) * 3;
            rgb[p] = c[0];
            rgb[p + 1] = c[1];
            rgb[p + 2] = c[2];
          }
        }
      }
    }
  });
  writePng(path, w, h, rgb);
}

const isMain = process.argv[1] && /sim-mapdump\.ts$/.test(process.argv[1]);
if (isMain) {
  const first = Number(process.argv[2] ?? 1);
  const count = Number(process.argv[3] ?? 12);
  const out = process.argv[4] ?? '.cache/sim/maps.png';
  const states: GameState[] = [];
  for (let s = first; s < first + count; s++) {
    const t0 = performance.now();
    const st = newGame(s);
    const ms = performance.now() - t0;
    let trees = 0;
    let land = 0;
    for (let i = 0; i < st.size * st.size; i++) {
      if (st.tiles.terrain[i] !== Terrain.Water) land++;
      if (st.tiles.trees[i]) trees++;
    }
    console.log(`seed ${s}: land ${(buildableShare(st) * 100).toFixed(1)}%  trees ${((trees / land) * 100).toFixed(1)}% of land  (${ms.toFixed(1)} ms)`);
    states.push(st);
  }
  renderSheet(states, Math.min(6, count), 4, out);
  console.log('wrote', out);
}
