import React from 'react';
import {
  Hero, basePose, Pose, faceAt, kf, clamp, easeOut, easeIn, backOut, camT, LOOKS, LEG_LEN, ShotProps, ParkingLot,
  Schematic, SCH, DrawOn, SchLabel, CountUp, ItemBlock, BlockBurst, MineCracks, SelectBox, Impact, BackView, ChatBox, Hotbar, HudLayer,
  HudShade, useFrame, BlockKind, FONT, GR,
} from '../../engine';

// "What if you could mine anything?" The Monday Short (channel/episodes/01-mine-anything/short.md): the cold open
// and the command from part 1, then the rule (a street lamp mined into a block, into the inventory), the "That's
// real" fact (a stone block weighs 2.7 t; sixty-four of them, a blue whale), the cost (you feel nothing, so something
// is holding it) and the Admin noticing in red. Made tall (1080 x 1920); each shot's tall framing is in index.tsx.

export { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14 } from '../mine-01-open/shots';

const YOU = LOOKS.you;
const P = (o: Partial<Pose>): Pose => ({ ...basePose, ...o });
const LOT_FEET = 1000;

/** The hotbar after the cold open, and with the lamp once it's mined (stage 5). */
const bar = (stage: number, f: number, at = 0) => {
  const slots: ({ kind: BlockKind; count?: number } | null)[] = Array(9).fill(null);
  slots[0] = { kind: 'clock' };
  slots[1] = { kind: 'brick', count: 2 };
  slots[2] = { kind: 'car' };
  if (stage >= 5) slots[3] = { kind: 'lamp' };
  return <Hotbar f={f} slots={slots} sel={stage >= 5 ? 3 : 2} at={at} y={1052} slot={62} />;
};

/** The punches on the lamp post: the frames each lands on, and how far the arm is out at t (0 guard, 1 full reach). */
const punchAt = (t: number, hits: number[]) =>
  hits.reduce((m, h) => Math.max(m, t >= h - 4 && t < h ? (t - (h - 4)) / 4 : t >= h && t < h + 7 ? 1 - (t - h) / 7 : 0), 0);

// ---------- S15: medium, the parking lot: You punches the street lamp, again and again; it flickers, cracks ----------
export const S15: React.FC<ShotProps> = ({ t, len }) => {
  const hits = [9, 22, 35, 48].filter((h) => h < len - 2);
  const done = hits.filter((h) => t >= h).length;
  const last = hits.filter((h) => t >= h).pop();
  const ext = punchAt(t, hits);
  const flick = last !== undefined && t - last < 4 ? 0.7 * (1 - (t - last) / 4) : 0;
  const pose = P({
    x: 1462, y: 800 - LEG_LEN * 0.64, scale: 0.64, yaw: 0.75, look: 0.7, tilt: 3 + ext * 7,
    armR: { a: 34 + ext * 58, b: -104 + ext * 102 }, armL: { a: 26, b: -78 }, handR: 'fist', handL: 'fist', legL: { a: 14, b: 0 }, legR: { a: -10, b: 0 },
    expr: done >= 3 ? 'smug' : 'neutral',
  });
  return (
    <>
      <g transform={camT(kf(t, [[0, 1500], [len, 1512]]), 600, kf(t, [[0, 1.5], [len, 1.58]]))}>
        <ParkingLot t={t + 150} id="s15" flicker={flick} />
        <MineCracks x={1546} y={430} w={28} h={330} p={(done / 4) * 0.9} id="s15" hx={0.5} hy={0.64} width={4} />
        <SelectBox x={1450} y={218} w={128} h={574} d={18} o={clamp(t / 3)} width={4} />
        <Hero look={YOU} pose={pose} rimId="rimR" shadow={0.7} t={t} />
        {last !== undefined ? <Impact x={1556} y={640} t={t - last} s={0.45} /> : null}
      </g>
      {bar(4, 99)}
    </>
  );
};

