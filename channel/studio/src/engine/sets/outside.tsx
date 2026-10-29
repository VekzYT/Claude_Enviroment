import React from 'react';
import { rnd } from '../anim';
import { DuskSky, Sun, Skyline, Haze } from '../kit';
import { Glow, LightVeil, Dust } from '../light';
import { FONT } from '../fonts';
import { Bus, StreetLamp, Bike, AlarmClock } from '../gamerule';

// GAMERULE's first sets, built for episode 1 in the genre's dusk light (dawn reads the same: purple to orange).
// Coordinates are world units; wides frame them at zoom about 1.

const BRICK = '#7E4334';
const BRICK_SHADE = '#5E3226';
const MORTAR = '#4A3A3C';

/** A brick pattern and a facade gradient that sinks toward the ground, shared by both sets. */
const BrickDefs: React.FC<{ id: string; y0: number; y1: number }> = ({ id, y0, y1 }) => (
  <defs>
    <pattern id={`${id}-brick`} width={64} height={32} patternUnits="userSpaceOnUse">
      <rect width={64} height={32} fill={MORTAR} />
      <rect x={1} y={1} width={30} height={14} fill={BRICK} />
      <rect x={33} y={1} width={30} height={14} fill={BRICK_SHADE} />
      <rect x={-15} y={17} width={30} height={14} fill={BRICK_SHADE} />
      <rect x={17} y={17} width={30} height={14} fill={BRICK} />
      <rect x={49} y={17} width={30} height={14} fill={BRICK_SHADE} />
    </pattern>
    <linearGradient id={`${id}-sink`} x1="0" y1={y0} x2="0" y2={y1} gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#120E26" stopOpacity={0.15} />
      <stop offset="100%" stopColor="#120E26" stopOpacity={0.55} />
    </linearGradient>
  </defs>
);

/** A lit window: a warm pane with a sash bar and a sill; `on` 0..1. */
const Win: React.FC<{ x: number; y: number; w: number; h: number; on?: number }> = ({ x, y, w, h, on = 1 }) => (
  <g>
    <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill="#3A2A30" />
    <rect x={x} y={y} width={w} height={h} fill={on > 0.5 ? '#FFC877' : '#2A2238'} opacity={on > 0.5 ? 0.92 : 1} />
    {on > 0.5 ? <rect x={x} y={y} width={w} height={h * 0.45} fill="#FFE2B0" opacity={0.5} /> : null}
    <path d={`M ${x + w / 2} ${y} L ${x + w / 2} ${y + h} M ${x} ${y + h / 2} L ${x + w} ${y + h / 2}`} stroke="#3A2A30" strokeWidth={6} />
    <rect x={x - 10} y={y + h + 4} width={w + 20} height={10} fill="#2A2026" />
  </g>
);

/** Sidewalk, curb and road with its centre dashes; feet stand on y 812, wheels on y 935. Shared by the streets. */
const Street: React.FC = () => (
  <g>
    <rect x={-400} y={800} width={2720} height={44} fill="#5A5168" />
    <rect x={-400} y={800} width={2720} height={4} fill="#7A7090" opacity={0.6} />
    <rect x={-400} y={844} width={2720} height={10} fill="#231E2C" />
    <rect x={-400} y={854} width={2720} height={800} fill="#2B2535" />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={`d${i}`} x={-300 + i * 240} y={985} width={120} height={10} fill="#FFD93B" opacity={0.45} />
    ))}
  </g>
);

// ---------------------------------------------------------------- the school street
/** Where the doorway gets mined: a column of block cells in the facade, near the ground. */
export const SCHOOL_HOLE = { x: 600, y: 800, cell: 124, cols: 1, rows: 2 };

/**
 * The school's long side from across the street at dawn: a brick facade with lit windows, the ELMSWOOD HIGH sign,
 * and no door: a painted arrow runs the length of the wall to the MAIN ENTRANCE round the corner (the long way). The
 * sidewalk (feet at y about 812), the road, two street lamps. `hole` 0..1 takes the doorway cells out of the facade
 * one at a time, bottom first, showing the lit classroom inside, its light spilling onto the pavement.
 */
