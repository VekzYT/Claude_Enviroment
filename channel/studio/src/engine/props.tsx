import React from 'react';
import { C } from './rig';
import { FONT } from './fonts';

// ---------- the cat ----------
export const Cat: React.FC<{ x: number; y: number; mood: 'sleep' | 'alert' | 'peek'; f: number }> = ({ x, y, mood, f }) => {
  const puff = mood === 'alert' ? 1.15 : 1;
  const body = '#3A3E57';
  const breathe = mood === 'sleep' ? Math.sin(f / 8) * 2 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={6} rx={70} ry={9} fill="#000" opacity={0.25} />
      {(() => {
        // the tail never quite stops: a lazy flick asleep, a twitchy one when startled
        const fl = Math.sin(f / 7) * (mood === 'alert' ? 14 : 7);
        return <path d={`M 52 -8 Q ${92 + fl} ${-40 - (mood === 'alert' ? 30 : 0)} ${70 + fl * 1.6} ${mood === 'alert' ? -90 : -18 + fl * 0.6}`} stroke={body} strokeWidth={12} fill="none" strokeLinecap="round" />;
      })()}
      <ellipse cx={0} cy={-26 - breathe} rx={58 * puff} ry={(32 + breathe) * puff} fill={body} />
      <g transform={`translate(-44 ${-46 - (mood === 'alert' ? 14 : 0)})`}>
        <path d="M -24 -12 L -18 -46 L -2 -22 Z M 22 -12 L 16 -46 L 0 -22 Z" fill={body} />
        <circle cx={0} cy={0} r={30} fill={body} />
        {mood === 'sleep' ? (
          <path d="M -16 2 q 6 5 12 0 M 4 2 q 6 5 12 0" stroke="#C9CCE0" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        ) : mood === 'peek' ? (
          <g>
            <path d="M -16 2 q 6 5 12 0" stroke="#C9CCE0" strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <circle cx={10} cy={0} r={6} fill="#E8D86A" />
            <circle cx={10} cy={0} r={2.5} fill="#111" />
          </g>
        ) : (
          <g>
            <circle cx={-10} cy={-2} r={8} fill="#E8D86A" />
            <circle cx={10} cy={-2} r={8} fill="#E8D86A" />
            <circle cx={-10} cy={-2} r={3} fill="#111" />
            <circle cx={10} cy={-2} r={3} fill="#111" />
            <path d="M -6 14 L 0 10 L 6 14" stroke="#C9CCE0" strokeWidth={3} fill="none" />
          </g>
        )}
      </g>
      {mood === 'sleep' ? (
        <text x={-20} y={-96 - (f % 40)} fontFamily={FONT.title} fontWeight={800} fontSize={28} fill="#C9CCE0" opacity={1 - (f % 40) / 40}>z</text>
      ) : null}
    </g>
  );
};

// ---------- the mug ----------
export const Mug: React.FC<{ x: number; y: number; rot: number; steam?: number; f: number }> = ({ x, y, rot: r, steam = 1, f }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    {/* x,y = bottom centre */}
    <path d="M 22 -40 q 22 2 18 18 q -4 12 -18 10" stroke="#F4F1EA" strokeWidth={8} fill="none" />
    <rect x={-24} y={-52} width={48} height={52} rx={8} fill="#F4F1EA" />
    <rect x={-24} y={-36} width={48} height={10} fill={C.orange} />
    <ellipse cx={0} cy={-50} rx={20} ry={4} fill="#5B3A26" />
    {steam > 0
      ? [0, 1].map((i) => (
          <path
            key={i}
            d={`M ${-8 + i * 14} -60 q ${-8 + Math.sin(f / 6 + i) * 5} -12 ${Math.sin(f / 9 + i) * 3} -22 q ${8 + Math.sin(f / 5 + i * 2) * 5} -10 ${Math.sin(f / 8 + i) * 5} -22`}
            stroke="#ffffff"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            opacity={steam * (0.35 + 0.25 * Math.sin(f / 6 + i * 2))}
          />
        ))
      : null}
  </g>
);

// ---------- food and paper ----------
/** A cookie seen from the side and a little above: x, y is the middle of its base; `s` scales it, `bite` takes a bite out. */
export const Cookie: React.FC<{ x: number; y: number; s?: number; rot?: number; bite?: number; seed?: number }> = ({ x, y, s = 1, rot = 0, bite = 0, seed = 1 }) => {
  const chips = [[-14, -16], [10, -20], [-2, -8], [18, -10], [-20, -6], [4, -26]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {bite > 0 ? (
        <defs>
          <mask id={`bite${seed}`}>
            <rect x={-60} y={-60} width={120} height={80} fill="#fff" />
            <circle cx={30} cy={-24} r={14 * bite} fill="#000" />
            <circle cx={22} cy={-34} r={11 * bite} fill="#000" />
          </mask>
        </defs>
      ) : null}
      <g mask={bite > 0 ? `url(#bite${seed})` : undefined}>
        <ellipse cx={0} cy={-6} rx={36} ry={12} fill="#9A6234" />
        <ellipse cx={0} cy={-14} rx={36} ry={13} fill="#D9A15C" />
        <ellipse cx={-6} cy={-17} rx={22} ry={6} fill="#E8B872" opacity={0.7} />
        {chips.map(([cx, cy], i) => (
          <ellipse key={i} cx={cx * 0.9} cy={cy * 0.45 - 6} rx={4.5} ry={3} fill="#4A2A1A" />
        ))}
        <path d="M -36 -14 Q 0 -30 36 -14" stroke="#FFD9A0" strokeWidth={2} fill="none" opacity={0.6} />
      </g>
    </g>
  );
};