// ---------- S16: low angle, the lamp against the sky: two more hits, it pops into a lamp block, the light goes out ----------
export const S16: React.FC<ShotProps> = ({ t, len }) => {
  const hits = [6, 16];
  const pop = 25;
  const zip = 42;
  const last = hits.filter((h) => t >= h).pop();
  const gone = t >= pop;
  const z = easeIn(clamp((t - zip) / 13));
  return (
    <>
      <g transform={camT(kf(t, [[0, 1500], [len, 1494]]), kf(t, [[0, 360], [len, 372]]), kf(t, [[0, 2.2], [len, 2.32]]))}>
        <ParkingLot t={t + 200} id="s16" lamp={!gone} flicker={last !== undefined && t - last < 4 ? 0.6 : 0} />
        {!gone ? <MineCracks x={1452} y={222} w={78} h={32} p={0.6 + 0.15 * hits.filter((h) => t >= h).length} id="s16a" hx={0.8} hy={0.5} width={3} /> : null}
        {!gone ? <MineCracks x={1546} y={250} w={28} h={540} p={0.95} id="s16b" hx={0.5} hy={0.7} width={4} /> : null}
        {!gone ? <SelectBox x={1450} y={218} w={128} h={574} d={18} width={3} /> : null}
        {last !== undefined && !gone ? <Impact x={1556} y={300} t={t - last} s={0.4} /> : null}
        <BlockBurst x={1500} y={300} t={t - pop} kind="lamp" n={18} size={10} spread={0.8} />
        <BlockBurst x={1560} y={560} t={t - pop} kind="stone" n={10} size={8} spread={0.6} seed={5} />
        {gone && t < zip + 13 ? (
          <g transform={`translate(0 ${z * 900})`}>
            <ItemBlock x={1500} y={300} t={t} size={40 * (1 - 0.55 * z)} kind="lamp" pop={t - pop} glow={1.4} />
          </g>
        ) : null}
      </g>
      {bar(t >= zip + 12 ? 5 : 4, 99)}
    </>
  );
};

// ---------- S17: the inventory: thirty-six slots; the lamp block drops into the hotbar row ----------
export const S17: React.FC<ShotProps> = ({ t, len }) => {
  const land = 9;
  const push = kf(t, [[0, 1], [len, 1.07]]);
  return (
    <>
      <g filter="url(#blur16)">
        <g transform={camT(1100, 640, 1.2)}>
          <ParkingLot t={t + 260} id="s17" lamp={false} veil={0.5} />
        </g>
      </g>
      <HudShade o={0.45} />
      <HudLayer>
        <g transform={`translate(540 860) scale(${push}) translate(-540 -860)`}>
          <Inventory t={t} land={land} />
        </g>
      </HudLayer>
    </>
  );
};

/** The inventory panel, our own: four rows of nine dark glass slots, the bottom one the hotbar, lime when selected. */
const Inventory: React.FC<{ t: number; land: number }> = ({ t, land }) => {
  const F = useFrame();
  const slot = F.tall ? 98 : 84;
  const gap = 8;
  const w = 9 * slot + 8 * gap;
  const x0 = F.w / 2 - w / 2;
  const y0 = F.tall ? 640 : 250;
  const rowY = (r: number) => y0 + r * (slot + gap) + (r === 3 ? 26 : 0);
  const items: [number, BlockKind, number?][] = [[0, 'clock'], [1, 'brick', 2], [2, 'car']];
  const sx = (c: number) => x0 + c * (slot + gap);
  const lx = sx(3) + slot / 2;
  const ly = rowY(3) + slot / 2;
  const fall = easeIn(clamp(t / land));
  const in1 = backOut(clamp(t / 6));
  return (
    <g transform={`translate(${F.w / 2} ${y0 + 2 * slot}) scale(${0.92 + 0.08 * in1}) translate(${-F.w / 2} ${-(y0 + 2 * slot)})`} opacity={clamp(t / 3)}>
      <rect x={x0 - 26} y={y0 - 86} width={w + 52} height={4 * slot + 3 * gap + 26 + 112} rx={18} fill="#140F22" opacity={0.92} stroke="#3A3250" strokeWidth={4} />
      <text x={x0} y={y0 - 30} fontFamily={FONT.ui} fontSize={40} fontWeight={700} fill={GR.white} letterSpacing={3}>INVENTORY</text>
      <text x={x0 + w} y={y0 - 30} textAnchor="end" fontFamily={FONT.title} fontWeight={700} fontSize={30} fill="#8E86A8" letterSpacing={1}>36 SLOTS · 64 EACH</text>
      {Array.from({ length: 36 }, (_, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const sel = r === 3 && c === 3 && t >= land;
        const breathe = sel ? 0.5 + 0.5 * Math.sin((t - land) / 5) : 0;
        return <rect key={i} x={sx(c)} y={rowY(r)} width={slot} height={slot} rx={6} fill={sel ? `rgba(139,224,78,${0.08 + 0.1 * breathe})` : '#241D36'} stroke={sel ? GR.lime : '#4A4260'} strokeWidth={sel ? 6 : 3} />;
      })}
      {items.map(([c, kind, n]) => (
        <g key={c}>
          <ItemBlock x={sx(c) + slot / 2} y={rowY(3) + slot / 2 - 4} t={40 + c * 13} size={slot * 0.44} kind={kind} spin={0} bob={0} glow={0} />
          {n ? (
            <text x={sx(c) + slot - 8} y={rowY(3) + slot - 8} textAnchor="end" fontFamily={FONT.title} fontSize={slot * 0.38} fontWeight={800} fill={GR.white} stroke={GR.ink} strokeWidth={3} paintOrder="stroke">
              {n}
            </text>
          ) : null}
        </g>
      ))}
      {/* the lamp block falls in from above and lands in slot four with a lime ring */}
      <ItemBlock x={lx} y={-140 + (ly - 4 + 140) * fall} t={t * 3} size={slot * (0.9 - 0.46 * fall)} kind="lamp" spin={t < land ? 0.2 : 0} bob={0} glow={t < land ? 1.2 : 0} />
      {t >= land && t < land + 10 ? <circle cx={lx} cy={ly} r={slot * (0.55 + (t - land) * 0.08)} fill="none" stroke={GR.lime} strokeWidth={6} opacity={1 - (t - land) / 10} /> : null}
    </g>
  );
};