export const SchoolStreet: React.FC<{ t: number; id: string; hole?: number; veil?: number }> = ({ t, id, hole = 0, veil = 0.38 }) => {
  const H = SCHOOL_HOLE;
  const cells = Array.from({ length: H.cols * H.rows }, (_, k) => ({ c: k % H.cols, r: Math.floor(k / H.cols) }));
  const gone = Math.round(hole * cells.length);
  const x0 = H.x;
  const x1 = H.x + H.cell * H.cols;
  const top = H.y - Math.ceil(gone / H.cols) * H.cell;
  return (
    <g>
      <BrickDefs id={id} y0={240} y1={800} />
      <DuskSky id={`${id}-sky`} horizonY={640} />
      <Sun x={1560} y={560} r={130} t={t} />
      <Skyline y={600} seed={4} h={190} />
      <Haze y={520} h={180} o={0.3} />
      {/* the facade */}
      <rect x={60} y={250} width={1800} height={560} fill={`url(#${id}-brick)`} />
      <rect x={60} y={250} width={1800} height={560} fill={`url(#${id}-sink)`} />
      <rect x={40} y={226} width={1840} height={34} fill="#2A2232" />
      <rect x={40} y={258} width={1840} height={8} fill="#1A1424" opacity={0.7} />
      <rect x={1846} y={250} width={14} height={560} fill="#1A1424" opacity={0.5} />
      {[190, 400, 1300, 1510, 1700].map((x, i) => <Win key={`a${i}`} x={x} y={310} w={120} h={120} on={rnd(7, i) > 0.25 ? 1 : 0} />)}
      {[190, 400, 1300, 1510, 1700, 1090].map((x, i) => <Win key={`b${i}`} x={x} y={480} w={120} h={110} on={rnd(9, i) > 0.35 ? 1 : 0} />)}
      <rect x={870} y={322} width={360} height={64} rx={6} fill="#1E1A2A" />
      <text x={1050} y={366} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={34} letterSpacing={3} fill="#F2E6D0">ELMSWOOD HIGH</text>
      {/* the long way: a painted arrow to the entrance round the corner, a drainpipe, a fire bell */}
      <g opacity={0.85}>
        <rect x={790} y={684} width={970} height={24} fill="#E9C46A" />
        <path d="M 1756 660 L 1830 696 L 1756 732 Z" fill="#E9C46A" />
        <text x={1744} y={664} textAnchor="end" fontFamily={FONT.title} fontWeight={800} fontSize={30} letterSpacing={3} fill="#F2E6D0">MAIN ENTRANCE</text>
      </g>
      <rect x={1236} y={262} width={16} height={540} fill="#2A2232" />
      <rect x={1230} y={600} width={28} height={10} fill="#1E1A2A" />
      <circle cx={1010} cy={630} r={18} fill="#B8352E" stroke="#1E1A2A" strokeWidth={5} />
      {/* the mined doorway: cells come out bottom first; through it, the lit classroom */}
      {gone > 0 ? (
        <g>
          <rect x={x0} y={top} width={x1 - x0} height={H.y - top} fill="#E8A866" />
          <rect x={x0} y={top} width={x1 - x0} height={(H.y - top) * 0.5} fill="#FFD9A0" opacity={0.4} />
          {gone > 1 ? <rect x={x0 + 66} y={top + 30} width={40} height={52} fill="#6A8A9A" opacity={0.85} /> : null}
          <rect x={x0} y={H.y - 20} width={x1 - x0} height={20} fill="#8A5A3A" />
          <path d={`M ${x0 + 34} ${H.y - 20} L ${x0 + 34} ${H.y - 88} L ${x0 + 78} ${H.y - 88} L ${x0 + 78} ${H.y - 20} M ${x0 + 34} ${H.y - 54} L ${x0 + 78} ${H.y - 54}`} stroke="#3A2A2A" strokeWidth={8} fill="none" />
          {/* the wall's thickness on the left jamb, the lintel's shadow */}
          <path d={`M ${x0} ${top} L ${x0 + 18} ${top + 18} L ${x0 + 18} ${H.y} L ${x0} ${H.y} Z`} fill="#3A2420" />
          <rect x={x0} y={top} width={x1 - x0} height={10} fill="#000" opacity={0.35} />
          <rect x={x0 - 3} y={top - 3} width={x1 - x0 + 6} height={H.y - top + 3} fill="none" stroke="#2A1A16" strokeWidth={6} />
        </g>
      ) : null}
      <Street />
      {gone > 0 ? (
        <g>
          <path d={`M ${x0} ${H.y} L ${x1} ${H.y} L ${x1 + 90} ${H.y + 44} L ${x0 - 40} ${H.y + 44} Z`} fill="#FFC877" opacity={0.32} />
          <Glow x={(x0 + x1) / 2} y={H.y - H.cell} r={170} o={0.55} />
        </g>
      ) : null}
      <StreetLamp x={120} y={812} h={520} t={t} side={1} />
      <StreetLamp x={1800} y={812} h={520} t={t + 13} side={-1} />
      <LightVeil id={`${id}-veil`} lights={[[1560, 560, 520], [190, 300, 260], [1730, 300, 260], [1290, 700, 300], [H.x + 62, H.y - 64, gone > 0 ? 260 : 200]]} o={veil} />
      <Glow x={1560} y={560} r={420} o={0.4} />
      <Dust t={t} seed={5} x0={1200} y0={360} w={700} h={400} n={30} o={0.45} />
    </g>
  );
};

