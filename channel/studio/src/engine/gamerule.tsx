import React from 'react';
import { backOut, clamp, easeOut, rnd } from './anim';
import { FONT } from './fonts';
import { Glow } from './light';
import type { Look } from './rig';
import { HudLayer, SAFE, useFrame } from './frame';

// GAMERULE's game layer (channel/BIBLE.md): the chat where gamerules get typed, the "mine" power (cracks, debris, the
// block that drops), the hotbar, the title card in our colours, and the props the first episode needs. Everything is
// a pure function of the shot clock, like the rest of the engine.

export const GR = {
  lime: '#8BE04E',
  limeDeep: '#2F7D32',
  limeLight: '#C8F59E',
  yellow: '#FFD93B',
  red: '#FF4D4D',
  white: '#F4F1EA',
  ink: '#141024',
};

// ---------------------------------------------------------------- the chat
export type ChatLine = { at: number; text: string; kind?: 'cmd' | 'sys' | 'admin' };

/**
 * The chat, bottom left, as in the game: one dark strip per line, newest at the bottom. A `cmd` line types itself
 * (about 1.6 characters a frame) behind a blinking cursor; `sys` (yellow) and `admin` (red) lines arrive whole.
 * Lines fade after `hold` frames unless `hold` is 0. In a tall frame it sits above the hotbar, clear of Shorts' UI.
 */
export const ChatBox: React.FC<{ f: number; lines: ChatLine[]; x?: number; y?: number; size?: number; tallSize?: number; hold?: number; cps?: number }> = (props) => (
  <HudLayer>
    <ChatLines {...props} />
  </HudLayer>
);

