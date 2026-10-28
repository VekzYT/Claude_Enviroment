import React from 'react';

// The dusk lighting kit for v2 (see STYLE-SPEC.md, Look A): light does most of the work.
// Back-lit sky with a low sun and slow rays, bloom, haze, bokeh, window light shafts,
// rim-light filters per light direction, and depth-of-field blurs.

export const D = {
  skyTop: '#25184A',
  skyMid: '#6E3A6E',
  horizon: '#F2985A',
  sun: '#FFE7B3',
  warm: '#FFB45E',
  rim: '#FFB15A',
  night: '#120E26',
};

const rnd = (seed: number, i: number) => Math.abs(Math.sin(seed * 31.7 + i * 12.9898) * 43758.5453) % 1;

/** Filters shared by every shot: rim light from the left or right, blurs for depth of field. */
export const KitDefs: React.FC = () => (
  <defs>
    <filter id="rimR" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx={4} dy={-1} stdDeviation={1.8} floodColor={D.rim} floodOpacity={1} />
      <feDropShadow dx={0} dy={0} stdDeviation={14} floodColor="#FF9A4A" floodOpacity={0.35} />
    </filter>
    <filter id="rimL" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx={-4} dy={-1} stdDeviation={1.8} floodColor={D.rim} floodOpacity={1} />
      <feDropShadow dx={0} dy={0} stdDeviation={14} floodColor="#FF9A4A" floodOpacity={0.35} />
    </filter>
    <filter id="rimRed" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx={0} dy={-2} stdDeviation={2} floodColor="#FF4A4A" floodOpacity={1} />
      <feDropShadow dx={0} dy={0} stdDeviation={16} floodColor="#FF2A3A" floodOpacity={0.45} />
    </filter>
    {[3, 6, 10, 16].map((b) => (
      <filter key={b} id={`blur${b}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={b} />
      </filter>
    ))}
    <radialGradient id="kitBloom">
      <stop offset="0%" stopColor={D.sun} stopOpacity={0.9} />
      <stop offset="35%" stopColor={D.warm} stopOpacity={0.35} />
      <stop offset="100%" stopColor={D.warm} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="kitBloomRed">
      <stop offset="0%" stopColor="#FF6A5A" stopOpacity={0.8} />
      <stop offset="35%" stopColor="#C8102E" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#C8102E" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="kitShaft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFD9A0" stopOpacity={0.32} />
      <stop offset="100%" stopColor="#FFD9A0" stopOpacity={0} />
    </linearGradient>
  </defs>
);

/** A sky that fills the frame (in world units around the given box), back-lit by a low sun. */
export const DuskSky: React.FC<{ id: string; x0?: number; y0?: number; w?: number; h?: number; horizonY: number; red?: number }> = ({
  id,
  x0 = -400,
  y0 = -400,
  w = 2720,
  h = 1880,
  horizonY,
  red = 0,
}) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1={y0} x2="0" y2={horizonY + 60} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor={D.skyTop} />
        <stop offset="62%" stopColor={D.skyMid} />
        <stop offset="100%" stopColor={D.horizon} />
      </linearGradient>
    </defs>
    <rect x={x0} y={y0} width={w} height={h} fill={`url(#${id})`} />
    {red > 0 ? <rect x={x0} y={y0} width={w} height={h} fill="#7A0F22" opacity={0.75 * red} /> : null}
  </g>
);

/** Radial god rays from a point, turning slowly. */
export const Rays: React.FC<{ x: number; y: number; t: number; len?: number; n?: number; o?: number; color?: string }> = ({
  x,
  y,
  t,
  len = 1600,
  n = 14,
  o = 0.13,
  color = '#FFE2B0',
}) => (
  <g transform={`translate(${x} ${y}) rotate(${t * 0.12})`} opacity={o}>
    {Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * 360 + rnd(3, i) * 8;
      const wdt = 2.2 + rnd(5, i) * 3.5;
      return <path key={i} transform={`rotate(${a})`} d={`M 0 0 L ${len} ${-len * wdt / 100} L ${len} ${len * wdt / 100} Z`} fill={color} />;
    })}
  </g>
);

export const Sun: React.FC<{ x: number; y: number; r: number; t: number; rays?: boolean; red?: number }> = ({ x, y, r, t, rays = true, red = 0 }) => (
  <g>
    <circle cx={x} cy={y} r={r * 5} fill={red > 0.5 ? 'url(#kitBloomRed)' : 'url(#kitBloom)'} />
    {rays ? <Rays x={x} y={y} t={t} color={red > 0.5 ? '#FF7A6A' : undefined} o={red > 0.5 ? 0.09 : undefined} /> : null}
    <circle cx={x} cy={y} r={r} fill={red > 0.5 ? '#E8414E' : D.sun} />
  </g>
);

export const Haze: React.FC<{ y: number; h?: number; o?: number }> = ({ y, h = 260, o = 0.35 }) => (
  <g>
    <defs>
      <linearGradient id={`haze${y}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={D.warm} stopOpacity={0} />
        <stop offset="50%" stopColor={D.warm} stopOpacity={o} />
        <stop offset="100%" stopColor={D.warm} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-400} y={y - h / 2} width={2720} height={h} fill={`url(#haze${y})`} />
  </g>
);

export const Bokeh: React.FC<{ seed: number; n?: number; x0: number; y0: number; w: number; h: number; t: number; o?: number }> = ({ seed, n = 10, x0, y0, w, h, t, o = 0.22 }) => (
  <g filter="url(#blur6)">
    {Array.from({ length: n }).map((_, i) => (
      <circle
        key={i}
        cx={x0 + rnd(seed, i) * w + Math.sin(t / 40 + i) * 12}
        cy={y0 + rnd(seed + 1, i) * h + Math.cos(t / 50 + i) * 8}
        r={14 + rnd(seed + 2, i) * 36}
        fill={i % 3 ? '#FFD9A0' : '#FF9AB0'}
        opacity={o * (0.5 + rnd(seed + 3, i) * 0.5)}
      />
    ))}
  </g>
);

/** A light shaft through a window: a soft, fading quad. */
export const Shaft: React.FC<{ d: string; o?: number }> = ({ d, o = 1 }) => <path d={d} fill="url(#kitShaft)" opacity={o} />;

/** A dark, blurred foreground shape for depth (over-the-shoulder heads, a desk edge). */
export const Foreground: React.FC<{ children: React.ReactNode; blur?: number }> = ({ children, blur = 10 }) => (
  <g filter={`url(#blur${blur})`}>{children}</g>
);

export const Skyline: React.FC<{ y: number; seed: number; color?: string; h?: number }> = ({ y, seed, color = '#2A1B45', h = 160 }) => {
  let d = `M -400 ${y}`;
  let x = -400;
  let i = 0;
  while (x < 2320) {
    const bw = 60 + rnd(seed, i) * 120;
    const bh = 40 + rnd(seed + 1, i) * h;
    d += ` L ${x} ${y - bh} L ${x + bw} ${y - bh}`;
    x += bw;
    i++;
  }
  d += ` L 2320 ${y} Z`;
  return (
    <g>
      <path d={d} fill={color} />
      {Array.from({ length: 40 }).map((_, k) => (
        <rect key={k} x={-300 + rnd(seed + 5, k) * 2500} y={y - 20 - rnd(seed + 6, k) * h * 0.8} width={8} height={10} fill="#FFC27A" opacity={0.25 + rnd(seed + 7, k) * 0.5} />
      ))}
    </g>
  );
};