// ---------------------------------------------------------------- the home street
/** A house front: siding, a gable roof, two windows up and one down, a door under a porch light. */
const House: React.FC<{ x: number; w: number; base: number; h: number; roof: number; color: string; roofC: string; lit: [number, number, number]; chimney?: boolean; id: string }> = ({
  x, w, base, h, roof, color, roofC, lit, chimney, id,
}) => {
  const top = base - h;
  const dx = x + w * 0.16;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sink`} x1="0" y1={top} x2="0" y2={base} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#120E26" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#120E26" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      {chimney ? <rect x={x + w * 0.68} y={top - roof * 0.85} width={48} height={roof * 0.85} fill={roofC} /> : null}
      <path d={`M ${x - 26} ${top + 4} L ${x + w / 2} ${top - roof} L ${x + w + 26} ${top + 4} Z`} fill={roofC} />
      <rect x={x} y={top} width={w} height={h} fill={color} />
      {Array.from({ length: Math.floor(h / 26) }, (_, i) => (
        <rect key={i} x={x} y={top + 18 + i * 26} width={w} height={3} fill="#000" opacity={0.12} />
      ))}
      <rect x={x} y={top} width={w} height={h} fill={`url(#${id}-sink)`} />
      <rect x={x - 6} y={top} width={w + 12} height={10} fill="#000" opacity={0.3} />
      <Win x={x + w * 0.14} y={top + 40} w={96} h={86} on={lit[0]} />
      <Win x={x + w * 0.62} y={top + 40} w={96} h={86} on={lit[1]} />
      <Win x={x + w * 0.6} y={top + h * 0.56} w={112} h={96} on={lit[2]} />
      <rect x={dx - 8} y={base - 178} width={100} height={178} fill="#2A2232" />
      <rect x={dx} y={base - 170} width={84} height={170} fill="#4A3440" />
      <rect x={dx + 14} y={base - 150} width={56} height={44} fill="#FFC877" opacity={0.55} />
      <circle cx={dx + 70} cy={base - 82} r={5} fill="#E9C46A" />
      <rect x={dx + 104} y={base - 206} width={16} height={22} rx={4} fill="#FFE2B0" />
      <Glow x={dx + 112} y={base - 190} r={110} o={0.6} />
    </g>
  );
};

/**
 * The street you live on, at dawn: three houses behind picket fences and hedges, a tree, a mailbox, the bus stop, two
 * street lamps, the same sidewalk and road as the school street (feet on y 812, the bus's wheels on y 935).
 */