// ---------- the schematic beat: one stone block, then sixty-four, then a blue whale ----------
type V3 = [number, number, number];
/** The same projection ItemBlock uses (turned by a, tipped by tilt), so a wireframe lines up with a drawn block. */
const proj = (v: V3, a = 0.6, tilt = 0.5) => {
  const [vx, vy, vz] = v;
  const x1 = vx * Math.cos(a) + vz * Math.sin(a);
  const z1 = -vx * Math.sin(a) + vz * Math.cos(a);
  return { x: x1, y: -(vy * Math.cos(tilt) - z1 * Math.sin(tilt)), z: vy * Math.sin(tilt) + z1 * Math.cos(tilt) };
};
const CORNERS: V3[] = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

/** A blueprint wireframe cube centred on (cx, cy): the edges behind it dashed, drawing on from t 0. */
const WireCube: React.FC<{ cx: number; cy: number; size: number; t: number; dur?: number }> = ({ cx, cy, size, t, dur = 14 }) => {
  const pts = CORNERS.map((c) => proj(c));
  const back = pts.reduce((m, p, i) => (p.z < pts[m].z ? i : m), 0);
  const h = size / 2;
  return (
    <g>
      {EDGES.map(([a, b], i) => {
        const hidden = a === back || b === back;
        const d = `M ${cx + pts[a].x * h} ${cy + pts[a].y * h} L ${cx + pts[b].x * h} ${cy + pts[b].y * h}`;
        return hidden ? (
          <path key={i} d={d} stroke={SCH.dim} strokeWidth={4} strokeDasharray="14 12" opacity={clamp(t / dur)} />
        ) : (
          <DrawOn key={i} d={d} t={t - i * 0.6} dur={dur} width={6} />
        );
      })}
    </g>
  );
};

/** The schematic ground, run far past a tall frame's edges. */
const Blueprint: React.FC<{ t: number; id: string }> = ({ t, id }) => (
  <g>
    <rect x={-3000} y={-3000} width={8000} height={8000} fill={SCH.ground} />
    <g transform="translate(0 -420)">
      <Schematic t={t} id={`${id}a`} />
    </g>
    <g transform="translate(0 1080)">
      <Schematic t={t} id={`${id}b`} />
    </g>
    <Schematic t={t} id={id} />
  </g>
);

// ---------- S18: schematic: a one-meter cube draws on, fills with stone; the counter rolls to 2.7 t ----------
export const S18: React.FC<ShotProps> = ({ t }) => {
  const fill = 28;
  const weigh = 41;
  return (
    <>
      <Blueprint t={t} id="s18" />
      <HudLayer>
        <StoneBlock t={t} fill={fill} weigh={weigh} />
      </HudLayer>
    </>
  );
};

