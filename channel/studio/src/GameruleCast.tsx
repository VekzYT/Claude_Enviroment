import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hero, basePose, Pose, LOOKS, CastName, KitDefs, SetDefs, Study, FONT } from './engine';

// GAMERULE's cast sheet: each of our costumes front-on and three-quarter, then You in the poses the episodes lean on.
// Check every new look here against the skill's default cast (npx remotion still src/index.ts Cast) and the genre's
// heroes before using it:
//   npx remotion still src/index.ts GameruleCast out/gamerule-cast.png

const Label: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill="#F6EFE3" letterSpacing={2}>
    {text}
  </text>
);
const P = (o: Partial<Pose>): Pose => ({ ...basePose, ...o });
const CAST: { look: CastName; name: string; scale: number }[] = [
  { look: 'you', name: 'YOU', scale: 0.82 },
  { look: 'dex', name: 'DEX', scale: 0.88 },
  { look: 'juni', name: 'JUNI', scale: 0.58 },
  { look: 'momGR', name: 'MOM', scale: 0.84 },
];

export const GameruleCast: React.FC = () => {
  const row1 = 440;
  const row2 = 900;
  const poses: { name: string; p: Partial<Pose> }[] = [
    { name: 'mine (punch)', p: { armR: { a: 92, b: -4 }, armL: { a: 30, b: 100 }, yaw: 0.5, look: 1, expr: 'smug', legL: { a: -18, b: 6 }, legR: { a: 22, b: -16 } } },
    { name: 'no rule yet', p: { armL: { a: 12, b: -8 }, armR: { a: 12, b: -8 }, expr: 'neutral' } },
    { name: 'clutch', p: { armL: { a: 150, b: 10 }, armR: { a: 120, b: -20 }, expr: 'shock', tilt: -8, look: -0.4 } },
    { name: 'cheer', p: { armL: { a: 135, b: 20 }, armR: { a: 135, b: 20 }, expr: 'happy', squash: -0.05 } },
    { name: 'the admin?', p: { armL: { a: 60, b: 40 }, armR: { a: 60, b: 40 }, expr: 'worried', yaw: -0.3, look: -0.8 } },
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: '#14101C' }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <KitDefs />
        <SetDefs />
        <g filter="url(#blur10)">
          <Study t={0} id="grcast" />
        </g>
        <rect width={1920} height={1080} fill="#0B0816" opacity={0.35} />
        {CAST.map((c, i) => {
          const x = 250 + i * 450;
          const y = row1 + (0.82 - c.scale) * 340;
          return (
            <g key={c.look}>
              <Hero look={LOOKS[c.look]} pose={P({ x: x - 85, y, scale: c.scale, yaw: 0, expr: 'happy' })} shadow={0.6} t={i * 20} />
              <Hero look={LOOKS[c.look]} pose={P({ x: x + 85, y, scale: c.scale, yaw: 0.45, look: 0.6, expr: 'neutral' })} shadow={0.6} t={i * 20 + 9} />
              <Label x={x} y={row1 + 175} text={c.name} />
            </g>
          );
        })}
        {poses.map((q, i) => (
          <g key={q.name}>
            <Hero look={q.name === 'no rule yet' ? LOOKS.youPlain : LOOKS.you} pose={P({ x: 220 + i * 370, y: row2 - 40, scale: 0.72, ...q.p })} shadow={0.6} t={i * 13} />
            <Label x={220 + i * 370} y={row2 + 110} text={q.name.toUpperCase()} />
          </g>
        ))}
        <text x={60} y={70} fontFamily={FONT.title} fontWeight={800} fontSize={44} fill="#8BE04E">GAMERULE · CAST</text>
      </svg>
    </AbsoluteFill>
  );
};