const ChatLines: React.FC<{ f: number; lines: ChatLine[]; x?: number; y?: number; size?: number; tallSize?: number; hold?: number; cps?: number }> = ({
  f, lines, x: x0 = 64, y: y0 = 972, size: s0 = 36, tallSize = 33, hold = 0, cps = 1.6,
}) => {
  const F = useFrame();
  const x = F.tall ? 40 : x0;
  const y = F.tall ? F.h - SAFE.bottom - 150 : y0;
  const size = F.tall ? tallSize : s0;
  const lh = size * 1.5;
  const shown = lines.filter((l) => f >= l.at);
  return (
    <g fontFamily={FONT.ui} fontSize={size} fontWeight={600}>
      {shown.map((l, i) => {
        const age = f - l.at;
        const fade = hold > 0 ? clamp(1 - (age - hold) / 12) : 1;
        if (fade <= 0) return null;
        const typing = l.kind === 'cmd' || l.kind === undefined;
        const n = typing ? Math.min(l.text.length, Math.floor(age * cps)) : l.text.length;
        const text = l.text.slice(0, n);
        const cursor = typing && (n < l.text.length || Math.floor(age / 8) % 2 === 0) && age < l.text.length / cps + 40;
        const color = l.kind === 'sys' ? GR.yellow : l.kind === 'admin' ? GR.red : GR.white;
        const row = shown.length - 1 - i;
        const yy = y - row * lh;
        const w = Math.max(size, (l.text.length + 1) * size * 0.56) + 28;
        return (
          <g key={i} opacity={fade}>
            <rect x={x - 14} y={yy - size * 1.02} width={w} height={lh - 4} fill="#000" opacity={0.5} />
            <text x={x} y={yy} fill={color}>
              {text}
              {cursor ? <tspan fill={GR.white}>_</tspan> : null}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- the mine power
/**
 * Cracks spreading across whatever is being mined, in stepped pixel strokes like the game's breaking stages: thick
 * dark branches out from the hit point, each catching a faint light edge so it reads on dark brick too. `p` runs 0 to
 * 1 over the hits (branches draw on one after another); clipped to the thing's box. `width` defaults to the box size.
 */
export const MineCracks: React.FC<{ x: number; y: number; w: number; h: number; p: number; seed?: number; hx?: number; hy?: number; id: string; width?: number; color?: string }> = ({
  x, y, w, h, p, seed = 1, hx = 0.5, hy = 0.5, id, width, color = '#140F1C',
}) => {
  if (p <= 0) return null;
  const N = 9;
  const ox = x + w * hx;
  const oy = y + h * hy;
  const size = Math.max(w, h);
  const step = size / 9;
  const sw = width ?? size / 24;
  const paths = Array.from({ length: N }, (_, k) => {
    const show = clamp((p - k / N) * N * 0.9);
    if (show <= 0) return null;
    let a = (k / N) * Math.PI * 2 + rnd(seed, k) * 0.7;
    let px = ox;
    let py = oy;
    let d = `M ${px.toFixed(1)} ${py.toFixed(1)}`;
    // a staircase toward the branch's heading: across, then down, in pixel-sized steps
    for (let s = 0; s < 6; s++) {
      a += (rnd(seed + 3, k * 7 + s) - 0.5) * 0.9;
      const len = step * (0.7 + rnd(seed + 5, k * 11 + s) * 0.9);
      px += Math.cos(a) * len;
      d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
      py += Math.sin(a) * len;
      d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
    }
    return { k, d, show };
  }).filter((v): v is { k: number; d: string; show: number } => v !== null);
  return (
    <g>
      <defs>
        <clipPath id={`crk-${id}`}>
          <rect x={x} y={y} width={w} height={h} rx={6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#crk-${id})`} fill="none" strokeLinejoin="miter" strokeLinecap="square">
        <g stroke="#FFFFFF" strokeWidth={sw} opacity={0.22} transform={`translate(${sw * 0.45} ${sw * 0.45})`}>
          {paths.map(({ k, d, show }) => <path key={k} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - show} />)}
        </g>
        <g stroke={color} strokeWidth={sw}>
          {paths.map(({ k, d, show }) => <path key={k} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - show} />)}
        </g>
      </g>
    </g>
  );
};

/**
 * The game's block outline round whatever you're aiming at, so anything reads as a block before it's mined. A thin
 * dark wireframe: the front face, and with `d` > 0 the top and side edges going back (a free-standing thing); 0 for a
 * cell flush in a wall, where only the face shows. `o` fades it.
 */
export const SelectBox: React.FC<{ x: number; y: number; w: number; h: number; d?: number; o?: number; width?: number; color?: string }> = ({
  x, y, w, h, d = 0, o = 1, width, color = GR.ink,
}) => {
  if (o <= 0) return null;
  const sw = width ?? Math.max(2, Math.max(w, h) / 46);
  return (
    <g opacity={o * 0.9} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="miter" strokeLinecap="square">
      <rect x={x} y={y} width={w} height={h} />
      {d > 0 ? <path d={`M ${x} ${y} L ${x + d} ${y - d} L ${x + w + d} ${y - d} L ${x + w + d} ${y + h - d} L ${x + w} ${y + h} M ${x + w} ${y} L ${x + w + d} ${y - d}`} /> : null}
    </g>
  );
};

/** A hit landing: a white four-point star and short speed lines bursting from the contact point for five frames. `t` is
 * frames since the hit. */
export const Impact: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => {
  if (t < 0 || t > 5) return null;
  const k = 1 - t / 6;
  const R = (34 + t * 12) * s;
  const q = R * 0.28;
  return (
    <g transform={`translate(${x} ${y}) rotate(${12 + t * 4})`} opacity={k}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        return <path key={i} d={`M ${(Math.cos(a) * R * 0.75).toFixed(1)} ${(Math.sin(a) * R * 0.75).toFixed(1)} L ${(Math.cos(a) * R * 1.3).toFixed(1)} ${(Math.sin(a) * R * 1.3).toFixed(1)}`} stroke="#FFF6D8" strokeWidth={6 * s} strokeLinecap="round" />;
      })}
      <path d={`M 0 ${-R} L ${q} ${-q} L ${R} 0 L ${q} ${q} L 0 ${R} L ${-q} ${q} L ${-R} 0 L ${-q} ${-q} Z`} fill="#FFFFFF" stroke={GR.ink} strokeWidth={3 * s} strokeLinejoin="round" />
    </g>
  );
};

/**
 * Block presets: a palette and square pixel maps (4 x 4 or 8 x 8) for the sides and the top, so a mined thing keeps its
 * colours and still reads as itself at hotbar size: the clock's dial and hands, the brick's courses, the car's windows
 * and wheels.
 */
export const BLOCKS = {
  clock: {
    pal: ['#E8483F', '#F4F1EA', '#1D2033', '#B8352E'],
    side: [[3, 3, 3, 3, 3, 3, 3, 3], [3, 0, 0, 0, 0, 0, 0, 3], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 2, 1, 1, 1, 0], [0, 1, 1, 2, 2, 2, 1, 0], [0, 1, 1, 1, 1, 1, 1, 0], [0, 0, 1, 1, 1, 1, 0, 0], [3, 0, 0, 0, 0, 0, 0, 3]],
    top: [[3, 3, 3, 3, 3, 3, 3, 3], [3, 0, 0, 0, 0, 0, 0, 3], [3, 0, 1, 1, 0, 1, 1, 3], [3, 0, 1, 1, 0, 1, 1, 3], [3, 0, 0, 0, 0, 0, 0, 3], [3, 0, 0, 2, 2, 0, 0, 3], [3, 0, 0, 0, 0, 0, 0, 3], [3, 3, 3, 3, 3, 3, 3, 3]],
  },
  brick: {
    pal: ['#A24E36', '#86402C', '#BF6B4E', '#5C4A44'],
    side: [[0, 0, 0, 3, 1, 1, 1, 3], [0, 2, 0, 3, 1, 1, 1, 3], [3, 3, 3, 3, 3, 3, 3, 3], [1, 3, 0, 0, 0, 3, 1, 1], [1, 3, 0, 2, 0, 3, 1, 1], [3, 3, 3, 3, 3, 3, 3, 3], [0, 0, 0, 3, 1, 1, 1, 3], [3, 3, 3, 3, 3, 3, 3, 3]],
    top: [[0, 1, 0, 2], [1, 0, 2, 0], [0, 2, 1, 0], [2, 0, 0, 1]],
  },
  car: {
    pal: ['#D64545', '#9FD3E6', '#26212F', '#A83535'],
    side: [[0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 0, 1, 1, 0], [0, 1, 1, 1, 0, 1, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0], [3, 3, 3, 3, 3, 3, 3, 3], [0, 0, 0, 0, 0, 0, 0, 0], [0, 2, 2, 0, 0, 2, 2, 0], [3, 2, 2, 3, 3, 2, 2, 3]],
    top: [[3, 3, 3, 3, 3, 3, 3, 3], [3, 0, 0, 0, 0, 0, 0, 3], [3, 1, 1, 1, 1, 1, 1, 3], [3, 1, 1, 1, 1, 1, 1, 3], [3, 0, 0, 0, 0, 0, 0, 3], [3, 0, 0, 0, 0, 0, 0, 3], [3, 1, 1, 1, 1, 1, 1, 3], [3, 3, 3, 3, 3, 3, 3, 3]],
  },
  stone: { pal: ['#8A8794', '#74717E', '#9E9BA8', '#64616E'], side: [[0, 1, 0, 2], [2, 0, 3, 0], [0, 2, 0, 1], [1, 0, 2, 0]], top: [[2, 0, 1, 0], [0, 3, 0, 2], [1, 0, 2, 0], [0, 2, 0, 3]] },
  dirt: { pal: ['#7A5236', '#64432C', '#8E6444', '#6EB04A'], side: [[3, 3, 3, 3], [0, 1, 0, 2], [2, 0, 1, 0], [0, 2, 0, 1]], top: [[3, 3, 3, 3], [3, 3, 3, 3], [3, 3, 3, 3], [3, 3, 3, 3]] },
  water: { pal: ['#3E7FD6', '#2F68B8', '#5B98E8', '#7FB4F2'], side: [[3, 2, 0, 2], [0, 0, 1, 0], [1, 0, 0, 0], [0, 1, 0, 1]], top: [[2, 3, 2, 0], [0, 2, 3, 2], [2, 0, 2, 3], [3, 2, 0, 2]] },
  lamp: { pal: ['#3A3446', '#FFD27A', '#FFF1C8', '#2A2434'], side: [[3, 3, 3, 3], [0, 1, 2, 0], [0, 2, 1, 0], [3, 3, 3, 3]], top: [[3, 0, 0, 3], [0, 1, 1, 0], [0, 1, 1, 0], [3, 0, 0, 3]] },
} as const;
export type BlockKind = keyof typeof BLOCKS;

const shadeHex = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

/**
 * A block, as dropped items are in the game: a real 3-D cube turning slowly and bobbing, pixel-textured from its
 * preset, a soft lime glow under it. `pop` (frames since it appeared) scales it in with an overshoot.
 */
export const ItemBlock: React.FC<{ x: number; y: number; t: number; size?: number; kind?: BlockKind; spin?: number; bob?: number; pop?: number; glow?: number; tilt?: number }> = ({
  x, y, t, size = 40, kind = 'stone', spin = 0.045, bob = 1, pop, glow = 1, tilt = 0.5,
}) => {
  const B = BLOCKS[kind];
  const sc = pop === undefined ? 1 : backOut(clamp(pop / 9));
  if (sc <= 0) return null;
  const a = t * spin + 0.6;
  const yb = y - (bob ? Math.sin(t / 10) * size * 0.22 * bob : 0);
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(tilt), sb = Math.sin(tilt);
  const P = (vx: number, vy: number, vz: number) => {
    const x1 = vx * ca + vz * sa;
    const z1 = -vx * sa + vz * ca;
    const y2 = vy * cb - z1 * sb;
    const z2 = vy * sb + z1 * cb;
    return { x: x1, y: -y2, z: z2 };
  };
  // the five faces that can face the camera from above: corners in order, the outward normal, which map to use
  const faces: { c: [number, number, number][]; n: [number, number, number]; top: boolean }[] = [
    { c: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], n: [0, 1, 0], top: true },
    { c: [[-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]], n: [0, 0, 1], top: false },
    { c: [[1, 1, 1], [1, 1, -1], [1, -1, -1], [1, -1, 1]], n: [1, 0, 0], top: false },
    { c: [[1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]], n: [0, 0, -1], top: false },
    { c: [[-1, 1, -1], [-1, 1, 1], [-1, -1, 1], [-1, -1, -1]], n: [-1, 0, 0], top: false },
  ];
  const lit = (n: { x: number; y: number; z: number }) => 0.62 + 0.38 * Math.max(0, -0.45 * n.x - 0.75 * n.y + 0.5 * n.z);
  const drawn = faces
    .map((fc) => ({ fc, n: P(...fc.n), q: fc.c.map((v) => P(...v)) }))
    .filter((d) => d.n.z > 0.02)
    .sort((d1, d2) => d1.q.reduce((s, v) => s + v.z, 0) - d2.q.reduce((s, v) => s + v.z, 0));
  const half = size / 2;
  return (
    <g transform={`translate(${x} ${yb}) scale(${sc})`}>
      {glow > 0 ? <ellipse cx={0} cy={size * 0.95 + (yb - y)} rx={size * 0.9} ry={size * 0.22} fill={GR.lime} opacity={0.28 * glow} filter="url(#blur6)" /> : null}
      {drawn.map(({ fc, n, q }, k) => {
        const map: readonly (readonly number[])[] = fc.top ? B.top : B.side;
        const N = map.length;
        const L = lit(n);
        const at = (i: number, j: number) => {
          // bilinear point across the face: i along the first edge, j down it
          const u = i / N, v = j / N;
          const top = { x: q[0].x + (q[1].x - q[0].x) * u, y: q[0].y + (q[1].y - q[0].y) * u };
          const bot = { x: q[3].x + (q[2].x - q[3].x) * u, y: q[3].y + (q[2].y - q[3].y) * u };
          return `${((top.x + (bot.x - top.x) * v) * half).toFixed(2)},${((top.y + (bot.y - top.y) * v) * half).toFixed(2)}`;
        };
        const cells: React.ReactNode[] = [];
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++)
            cells.push(<polygon key={`${i}${j}`} points={`${at(i, j)} ${at(i + 1, j)} ${at(i + 1, j + 1)} ${at(i, j + 1)}`} fill={shadeHex(B.pal[map[j][i]], L)} stroke={shadeHex(B.pal[map[j][i]], L)} strokeWidth={0.6} />);
        return (
          <g key={k}>
            {cells}
            <polygon points={q.map((v) => `${(v.x * half).toFixed(2)},${(v.y * half).toFixed(2)}`).join(' ')} fill="none" stroke={GR.ink} strokeWidth={Math.max(2, size * 0.05)} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

/** Pieces flying off a block as it breaks: little squares in the block's colours, thrown up and out, falling. */
export const BlockBurst: React.FC<{ x: number; y: number; t: number; kind?: BlockKind; n?: number; seed?: number; size?: number; spread?: number }> = ({
  x, y, t, kind = 'stone', n = 14, seed = 2, size = 16, spread = 1,
}) => {
  if (t < 0 || t > 30) return null;
  const pal = BLOCKS[kind].pal;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = rnd(seed, i) * Math.PI * 2;
        const v = (4 + rnd(seed + 1, i) * 9) * spread;
        const px = x + Math.cos(a) * v * t;
        const py = y + (Math.sin(a) * v - 7) * t + 0.55 * t * t;
        const s = size * (0.5 + rnd(seed + 2, i));
        const o = clamp(1 - (t - 14) / 14);
        return <rect key={i} x={px - s / 2} y={py - s / 2} width={s} height={s} fill={pal[i % pal.length]} stroke={GR.ink} strokeWidth={2} opacity={o} transform={`rotate(${t * 18 * (rnd(seed + 3, i) - 0.5)} ${px} ${py})`} />;
      })}
    </g>
  );
};

/** The hotbar: nine slots along the bottom, the selected one lit, a block and a count in each filled slot. In a tall
 * frame it rides above Shorts' caption, a little bigger. */
export const Hotbar: React.FC<{ f: number; slots: ({ kind: BlockKind; count?: number } | null)[]; sel?: number; at?: number; y?: number; slot?: number }> = (props) => (
  <HudLayer>
    <HotbarSlots {...props} />
  </HudLayer>
);

const HotbarSlots: React.FC<{ f: number; slots: ({ kind: BlockKind; count?: number } | null)[]; sel?: number; at?: number; y?: number; slot?: number }> = ({
  f, slots, sel = 0, at = 0, y: y0 = 1000, slot: s0 = 78,
}) => {
  const F = useFrame();
  const up = easeOut(clamp((f - at) / 8));
  if (up <= 0) return null;
  const slot = F.tall ? Math.round(s0 * 1.4) : s0;
  const y = F.tall ? F.h - SAFE.bottom : y0;
  const gap = 6;
  const w = 9 * slot + 8 * gap;
  const x0 = F.w / 2 - w / 2;
  return (
    <g transform={`translate(0 ${(1 - up) * 120})`} fontFamily={FONT.ui}>
      <rect x={x0 - 10} y={y - slot - 10} width={w + 20} height={slot + 20} rx={6} fill="#000" opacity={0.45} />
      {Array.from({ length: 9 }, (_, i) => {
        const sx = x0 + i * (slot + gap);
        const s = slots[i];
        return (
          <g key={i}>
            <rect x={sx} y={y - slot} width={slot} height={slot} rx={4} fill="#2A2436" opacity={0.85} stroke={i === sel ? GR.lime : '#5A5468'} strokeWidth={i === sel ? 5 : 3} />
            {s ? <ItemBlock x={sx + slot / 2} y={y - slot / 2 - 4} t={40 + i * 13} size={slot * 0.42} kind={s.kind} spin={0} bob={0} glow={0} /> : null}
            {s && s.count && s.count > 1 ? (
              <text x={sx + slot - 5} y={y - 5} textAnchor="end" fontFamily={FONT.title} fontSize={slot * 0.4} fontWeight={800} fill={GR.white} stroke={GR.ink} strokeWidth={3} paintOrder="stroke">
                {s.count}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** GAMERULE's title card: a small first line, a big lime second line, one word in yellow that pulses. In a tall frame
 * it sits in the upper third and shrinks to fit the width. */
export const GrTitle: React.FC<{ t: number; lines: [string, string]; accent?: string; accentT?: number; y?: number; size?: number }> = (props) => (
  <HudLayer>
    <TitleLines {...props} />
  </HudLayer>
);

const TitleLines: React.FC<{ t: number; lines: [string, string]; accent?: string; accentT?: number; y?: number; size?: number }> = ({ t, lines, accent, accentT = 30, y: y0 = 200, size: s0 = 124 }) => {
  const F = useFrame();
  const size = F.tall ? Math.min(s0, (F.w - 110) / (lines[1].length * 0.68)) : s0;
  const y = F.tall ? 560 : y0;
  const cx = F.w / 2;
  const pop = (d: number) => backOut(clamp((t - d) / 9));
  const pulse = t >= accentT && t < accentT + 12 ? 1 + 0.12 * Math.sin(((t - accentT) / 12) * Math.PI) : 1;
  const words = lines[1].split(' ');
  return (
    <g fontFamily={FONT.title}>
      <g transform={`translate(${cx} ${y}) scale(${pop(2)})`}>
        <text textAnchor="middle" fontWeight={700} fontSize={size / 2} letterSpacing={4} fill={GR.white} stroke={GR.ink} strokeWidth={9} paintOrder="stroke">
          {lines[0]}
        </text>
      </g>
      <g transform={`translate(${cx} ${y + size - 4}) scale(${pop(5)})`}>
        <text textAnchor="middle" fontWeight={900} fontSize={size} fill={GR.lime} stroke={GR.ink} strokeWidth={14} paintOrder="stroke" style={{ filter: 'drop-shadow(0 0 22px rgba(139,224,78,0.45))' }}>
          {words.map((w, i) => {
            const on = w.replace(/[^\w]/g, '') === accent;
            return (
              <tspan key={i} fill={on ? GR.yellow : undefined} style={on ? { fontSize: size * pulse } : undefined}>
                {(i ? ' ' : '') + w}
              </tspan>
            );
          })}
        </text>
      </g>
    </g>
  );
};

/** A flat shade over the whole visible frame (under a title card), in either format. */
export const HudShade: React.FC<{ o: number; color?: string }> = ({ o, color = '#0B0816' }) => {
  const F = useFrame();
  if (o <= 0) return null;
  return (
    <HudLayer>
      <rect x={-40} y={-40} width={F.w + 80} height={F.h + 80} fill={color} opacity={o} />
    </HudLayer>
  );
};

// ---------------------------------------------------------------- inserts
/**
 * A character's arm reaching into an insert from off frame: a thick sleeve curving in from `from`, then a mitten
 * (open) or a fist at `hand`, pointing along `rot` degrees (0 = the fingers point down). `k` scales the widths, for
 * inserts drawn inside a zoomed camera (pass 1 / zoom).
 */
export const InsertArm: React.FC<{ hand: { x: number; y: number }; from: { x: number; y: number }; look: { line: string; limb: string; hand: string }; kind?: 'fist' | 'open'; rot?: number; k?: number; rim?: string }> = ({
  hand, from, look, kind = 'fist', rot = 0, k = 1, rim = 'rimR',
}) => {
  const mx = (hand.x + from.x) / 2 + (from.y - hand.y) * 0.15;
  const my = (hand.y + from.y) / 2 - (from.x - hand.x) * 0.1;
  const d = `M ${hand.x} ${hand.y} Q ${mx} ${my} ${from.x} ${from.y}`;
  const s = 4.6 * k;
  return (
    <g filter={`url(#${rim})`}>
      <path d={d} stroke={look.line} strokeWidth={118 * k} fill="none" strokeLinecap="round" />
      <path d={d} stroke={look.limb} strokeWidth={100 * k} fill="none" strokeLinecap="round" />
      <g transform={`translate(${hand.x} ${hand.y}) rotate(${rot}) scale(${s})`}>
        {kind === 'fist' ? (
          <g>
            <rect x={-13} y={-4} width={26} height={22} rx={8} fill={look.hand} stroke={look.line} strokeWidth={2.4} />
            <path d="M -6 2 L -6 10 M 0 2 L 0 11 M 6 2 L 6 10" stroke={look.line} strokeWidth={1.4} opacity={0.5} strokeLinecap="round" />
            <ellipse cx={-12} cy={4} rx={4} ry={6} fill={look.hand} stroke={look.line} strokeWidth={2.2} />
          </g>
        ) : (
          <g>
            <ellipse cx={-10} cy={3} rx={5.5} ry={9} transform="rotate(28 -10 3)" fill={look.hand} stroke={look.line} strokeWidth={2.4} />
            <ellipse cx={0} cy={10} rx={11} ry={15} fill={look.hand} stroke={look.line} strokeWidth={2.4} />
          </g>
        )}
      </g>
    </g>
  );
};

/**
 * A character seen from behind, for over-the-shoulder shots: the back of the head, the hood bunched at the neck, the
 * shoulders running off frame and, for You, the cube backpack. Origin at the base of the neck; `s` 1 is rig size.
 * Meant big in the foreground: `dim` darkens it and `blur` softens it (world units), with the rim on the lit edge.
 */
export const BackView: React.FC<{ x: number; y: number; s?: number; look: Look; rim?: string; tilt?: number; dim?: number; blur?: number; id: string }> = ({
  x, y, s = 1, look, rim = 'rimR', tilt = 0, dim = 0.5, blur = 8, id,
}) => (
  <g filter={`url(#bv-${id})`}>
    <defs>
      <filter id={`bv-${id}`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation={blur} />
        <feComponentTransfer>
          <feFuncR type="linear" slope={dim} />
          <feFuncG type="linear" slope={dim} />
          <feFuncB type="linear" slope={dim} />
        </feComponentTransfer>
      </filter>
    </defs>
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt})`} filter={`url(#${rim})`}>
      <path d="M -168 760 L -146 44 Q -136 -4 -62 -14 Q 0 -22 62 -14 Q 136 -4 146 44 L 168 760 Z" fill={look.jacket} stroke={look.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -168 760 L -146 44 Q -140 18 -116 6 L -120 760 Z" fill={look.jacketShade} opacity={0.6} />
      <path d="M 168 760 L 146 44 Q 140 18 116 6 L 120 760 Z" fill={look.jacketShade} opacity={0.6} />
      <path d="M -66 -4 Q -78 -56 0 -62 Q 78 -56 66 -4 Q 0 16 -66 -4 Z" fill={look.jacketShade} stroke={look.line} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={0} cy={-96} r={62} fill={look.skin} stroke={look.line} strokeWidth={4} />
      <path d="M -44 -50 A 62 62 0 0 0 50 -56 A 72 72 0 0 1 -44 -50 Z" fill={look.skinShade} />
      {look.pack ? (
        <g>
          <path d="M -56 30 Q -76 0 -96 -6 M 56 30 Q 76 0 96 -6" stroke="#2E3A4A" strokeWidth={16} strokeLinecap="round" fill="none" />
          <path d="M -70 40 L -54 18 L 54 18 L 70 40 Z" fill="#3A4A5E" stroke={look.line} strokeWidth={4} strokeLinejoin="round" />
          <rect x={-70} y={40} width={140} height={150} rx={6} fill="#26313F" stroke={look.line} strokeWidth={4} />
          <path d="M -56 62 L 56 62" stroke="#8BE04E" strokeWidth={4} />
          <rect x={-8} y={56} width={16} height={14} rx={3} fill="#8BE04E" />
        </g>
      ) : null}
    </g>
  </g>
);

// ---------------------------------------------------------------- props for episode 1
/** A twin-bell alarm clock, front-on. `ring` 0..1 shakes it and draws ring marks; `t` drives the shake. */
export const AlarmClock: React.FC<{ x: number; y: number; s?: number; t: number; ring?: number; time?: [number, number] }> = ({ x, y, s = 1, t, ring = 0, time = [6, 30] }) => {
  const wob = ring * Math.sin(t * 2.6) * 7;
  const hop = ring * Math.abs(Math.sin(t * 1.3)) * 6;
  const hr = ((time[0] % 12) + time[1] / 60) * 30;
  const mn = time[1] * 6;
  return (
    <g transform={`translate(${x} ${y - hop}) scale(${s}) rotate(${wob} 0 40)`}>
      <ellipse cx={0} cy={86 + hop / s} rx={70} ry={10} fill="#000" opacity={0.3} />
      <path d="M -46 56 L -60 84 M 46 56 L 60 84" stroke={GR.ink} strokeWidth={9} strokeLinecap="round" />
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`rotate(${sd * 28} ${sd * 44} -58)`}>
          <path d={`M ${sd * 44 - 26} -54 A 26 22 0 0 1 ${sd * 44 + 26} -54 Z`} fill="#D9D3C8" stroke={GR.ink} strokeWidth={5} />
        </g>
      ))}
      <path d="M -10 -74 L 10 -74 L 6 -60 L -6 -60 Z" fill={GR.ink} />
      <circle cx={0} cy={0} r={66} fill="#E8483F" stroke={GR.ink} strokeWidth={6} />
      <path d="M 26 -58 A 66 66 0 0 1 60 26 A 70 70 0 0 0 26 -58 Z" fill="#B8352E" />
      <circle cx={0} cy={0} r={50} fill={GR.white} stroke={GR.ink} strokeWidth={4} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M 0 -42 L 0 -36" transform={`rotate(${i * 30})`} stroke={GR.ink} strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round" />
      ))}
      <path d="M 0 0 L 0 -24" transform={`rotate(${hr})`} stroke={GR.ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M 0 0 L 0 -36" transform={`rotate(${mn})`} stroke={GR.ink} strokeWidth={5} strokeLinecap="round" />
      <circle cx={0} cy={0} r={5} fill="#E8483F" />
      {ring > 0
        ? [-1, 1].map((sd) => (
            <g key={sd} stroke={GR.yellow} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.6 + 0.4 * Math.abs(Math.sin(t * 1.7 + sd))}>
              <path d={`M ${sd * 92} -64 q ${sd * 14} 10 ${sd * 6} 26`} />
              <path d={`M ${sd * 112} -84 q ${sd * 22} 20 ${sd * 10} 46`} />
            </g>
          ))
        : null}
    </g>
  );
};

/** A school bus, side-on, nose to the right. */
export const Bus: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={360} ry={18} fill="#000" opacity={0.35} />
    <path d="M -340 -20 L -340 -230 Q -340 -250 -320 -250 L 250 -250 Q 280 -250 290 -220 L 300 -150 L 360 -140 Q 376 -136 376 -116 L 376 -20 Z" fill="#F2B33D" stroke={GR.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M 250 -250 Q 280 -250 290 -220 L 300 -150 L 360 -140 Q 376 -136 376 -116 L 376 -20 L 300 -20 L 300 -150 Z" fill="#D4922A" opacity={0.55} />
    <rect x={-320} y={-224} width={560} height={78} rx={8} fill="#2A2436" />
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={-312 + i * 92} y={-216} width={80} height={62} rx={6} fill="#FFD9A0" opacity={0.85} />
    ))}
    <rect x={250} y={-232} width={44} height={86} rx={6} fill="#9FD3E6" stroke={GR.ink} strokeWidth={4} />
    <path d="M -340 -120 L 376 -120 M -340 -96 L 376 -96" stroke={GR.ink} strokeWidth={5} />
    <rect x={354} y={-108} width={22} height={14} rx={3} fill="#FFF1C8" />
    {[-230, 230].map((wx) => (
      <g key={wx} transform={`rotate(${t * 9} ${wx} -14)`}>
        <circle cx={wx} cy={-14} r={42} fill="#26212F" stroke={GR.ink} strokeWidth={6} />
        <circle cx={wx} cy={-14} r={16} fill="#9A93A8" />
        <path d={`M ${wx} -46 L ${wx} 18 M ${wx - 32} -14 L ${wx + 32} -14`} stroke="#5E5A6C" strokeWidth={4} />
      </g>
    ))}
  </g>
);