export const HomeStreet: React.FC<{ t: number; id: string; busX?: number; veil?: number }> = ({ t, id, busX, veil = 0.36 }) => (
  <g>
    <DuskSky id={`${id}-sky`} horizonY={620} />
    <Sun x={1500} y={600} r={120} t={t} />
    <Skyline y={560} seed={11} h={150} />
    <Haze y={540} h={180} o={0.3} />
    <House id={`${id}-h1`} x={40} w={520} base={770} h={330} roof={150} color="#4A4060" roofC="#2A2238" lit={[1, 1, 0]} chimney />
    <House id={`${id}-h2`} x={660} w={470} base={770} h={380} roof={160} color="#3E4E5E" roofC="#232A38" lit={[0, 1, 1]} />
    {/* a tree between the houses */}
    <path d="M 1196 770 L 1204 560 L 1218 560 L 1226 770 Z" fill="#2A1E24" />
    {[[1210, 470, 90], [1150, 530, 70], [1272, 528, 74], [1210, 560, 80]].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? '#2A3A34' : '#24332E'} />
    ))}
    <House id={`${id}-h3`} x={1300} w={540} base={770} h={300} roof={140} color="#5A4646" roofC="#2E2428" lit={[1, 0, 1]} chimney />
    {/* front gardens: hedges, a picket fence with gaps for the paths, a mailbox */}
    {[[-60, 120], [420, 180], [900, 150], [1450, 200], [1960, 160]].map(([x, w], i) => (
      <path key={i} d={`M ${x} 790 Q ${x} 726 ${x + w * 0.3} 730 Q ${x + w * 0.5} 704 ${x + w * 0.72} 730 Q ${x + w} 726 ${x + w} 790 Z`} fill="#22302A" />
    ))}
    {Array.from({ length: 76 }, (_, i) => {
      const x = -380 + i * 36;
      if ((x > 120 && x < 230) || (x > 760 && x < 870) || (x > 1380 && x < 1490)) return null;
      return <path key={i} d={`M ${x} 800 L ${x} 748 L ${x + 9} 738 L ${x + 18} 748 L ${x + 18} 800 Z`} fill="#4A4258" />;
    })}
    <rect x={-400} y={762} width={2720} height={8} fill="#4A4258" />
    <path d="M 600 802 L 600 724" stroke="#2A2232" strokeWidth={10} />
    <rect x={570} y={690} width={64} height={40} rx={18} fill="#2F68B8" stroke="#141024" strokeWidth={5} />
    <rect x={630} y={694} width={6} height={22} fill="#E8483F" />
    <Street />
    {/* the bus stop */}
    <path d="M 1260 812 L 1260 560" stroke="#1E1A2A" strokeWidth={10} />
    <rect x={1220} y={560} width={80} height={70} rx={6} fill="#2F68B8" stroke="#141024" strokeWidth={5} />
    <rect x={1236} y={578} width={48} height={26} rx={4} fill="#F2B33D" />
    <circle cx={1246} cy={610} r={5} fill="#141024" />
    <circle cx={1274} cy={610} r={5} fill="#141024" />
    <StreetLamp x={300} y={812} h={500} t={t} side={1} />
    <StreetLamp x={1880} y={812} h={500} t={t + 9} side={-1} />
    {busX !== undefined ? <Bus x={busX} y={935} s={0.82} t={t} /> : null}
    <LightVeil id={`${id}-veil`} lights={[[1500, 600, 520], [370, 340, 260], [1810, 340, 240], [176, 590, 200], [790, 560, 200], [1440, 590, 200]]} o={veil} />
    <Glow x={1500} y={600} r={420} o={0.4} />
    <Dust t={t} seed={6} x0={1100} y0={380} w={700} h={380} n={26} o={0.4} />
  </g>
);

// ---------------------------------------------------------------- the parking lot
/** Bike rack along the wall, and the space the car parks across. */
export const LOT = { ground: 720, rackX0: 760, rackX1: 1180, bikeX: 980, carY: 930 };

/**
 * Behind the school at dusk: the brick side wall with high lit windows, a bike rack along it (your teal bike at
 * `LOT.bikeX`), asphalt with slanted bay lines, a lamp post. Feet stand at about y 760 near the wall, lower toward
 * camera. The car is drawn by the shot, so it can be mined.
 */