const StoneBlock: React.FC<{ t: number; fill: number; weigh: number }> = ({ t, fill, weigh }) => {
  const F = useFrame();
  const cx = F.w / 2;
  const cy = F.tall ? 640 : 420;
  const size = F.tall ? 380 : 300;
  const pts = CORNERS.map((c) => proj(c));
  const h = size / 2;
  // the front bottom edge for the dimension line: corners 4 (-1,-1,1) and 5 (1,-1,1)
  const a = { x: cx + pts[4].x * h, y: cy + pts[4].y * h };
  const b = { x: cx + pts[5].x * h, y: cy + pts[5].y * h };
  const off = 44;
  return (
    <g>
      <WireCube cx={cx} cy={cy} size={size} t={t} />
      <ItemBlock x={cx} y={cy} t={0} size={size} kind="stone" spin={0} bob={0} glow={0} pop={t - fill} />
      <DrawOn d={`M ${a.x - 10} ${a.y + off} L ${b.x + 10} ${b.y + off}`} t={t - 6} dur={10} color={SCH.dim} width={4} />
      <SchLabel x={(a.x + b.x) / 2 - 30} y={(a.y + b.y) / 2 + off + 58} t={t - 10} text="1 m · 3.3 ft" size={40} color={SCH.line} font={FONT.title} weight={700} />
      <CountUp x={cx} y={cy + size * 0.95 + 130} t={t - weigh} to={2.7} dur={30} size={F.tall ? 150 : 110} format={(v) => `${v.toFixed(1)} t`} font={FONT.title} weight={800} />
      <SchLabel x={cx} y={cy + size * 0.95 + 215} t={t - weigh - 34} text="5,950 lb" size={56} color={SCH.dim} font={FONT.title} weight={700} />
    </g>
  );
};

/** Sixty-four small blocks in a 4 x 4 x 4 stack, drawn back to front; `n` of them are in place. */
const Stack64: React.FC<{ cx: number; cy: number; size: number; n: number }> = ({ cx, cy, size, n }) => {
  // n counts on past 64 so the last blocks finish popping in; each block pops over the frames after it's placed
  const cell = size / 4;
  const cubes: { i: number; x: number; y: number; z: number }[] = [];
  for (let k = 0; k < 64; k++) {
    // bottom layer first, back to front within a layer
    const ly = Math.floor(k / 16);
    const rem = k % 16;
    const gx = rem % 4;
    const gz = Math.floor(rem / 4);
    const v: V3 = [(gx - 1.5) / 2, (ly - 1.5) / 2, (gz - 1.5) / 2];
    const p = proj(v);
    cubes.push({ i: k, x: cx + (p.x * size) / 2, y: cy + (p.y * size) / 2, z: p.z });
  }
  const shown = cubes.filter((c) => c.i < Math.min(64, n)).sort((c1, c2) => c1.z - c2.z);
  return (
    <g>
      {shown.map((c) => (
        <ItemBlock key={c.i} x={c.x} y={c.y} t={0} size={cell} kind="stone" spin={0} bob={0} glow={0} pop={c.i === 0 ? 99 : (n - c.i) / 1.8} />
      ))}
    </g>
  );
};

// ---------- S19: schematic: sixty-four blocks stack up; the counter rolls to 173 t ----------
export const S19: React.FC<ShotProps> = ({ t, len }) => {
  const build = 16;
  const roll = 65;
  return (
    <>
      <Blueprint t={t} id="s19" />
      <HudLayer>
        <StackBeat t={t} len={len} build={build} roll={roll} />
      </HudLayer>
    </>
  );
};

const StackBeat: React.FC<{ t: number; len: number; build: number; roll: number }> = ({ t, len, build, roll }) => {
  const F = useFrame();
  const cx = F.w / 2;
  const cy = F.tall ? 620 : 400;
  const size = (F.tall ? 300 : 230) * kf(t, [[0, 1], [len, 1.08]]);
  const n = Math.max(1, (t - build) * 1.8 + 1);
  const ty = cy + size * 1.25 + 120;
  return (
    <g>
      <Stack64 cx={cx} cy={cy} size={size} n={t < build ? 1 : n} />
      <SchLabel x={cx} y={cy - size * 1.1} t={t - build - 30} text="× 64" size={70} color={SCH.line} font={FONT.title} weight={800} />
      {t < roll ? (
        <text x={cx} y={ty} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={F.tall ? 150 : 110} fill={SCH.live} style={{ filter: `drop-shadow(0 0 14px ${SCH.glow}66)` }}>
          2.7 t
        </text>
      ) : (
        <CountUp x={cx} y={ty} t={t - roll} to={173} dur={34} size={F.tall ? 150 : 110} format={(v) => `${Math.max(2.7, v).toFixed(v < 10 ? 1 : 0)} t`} font={FONT.title} weight={800} />
      )}
      <SchLabel x={cx} y={ty + 90} t={t - roll - 38} text="381,000 lb" size={56} color={SCH.dim} font={FONT.title} weight={700} />
    </g>
  );
};