/** A small hatchback, side-on, nose to the right. `hazard` blinks the amber corner lights (parked where it shouldn't be). */
export const Car: React.FC<{ x: number; y: number; s?: number; color?: string; shade?: string; hazard?: boolean; t?: number }> = ({ x, y, s = 1, color = '#D64545', shade = '#A83535', hazard = false, t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={20} cy={10} rx={300} ry={20} fill="#000" opacity={0.38} />
    <path d="M -270 -20 L -270 -96 Q -262 -126 -222 -132 L -110 -142 Q -60 -208 30 -212 L 150 -212 Q 214 -206 256 -146 L 300 -132 Q 326 -124 326 -90 L 326 -20 Z" fill={color} stroke={GR.ink} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -86 -146 Q -46 -194 30 -196 L 92 -196 L 92 -146 Z" fill="#9FD3E6" stroke={GR.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 112 -196 L 150 -196 Q 200 -190 232 -146 L 112 -146 Z" fill="#9FD3E6" stroke={GR.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -262 -70 L 318 -70" stroke={shade} strokeWidth={6} />
    <path d="M 100 -146 L 100 -30" stroke={shade} strokeWidth={4} />
    <rect x={304} y={-112} width={20} height={14} rx={3} fill="#FFF1C8" />
    <rect x={-270} y={-110} width={14} height={16} rx={3} fill="#FF5A4A" />
    {[-170, 210].map((wx) => (
      <g key={wx}>
        <circle cx={wx} cy={-16} r={48} fill="#26212F" stroke={GR.ink} strokeWidth={7} />
        <circle cx={wx} cy={-16} r={18} fill="#9A93A8" />
      </g>
    ))}
    {hazard && Math.floor(t / 9) % 2 === 0
      ? [[-266, -88], [318, -86]].map(([hx, hy], i) => (
          <g key={i}>
            <rect x={hx - 9} y={hy - 9} width={18} height={18} rx={4} fill="#FFB547" />
            <circle cx={hx} cy={hy} r={70} fill="url(#g3warm)" opacity={0.85} style={{ mixBlendMode: 'screen' }} />
          </g>
        ))
      : null}
  </g>
);

/** A bike, side-on, leaning on its stand. */
export const Bike: React.FC<{ x: number; y: number; s?: number; color?: string; rot?: number }> = ({ x, y, s = 1, color = '#2FB7A6', rot = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot} 0 -40)`} fill="none" stroke={GR.ink} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={-70} cy={-44} r={44} strokeWidth={7} />
    <circle cx={70} cy={-44} r={44} strokeWidth={7} />
    <path d="M -70 -44 L -20 -44 L 30 -110 L -36 -110 Z M -20 -44 L -44 -126 M 70 -44 L 40 -134 L 62 -140" stroke={GR.ink} strokeWidth={13} />
    <path d="M -70 -44 L -20 -44 L 30 -110 L -36 -110 Z M -20 -44 L -44 -126 M 70 -44 L 40 -134 L 62 -140" stroke={color} strokeWidth={7} />
    <path d="M -58 -128 L -28 -128" stroke={GR.ink} strokeWidth={12} />
  </g>
);

/** A street lamp: pole, head, a pool of warm light on the ground and a soft cone. */
export const StreetLamp: React.FC<{ x: number; y: number; h?: number; t?: number; side?: 1 | -1; o?: number }> = ({ x, y, h = 520, t = 0, side = 1, o = 1 }) => {
  const hx = x + side * 70;
  const hy = y - h;
  const flick = 0.92 + 0.08 * Math.sin(t / 3.3) * Math.sin(t / 7.1);
  return (
    <g>
      <path d={`M ${hx - 30} ${hy + 16} L ${hx - 160} ${y} L ${hx + 160} ${y} L ${hx + 30} ${hy + 16} Z`} fill="url(#kitShaft)" opacity={0.55 * o * flick} />
      <ellipse cx={hx} cy={y + 4} rx={190} ry={30} fill="#FFD9A0" opacity={0.18 * o * flick} />
      <path d={`M ${x} ${y} L ${x} ${hy + 20} Q ${x} ${hy} ${hx - side * 20} ${hy}`} stroke="#1E1A2A" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d={`M ${hx - 34} ${hy - 6} L ${hx + 34} ${hy - 6} L ${hx + 22} ${hy + 14} L ${hx - 22} ${hy + 14} Z`} fill="#1E1A2A" />
      <rect x={hx - 20} y={hy + 12} width={40} height={8} rx={3} fill="#FFF1C8" />
      <Glow x={hx} y={hy + 18} r={120} o={0.7 * o * flick} />
    </g>
  );
};