export const ParkingLot: React.FC<{ t: number; id: string; bike?: boolean; veil?: number }> = ({ t, id, bike = true, veil = 0.4 }) => (
  <g>
    <BrickDefs id={id} y0={280} y1={720} />
    <DuskSky id={`${id}-sky`} horizonY={560} />
    <Sun x={380} y={540} r={120} t={t} />
    <Skyline y={540} seed={8} h={170} />
    <Haze y={470} h={160} o={0.3} />
    <rect x={-400} y={300} width={2720} height={430} fill={`url(#${id}-brick)`} />
    <rect x={-400} y={300} width={2720} height={430} fill={`url(#${id}-sink)`} />
    <rect x={-400} y={280} width={2720} height={28} fill="#2A2232" />
    {[200, 520, 1240, 1560].map((x, i) => <Win key={i} x={x} y={360} w={150} h={80} on={i === 1 ? 0 : 1} />)}
    <rect x={1700} y={520} width={150} height={210} fill="#2A2436" />
    <rect x={1712} y={532} width={126} height={198} fill="#FFC877" opacity={0.75} />
    <Glow x={1775} y={600} r={200} o={0.4} />
    {/* the rack: hoops along the wall */}
    {Array.from({ length: 6 }, (_, i) => {
      const x = LOT.rackX0 + i * ((LOT.rackX1 - LOT.rackX0) / 5);
      return <path key={i} d={`M ${x - 26} 744 L ${x - 26} 680 Q ${x - 26} 652 ${x} 652 Q ${x + 26} 652 ${x + 26} 680 L ${x + 26} 744`} stroke="#9A93A8" strokeWidth={8} fill="none" />;
    })}
    {bike ? <Bike x={LOT.bikeX} y={748} s={0.95} /> : null}
    {/* curb and asphalt with slanted bays */}
    <rect x={-400} y={LOT.ground} width={2720} height={28} fill="#4A4258" />
    <rect x={-400} y={LOT.ground + 28} width={2720} height={900} fill="#2E2838" />
    {Array.from({ length: 9 }, (_, i) => {
      const x = -120 + i * 300;
      return <path key={i} d={`M ${x} ${LOT.ground + 40} L ${x - 140} 1100`} stroke="#E8E2D4" strokeWidth={9} opacity={0.4} />;
    })}
    <StreetLamp x={1560} y={790} h={560} t={t} side={-1} />
    <LightVeil id={`${id}-veil`} lights={[[380, 540, 460], [1490, 790, 420], [1775, 620, 260], [275, 400, 200], [1315, 400, 200]]} o={veil} />
    <Glow x={380} y={540} r={380} o={0.38} />
    <Dust t={t} seed={9} x0={1300} y0={260} w={500} h={480} n={26} o={0.45} />
  </g>
);

// ---------------------------------------------------------------- the bedroom
/**
 * Eye level on the nightstand at dawn: the window on the left full of sunrise over the roofs across the street (the
 * light source), a curtain, the nightstand top running across the bottom (things stand on y 720), catching the window
 * light; a lamp (off), a glass of water, a poster and a shelf in the dark.
 */