/** A cookie seen from straight above (inserts and top-down shots). */
export const CookieTop: React.FC<{ x: number; y: number; r?: number; rot?: number }> = ({ x, y, r = 60, rot = 0 }) => {
  const edge =
    Array.from({ length: 14 })
      .map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const rr = r * (0.94 + 0.06 * Math.sin(i * 2.7));
        return `${i ? 'L' : 'M'} ${Math.cos(a) * rr} ${Math.sin(a) * rr}`;
      })
      .join(' ') + ' Z';
  const chips = [[-0.4, -0.3], [0.25, -0.45], [0.45, 0.1], [-0.1, 0.35], [-0.5, 0.25], [0.15, 0.05], [0.05, -0.15]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <circle cx={4} cy={6} r={r} fill="#000" opacity={0.25} />
      <path d={edge} fill="#D29A55" />
      <circle cx={-r * 0.15} cy={-r * 0.18} r={r * 0.62} fill="#E2AE68" opacity={0.6} />
      {chips.map(([a, b], i) => (
        <path key={i} d={`M ${a * r - 7} ${b * r} l 7 -6 l 7 6 l -3 6 l -8 0 Z`} fill="#4A2A1A" transform={`rotate(${i * 47} ${a * r} ${b * r})`} />
      ))}
    </g>
  );
};

/** A plate, side view: x, y is the middle of its base. */
export const Plate: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={84} ry={14} fill="#000" opacity={0.3} />
    <ellipse cx={0} cy={-4} rx={80} ry={16} fill="#CFC8BC" />
    <ellipse cx={0} cy={-8} rx={80} ry={15} fill="#F4F1EA" />
    <ellipse cx={0} cy={-8} rx={56} ry={9} fill="#E6E0D4" />
  </g>
);

/** A plate from straight above. */
export const PlateTop: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 170 }) => (
  <g>
    <circle cx={x + 10} cy={y + 14} r={r} fill="#000" opacity={0.3} />
    <circle cx={x} cy={y} r={r} fill="#F4F1EA" />
    <circle cx={x} cy={y} r={r * 0.72} fill="#E6E0D4" />
    <path d={`M ${x - r * 0.8} ${y - r * 0.4} A ${r * 0.9} ${r * 0.9} 0 0 1 ${x - r * 0.2} ${y - r * 0.85}`} stroke="#FFFFFF" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
  </g>
);

/** A sheet of paper from above: lines of writing, ticks and a grade when `done` (fill 0..1 writes it in), blank when not. */
export const Paper: React.FC<{ x: number; y: number; w?: number; rot?: number; done?: boolean; grade?: string; fill?: number }> = ({ x, y, w = 300, rot = 0, done = true, grade = 'A+', fill = 1 }) => {
  const h = w * 1.3;
  const lines = 9;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} fill="#000" opacity={0.3} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#F4EEE0" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.09} fill="#E6DCC6" />
      {Array.from({ length: lines }).map((_, i) => {
        const yy = -h / 2 + h * 0.17 + i * h * 0.085;
        const len = (0.55 + 0.35 * Math.abs(Math.sin(i * 1.9))) * (w - 90);
        const shown = done ? Math.min(1, Math.max(0, fill * lines - i)) : 0;
        return (
          <g key={i}>
            <path d={`M ${-w / 2 + 24} ${yy + 10} L ${w / 2 - 24} ${yy + 10}`} stroke="#B9C4D6" strokeWidth={2} />
            {shown > 0 ? <path d={`M ${-w / 2 + 30} ${yy} L ${-w / 2 + 30 + len * shown} ${yy}`} stroke="#3A4A6A" strokeWidth={5} strokeLinecap="round" /> : null}
            {done && shown >= 1 && i % 2 === 0 ? <path d={`M ${w / 2 - 44} ${yy} l 8 8 l 14 -16`} stroke="#3BA05A" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          </g>
        );
      })}
      {done && grade && fill >= 1 ? (
        <g transform={`translate(${w / 2 - 58} ${-h / 2 + 46}) rotate(-12)`}>
          <circle r={34} fill="none" stroke="#D9534F" strokeWidth={5} />
          <text y={13} textAnchor="middle" fontFamily={FONT.hand} fontWeight={700} fontSize={36} fill="#D9534F">
            {grade}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** A neat stack of papers seen from the side and a little above: x, y the middle of its base, n sheets. */
export const PaperStack: React.FC<{ x: number; y: number; n: number; w?: number }> = ({ x, y, n, w = 220 }) => (
  <g>
    <ellipse cx={x + 8} cy={y + 2} rx={w * 0.6} ry={10} fill="#000" opacity={0.3} />
    {Array.from({ length: n }).map((_, i) => (
      <g key={i} transform={`translate(${x + Math.sin(i * 2.3) * 5} ${y - i * 7})`}>
        <polygon points={`${-w / 2},0 ${w / 2},0 ${w / 2 - 20},-14 ${-w / 2 + 20},-14`} fill={i === n - 1 ? '#F4EEE0' : '#E6DCC6'} />
        <path d={`M ${-w / 2} 0 L ${w / 2} 0`} stroke="#B8AC94" strokeWidth={2} />
      </g>
    ))}
  </g>
);

/** A tower of cookies, side view: x, y the middle of its base. */
export const CookieStack: React.FC<{ x: number; y: number; n: number; s?: number }> = ({ x, y, n, s = 1 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => (
      <Cookie key={i} x={x + Math.sin(i * 1.7) * 4 * s} y={y - i * 14 * s} s={s} rot={Math.sin(i * 2.1) * 3} seed={i + 20} />
    ))}
  </g>
);