/** A blue whale, side on, in blueprint lines; about 1000 long, centred on 0, nose to the left. */
const Whale: React.FC<{ x: number; y: number; s: number; t: number }> = ({ x, y, s, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <DrawOn
      d="M -500 12 Q -496 -40 -380 -62 Q -150 -98 100 -90 Q 230 -86 268 -82 L 292 -108 L 312 -78 Q 400 -56 470 -26 Q 500 -34 540 -84 Q 560 -78 552 -60 Q 528 -22 528 -8 Q 534 14 562 52 Q 556 66 538 60 Q 504 26 474 18 Q 400 34 150 72 Q -150 90 -350 72 Q -470 50 -500 12 Z"
      t={t}
      dur={18}
      width={6}
      fill="#24476E"
    />
    {t > 18 ? (
      <g stroke={SCH.line} fill="none" strokeLinecap="round" opacity={clamp((t - 18) / 6)}>
        <path d="M -498 14 Q -420 26 -330 22" strokeWidth={5} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M ${-440 + i * 20} ${36 + i * 6} Q ${-300 + i * 30} ${58 + i * 6} ${-160 + i * 40} ${66 + i * 4}`} strokeWidth={3} opacity={0.6} />
        ))}
        <path d="M -250 62 Q -200 128 -150 118 Q -168 84 -196 58" strokeWidth={5} fill="#24476E" />
        <circle cx={-360} cy={-6} r={7} fill={SCH.line} />
      </g>
    ) : null}
  </g>
);

// ---------- S20: schematic: the stack beside a blue whale, the same weight; THAT'S REAL. ----------
export const S20: React.FC<ShotProps> = ({ t }) => {
  const real = 71;
  return (
    <>
      <Blueprint t={t} id="s20" />
      <HudLayer>
        <WhaleBeat t={t} real={real} />
      </HudLayer>
    </>
  );
};

const WhaleBeat: React.FC<{ t: number; real: number }> = ({ t, real }) => {
  const F = useFrame();
  const cx = F.w / 2;
  const slide = easeOut(clamp((t - 4) / 16));
  const stackY = F.tall ? 420 : 300;
  const whaleY = F.tall ? 1020 : 640;
  const stamp = backOut(clamp((t - real) / 7));
  return (
    <g>
      <Stack64 cx={F.tall ? cx : cx - 520} cy={stackY} size={F.tall ? 200 : 170} n={200} />
      <text x={F.tall ? cx : cx - 520} y={stackY + 290} textAnchor="middle" fontFamily={FONT.title} fontWeight={800} fontSize={72} fill={SCH.live}>173 t</text>
      <SchLabel x={F.tall ? cx : cx - 170} y={F.tall ? stackY + 420 : whaleY} t={t - 18} text="=" size={110} color={SCH.line} font={FONT.title} weight={800} />
      <Whale x={(F.tall ? cx : cx + 300) + (1 - slide) * 1300} y={whaleY} s={F.tall ? 0.88 : 0.8} t={t - 4} />
      <SchLabel x={F.tall ? cx : cx + 300} y={whaleY + 190} t={t - 24} text="BLUE WHALE" size={60} color={SCH.line} font={FONT.title} weight={800} />
      {t >= real ? (
        <g transform={`translate(${cx} ${F.tall ? 1330 : 960}) rotate(-5) scale(${stamp})`}>
          <rect x={-340} y={-82} width={680} height={130} rx={14} fill="none" stroke={GR.yellow} strokeWidth={10} />
          <text textAnchor="middle" y={16} fontFamily={FONT.title} fontWeight={900} fontSize={92} fill={GR.yellow} letterSpacing={4}>THAT'S REAL.</text>
        </g>
      ) : null}
    </g>
  );
};

// ---------- S21: medium, the parking lot: You bounces on his heels, perfectly fine ----------
export const S21: React.FC<ShotProps> = ({ t, len }) => {
  const cyc = 13;
  const ph = (t % cyc) / cyc;
  const hop = Math.sin(ph * Math.PI);
  const land = ph < 0.18 ? 1 - ph / 0.18 : 0;
  const pose = P({
    x: 900, y: LOT_FEET - LEG_LEN * 0.85 - hop * 26, scale: 0.85, yaw: 0.2, look: 0.25, squash: 0.08 * land - 0.05 * hop,
    armL: { a: 26 + hop * 10, b: -20 }, armR: { a: 26 + hop * 10, b: -20 }, legL: { a: 6, b: hop * 8 }, legR: { a: -6, b: hop * 8 }, expr: 'happy',
  });
  return (
    <>
      <g transform={camT(kf(t, [[0, 900], [len, 904]]), 720, kf(t, [[0, 1.5], [len, 1.56]]))}>
        <ParkingLot t={t + 300} id="s21" lamp={false} veil={0.5} />
        <Hero look={YOU} pose={pose} rimId="rimR" shadow={0.7 - hop * 0.3} t={t} />
      </g>
      {bar(5, 99)}
    </>
  );
};

// ---------- S22: close-up, from behind: the cube backpack, glowing faintly ----------
export const S22: React.FC<ShotProps> = ({ t, len }) => {
  const pulse = 0.65 + 0.35 * Math.sin(t / 7);
  return (
    <>
      <defs>
        <radialGradient id="s22lime">
          <stop offset="0%" stopColor={GR.limeLight} stopOpacity={0.9} />
          <stop offset="35%" stopColor={GR.lime} stopOpacity={0.35} />
          <stop offset="100%" stopColor={GR.lime} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g filter="url(#blur10)">
        <g transform={camT(1000, 560, 1.7)}>
          <ParkingLot t={t + 340} id="s22" lamp={false} veil={0.55} />
        </g>
      </g>
      <g transform={`translate(960 ${kf(t, [[0, 300], [len, 330]])}) scale(${kf(t, [[0, 1], [len, 1.1]])}) translate(-960 -300)`}>
        <circle cx={960} cy={300 + 3 * 115} r={430 * (0.9 + 0.1 * pulse)} fill="url(#s22lime)" opacity={0.55 * pulse} style={{ mixBlendMode: 'screen' }} />
        <BackView x={960} y={300} s={3} look={YOU} rim="rimR" id="s22" dim={0.92} blur={0.01} />
        <rect x={960 - 210} y={300 + 120} width={420} height={450} rx={18} fill="url(#s22lime)" opacity={0.45 * pulse} style={{ mixBlendMode: 'screen' }} />
        {Array.from({ length: 10 }, (_, i) => {
          const life = ((t * 0.9 + i * 13) % 60) / 60;
          const px = 960 + Math.sin(i * 2.3 + t / 20) * 180;
          const py = 300 + 600 - life * 520;
          return <rect key={i} x={px} y={py} width={10} height={10} fill={GR.limeLight} opacity={(1 - life) * 0.8 * pulse} transform={`rotate(45 ${px + 5} ${py + 5})`} />;
        })}
      </g>
    </>
  );
};

// ---------- S23: wide, the parking lot gone dark: red in the chat. [Admin] unusual block activity detected. ----------
export const S23: React.FC<ShotProps> = ({ t, len }) => {
  const msg = 8;
  const look = faceAt(t, [[0, 'neutral'], [msg + 12, 'worried']]);
  const pose = P({
    x: 900, y: LOT_FEET - LEG_LEN * 0.85, scale: 0.85, yaw: kf(t, [[0, 0.3], [msg + 10, 0.3], [msg + 22, -0.15]]), look: kf(t, [[0, 0.2], [msg + 10, 0.2], [msg + 22, -0.8]]),
    headTilt: kf(t, [[0, 0], [msg + 22, 8]]), armL: { a: 12, b: -8 }, armR: { a: 12, b: -8 }, ...look,
  });
  const red = clamp((t - msg - 30) / 30);
  return (
    <>
      <g transform={camT(kf(t, [[0, 900], [len, 904]]), kf(t, [[0, 700], [len, 690]]), kf(t, [[0, 1.08], [len, 1.32]]))}>
        <ParkingLot t={t + 380} id="s23" lamp={false} veil={0.55} />
        <Hero look={YOU} pose={pose} rimId={red > 0.5 ? 'rimRed' : 'rimR'} shadow={0.7} t={t} />
      </g>
      <HudShade o={0.18 * red} color="#5A0A14" />
      {bar(5, 99)}
      <ChatBox f={t} lines={[{ at: msg, text: '[Admin] unusual block activity detected.', kind: 'admin' }]} tallSize={42} />
    </>
  );
};