export const Nightstand: React.FC<{ t: number; id: string }> = ({ t, id }) => (
  <g>
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3E3A5A" />
        <stop offset="45%" stopColor="#332C44" />
        <stop offset="100%" stopColor="#241E30" />
      </linearGradient>
      <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7A5747" />
        <stop offset="100%" stopColor="#4A342C" />
      </linearGradient>
      <linearGradient id={`${id}-dawn`} x1="0" y1="110" x2="0" y2="560" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2B2552" />
        <stop offset="50%" stopColor="#7A4A86" />
        <stop offset="82%" stopColor="#F2985A" />
        <stop offset="100%" stopColor="#FFC98A" />
      </linearGradient>
      <radialGradient id={`${id}-sheen`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#FFC98A" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#FFC98A" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-400} y={-400} width={2720} height={1880} fill={`url(#${id}-wall)`} />
    {/* the window: sunrise over the roofs across the street */}
    <rect x={300} y={110} width={400} height={450} fill={`url(#${id}-dawn)`} />
    <circle cx={590} cy={520} r={54} fill="#FFE7B3" />
    <path d="M 300 560 L 300 500 L 352 470 L 404 500 L 404 486 L 492 486 L 492 512 L 566 474 L 640 512 L 640 496 L 700 496 L 700 560 Z" fill="#2A1B45" />
    {[[330, 516], [430, 506], [612, 524]].map(([x, y], i) => <rect key={i} x={x} y={y} width={16} height={14} fill="#FFC877" opacity={0.85} />)}
    <Glow x={570} y={480} r={460} o={0.6} />
    <rect x={290} y={100} width={420} height={470} fill="none" stroke="#1E1A2A" strokeWidth={22} />
    <path d="M 500 110 L 500 560 M 300 335 L 700 335" stroke="#1E1A2A" strokeWidth={14} />
    <rect x={266} y={566} width={468} height={18} fill="#2A2232" />
    {/* the curtain, pulled to the left */}
    <path d="M 196 70 L 330 70 Q 300 300 322 520 Q 300 620 314 720 L 196 720 Z" fill="#3A2A4A" />
    <path d="M 236 70 Q 226 400 244 720 M 282 70 Q 272 400 288 720" stroke="#2A1E36" strokeWidth={10} fill="none" />
    <rect x={170} y={58} width={600} height={14} rx={7} fill="#1E1A2A" />
    {/* a poster and a shelf in the dark */}
    <rect x={1240} y={130} width={260} height={340} fill="#2A2438" stroke="#1A1424" strokeWidth={8} />
    <path d="M 1290 400 L 1370 250 L 1450 400 Z" fill="#8BE04E" opacity={0.35} />
    <rect x={1600} y={420} width={420} height={18} fill="#1E1A2A" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={1620 + i * 46} y={340 + (i % 2) * 14} width={36} height={80 - (i % 2) * 14} fill={['#5E3A4A', '#3A4A5E', '#6A5A3A', '#4A3A5E'][i]} />)}
    {/* the nightstand top, warm where the window light lands */}
    <rect x={-400} y={720} width={2720} height={40} fill={`url(#${id}-top)`} />
    <rect x={-400} y={720} width={2720} height={6} fill="#A57A5E" opacity={0.6} />
    <ellipse cx={600} cy={724} rx={520} ry={40} fill={`url(#${id}-sheen)`} />
    <rect x={-400} y={760} width={2720} height={500} fill="#3A2826" />
    <rect x={-400} y={760} width={2720} height={500} fill="#000" opacity={0.25} />
    {/* on the nightstand: a glass of water in the light, the lamp (off) */}
    <path d="M 690 644 L 740 644 L 734 720 L 696 720 Z" fill="#9FC0E8" opacity={0.35} stroke="#1E1A2A" strokeWidth={4} />
    <path d="M 694 672 L 736 672" stroke="#CFE2FF" strokeWidth={3} opacity={0.6} />
    <path d="M 700 652 L 704 712" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
    <path d="M 1420 720 L 1440 700 L 1500 700 L 1520 720 Z" fill="#2A2232" />
    <path d="M 1470 700 L 1470 610" stroke="#2A2232" strokeWidth={10} />
    <path d="M 1404 620 L 1424 528 L 1516 528 L 1536 620 Z" fill="#4A3A5E" stroke="#1E1A2A" strokeWidth={5} />
    <LightVeil id={`${id}-veil`} lights={[[540, 400, 620], [960, 640, 380]]} o={0.42} />
    <Dust t={t} seed={3} x0={340} y0={160} w={760} h={460} n={26} o={0.45} />
  </g>
);

/**
 * The bed from above at dawn: You's head on the pillow (the shot draws You), a chequered quilt with the sheet folded
 * over (its top edge at y 470), the headboard, the nightstand on the left with the alarm clock (`ring`) and the lamp,
 * slippers and a game controller on the floor, the window light falling across it all from the left.
 */
export const BedTop: React.FC<{ t: number; id: string; ring?: number }> = ({ t, id, ring = 1 }) => (
  <g>
    <defs>
      <pattern id={`${id}-quilt`} width={160} height={160} patternUnits="userSpaceOnUse">
        <rect width={160} height={160} fill="#34508A" />
        <rect width={80} height={80} fill="#3E5E9E" />
        <rect x={80} y={80} width={80} height={80} fill="#3E5E9E" />
      </pattern>
    </defs>
    {/* the floor: boards running away from the bed */}
    <rect x={-400} y={-400} width={2720} height={1880} fill="#3A2A2A" />
    {Array.from({ length: 24 }, (_, i) => (
      <rect key={i} x={-400 + i * 120} y={-400} width={4} height={1880} fill="#22181A" opacity={0.7} />
    ))}
    <rect x={1320} y={700} width={800} height={600} fill="#4A3A5E" />
    <rect x={1344} y={724} width={752} height={552} fill="none" stroke="#6A5A7E" strokeWidth={8} />
    {/* the nightstand, from above: the clock and the lamp's round shade */}
    <rect x={200} y={40} width={310} height={310} rx={10} fill="#4A342C" />
    <rect x={200} y={40} width={310} height={14} rx={6} fill="#7A5747" />
    <circle cx={440} cy={276} r={58} fill="#4A3A5E" stroke="#1E1A2A" strokeWidth={6} />
    <circle cx={440} cy={276} r={18} fill="#2A2232" />
    <g transform="translate(300 170) scale(1 0.86)">
      <AlarmClock x={0} y={0} s={0.82} t={t} ring={ring} />
    </g>
    {/* the bed */}
    <rect x={560} y={40} width={900} height={1400} rx={18} fill="#2A1E24" />
    <rect x={590} y={96} width={840} height={1360} rx={10} fill="#7A7CA4" />
    <rect x={540} y={20} width={940} height={80} rx={12} fill="#2A1E24" />
    <rect x={540} y={20} width={940} height={12} rx={6} fill="#4A3440" />
    <rect x={704} y={128} width={512} height={256} rx={60} fill="#000" opacity={0.18} transform="translate(10 14)" />
    <rect x={704} y={128} width={512} height={256} rx={60} fill="#BEBAD4" />
    <ellipse cx={960} cy={262} rx={170} ry={100} fill="#000" opacity={0.08} />
    {/* slippers and a controller on the floor */}
    <g transform="translate(1506 600) rotate(10)">
      <ellipse cx={0} cy={0} rx={22} ry={44} fill="#6FB83E" stroke="#141024" strokeWidth={5} />
      <ellipse cx={52} cy={8} rx={22} ry={44} fill="#6FB83E" stroke="#141024" strokeWidth={5} />
    </g>
    <g transform="translate(1660 950) rotate(-18)">
      <path d="M -70 -20 Q -60 -40 -30 -36 L 30 -36 Q 60 -40 70 -20 L 86 30 Q 90 50 70 50 Q 52 50 40 30 L -40 30 Q -52 50 -70 50 Q -90 50 -86 30 Z" fill="#2A2436" stroke="#141024" strokeWidth={5} />
      <circle cx={42} cy={-10} r={7} fill="#E8483F" />
      <circle cx={58} cy={4} r={7} fill="#FFD93B" />
      <path d="M -50 -6 L -30 -6 M -40 -16 L -40 4" stroke="#8BE04E" strokeWidth={6} strokeLinecap="round" />
    </g>
    <path d="M 380 880 Q 420 860 450 900 L 440 930 Q 410 900 390 910 Z" fill="#6A5A7E" />
  </g>
);

/**
 * The quilt over You in bed (drawn after You, so it covers the body): the folded sheet at `top`, the chequer below,
 * a lump that rises and falls with breathing (`t`). Then the window light across the whole bed.
 */
export const BedCover: React.FC<{ t: number; id: string; top?: number }> = ({ t, id, top = 470 }) => {
  const br = Math.sin(t / 9) * 6;
  return (
    <g>
      <path d={`M 600 ${top + 30} Q 960 ${top - 10 - br} 1420 ${top + 30} L 1430 1460 L 590 1460 Z`} fill={`url(#${id}-quilt)`} stroke="#141024" strokeWidth={5} />
      <path d={`M 600 ${top + 30} Q 960 ${top - 10 - br} 1420 ${top + 30} L 1420 ${top + 96} Q 960 ${top + 60 - br} 600 ${top + 96} Z`} fill="#AEACC6" stroke="#141024" strokeWidth={5} />
      <path d={`M 700 ${top + 260} Q 960 ${top + 200 - br} 1220 ${top + 260}`} stroke="#000" strokeWidth={14} opacity={0.12} fill="none" />
      {/* dawn through the window on the left: two panes of warm light, the sash's shadow between them */}
      <g opacity={0.85} style={{ mixBlendMode: 'screen' }} filter="url(#blur16)">
        <path d="M -200 80 L 380 80 L 980 520 L 400 520 Z" fill="#FFB46A" opacity={0.28} />
        <path d="M -200 560 L 380 560 L 980 1000 L 400 1000 Z" fill="#FFB46A" opacity={0.22} />
      </g>
      <LightVeil id={`${id}-veil`} lights={[[420, 300, 640], [960, 250, 260]]} o={0.4} />
      <Dust t={t} seed={4} x0={200} y0={80} w={800} h={700} n={24} o={0.35} />
    </g>
  );
};
