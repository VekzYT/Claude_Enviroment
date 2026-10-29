import React from 'react';
import {
  Hero, Actor, basePose, Pose, Look, poseAt, faceAt, kf, clamp, easeOut, easeIn, camT, LOOKS, LEG_LEN, joints, toWorld, walkPose, stand, ShotProps,
  Nightstand, BedTop, BedCover, HomeStreet, SchoolStreet, SCHOOL_HOLE, ParkingLot, LOT, Classroom, CLS, Glow, Sparkle, Foreground,
  AlarmClock, Car, ItemBlock, BlockBurst, MineCracks, SelectBox, Impact, InsertArm, BackView, ChatBox, GrTitle, Hotbar, HudShade, BlockKind, FONT,
} from '../../engine';

// "What if you could mine anything?" Part 1: the cold open (three demos: the alarm clock, the school wall, the car)
// and the command. Fourteen shots in the bedroom, on your street, at the school, in the classroom and the parking
// lot. The power: a dark block outline marks what you're aiming at, hits crack it in pixel steps, then it pops into a
// small block that drops and bobs; the hotbar fills as you go.

const YOU = LOOKS.you;
const YOU_BED: Look = { ...LOOKS.you, pack: false };
const P = (o: Partial<Pose>): Pose => ({ ...basePose, ...o });
const H = SCHOOL_HOLE;
const CELL_LO = { x: H.x, y: H.y - H.cell, w: H.cell, h: H.cell };
const CELL_HI = { x: H.x, y: H.y - 2 * H.cell, w: H.cell, h: H.cell };
const STREET_FEET = 812;
const LOT_FEET = 1000;
/** The alarm clock on the nightstand: its feet on the top, its outline box, the face the cracks run across. */
const CLOCK = { x: 960, y: 626, s: 1.6 };
const CLOCK_BOX = { x: 836, y: 492, w: 248, h: 262, d: 34 };
const CLOCK_FACE = { x: 860, y: 526, w: 200, h: 200 };

/** The hotbar as it fills through the cold open: the clock, then the bricks, then the car. */
const bar = (stage: number, f: number, at = 0) => {
  const slots: ({ kind: BlockKind; count?: number } | null)[] = Array(9).fill(null);
  if (stage >= 1) slots[0] = { kind: 'clock' };
  if (stage >= 2) slots[1] = { kind: 'brick', count: stage >= 3 ? 2 : 1 };
  if (stage >= 4) slots[2] = { kind: 'car' };
  return <Hotbar f={f} slots={slots} sel={stage >= 4 ? 2 : stage >= 2 ? 1 : 0} at={at} y={1052} slot={62} />;
};

// ---------- S1: close-up, the nightstand at dawn: the alarm clock ringing, the sunrise in the window behind ----------
export const S1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={camT(kf(t, [[0, 900], [len, 918]]), kf(t, [[0, 560], [len, 572]]), kf(t, [[0, 1.3], [len, 1.42]]))}>
    <Nightstand t={t + 10} id="s1" />
    <g filter="url(#rimL)">
      <AlarmClock x={CLOCK.x} y={CLOCK.y} s={CLOCK.s} t={t} ring={1} />
    </g>
    {/* the pillow's corner, close to camera */}
    <Foreground blur={16}>
      <path d="M 1290 1140 Q 1290 800 1550 706 Q 1800 632 2140 690 L 2140 1140 Z" fill="#251E34" />
      <path d="M 1330 800 Q 1420 724 1580 700 Q 1800 660 2100 690" stroke="#4A4066" strokeWidth={26} fill="none" strokeLinecap="round" />
    </Foreground>
  </g>
);

// ---------- S2: high angle, You in bed from above: half awake, annoyed, eyes going to the noise on the left ----------
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const blink = t >= 34 && t < 39 ? 1 : 0;
  const pose = P({ x: 960, y: 262 + 176 * 1.5, scale: 1.5, look: -0.7, headTilt: -6, armL: { a: 6, b: -4 }, armR: { a: 6, b: -4 }, expr: 'groggy', blink });
  return (
    <g transform={camT(kf(t, [[0, 900], [len, 912]]), kf(t, [[0, 410], [len, 392]]), kf(t, [[0, 1.3], [len, 1.4]]))}>
      <BedTop t={t + 30} id="s2" />
      <Hero look={YOU_BED} pose={pose} rimId="rimL" shadow={0} t={t} />
      <BedCover t={t} id="s2" />
    </g>
  );
};

// ---------- S3: insert, the nightstand: the outline snaps on, the fist comes in from the bed and hits; cracks ----------
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const hit = 24; // in the pause after "Hit it."
  const after = t - hit;
  const squash = after >= 0 && after < 6 ? 1 - after / 6 : 0;
  const hand = { x: kf(t, [[0, 1900], [hit - 12, 1820], [hit, 1074], [hit + 3, 1104], [len, 1150]]), y: kf(t, [[0, 500], [hit - 12, 510], [hit, 600], [len, 590]]) };
  return (
    <g transform={camT(1000, 600, kf(t, [[0, 1.55], [len, 1.62]]))}>
      <Nightstand t={t + 50} id="s3" />
      <g filter="url(#rimL)" transform={`translate(${CLOCK.x} 760) rotate(${-squash * 7}) scale(${1 + 0.1 * squash} ${1 - 0.12 * squash}) translate(${-CLOCK.x} -760)`}>
        <AlarmClock x={CLOCK.x} y={CLOCK.y} s={CLOCK.s} t={t} ring={t < hit ? 1 : 0} />
        <MineCracks {...CLOCK_FACE} p={clamp((after + 1) / 8) * 0.75} id="s3" hx={0.74} hy={0.44} />
      </g>
      <SelectBox {...CLOCK_BOX} o={clamp(t / 3)} />
      <Impact x={hand.x - 46} y={hand.y + 6} t={after} s={1.1} />
      <InsertArm hand={hand} from={{ x: 2500, y: 260 }} look={YOU} kind="fist" rot={90} k={0.62} rim="rimL" />
    </g>
  );
};

// ---------- S4: macro, the clock up close: "Mine." It pops into a small block that bobs; slot 1 fills ----------
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const pop = 2;
  return (
    <>
      <g transform={camT(kf(t, [[0, 972], [len, 966]]), kf(t, [[0, 612], [len, 604]]), kf(t, [[0, 2.6], [len, 2.75]]))}>
        <Nightstand t={t + 70} id="s4" />
        {t < pop ? (
          <g filter="url(#rimL)">
            <AlarmClock x={CLOCK.x + Math.sin(t * 5) * 4} y={CLOCK.y} s={CLOCK.s} t={0} />
            <MineCracks {...CLOCK_FACE} p={0.9} id="s4" hx={0.74} hy={0.44} />
          </g>
        ) : null}
        {t < pop ? <SelectBox {...CLOCK_BOX} /> : null}
        <BlockBurst x={CLOCK.x} y={610} t={t - pop} kind="clock" n={16} size={12} />
        <ItemBlock x={CLOCK.x} y={648} t={t} size={68} kind="clock" pop={t - pop} />
        <Sparkle x={1034} y={566} t={t - pop - 3} s={1.0} />
        <InsertArm hand={{ x: kf(t, [[0, 1150], [len, 1700]]), y: kf(t, [[0, 590], [len, 530]]) }} from={{ x: 2500, y: 260 }} look={YOU} kind="fist" rot={90} k={0.4} rim="rimL" />
      </g>
      {bar(t >= pop + 6 ? 1 : 0, t, pop + 6)}
    </>
  );
};

// ---------- S5: medium, your street: the bus pulls away from the stop; You runs in and stops short ----------
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const stop = Math.round(len * 0.62);
  const x = kf(t, [[0, 170], [stop, 600], [len, 614]], easeOut);
  const pose =
    t < stop
      ? walkPose(x, t * 0.95, STREET_FEET, 0.62, { tilt: 8, armR: { a: 82, b: -8 }, handR: 'open' }, 1)
      : P({ x, y: STREET_FEET - LEG_LEN * 0.62, scale: 0.62, yaw: 0.6, look: 0.9, armL: { a: 34, b: 30 }, armR: { a: 34, b: 30 }, tilt: 3 });
  const face = faceAt(t, [[0, 'worried'], [stop, 'oops']]);
  return (
    <>
      <g transform={camT(kf(t, [[0, 860], [len, 900]]), 640, kf(t, [[0, 1.55], [len, 1.6]]))}>
        <HomeStreet t={t + 20} id="s5" busX={kf(t, [[0, 1180], [len, 1950]], easeIn)} />
        <Hero look={YOU} pose={{ ...pose, ...face }} rimId="rimR" shadow={0.7} t={t} />
      </g>
      {bar(1, 99)}
    </>
  );
};

// ---------- S6: wide, the school's long side: You follows the arrow the long way round, then turns to the wall ----------
export const S6: React.FC<ShotProps> = ({ t, len }) => {
  const base = { x: 470, y: STREET_FEET - LEG_LEN * 0.62, scale: 0.62 };
  const pose = poseAt(t, [
    { f: 0, p: { ...base, yaw: 0.6, look: 1, armR: { a: 14, b: -8 }, armL: { a: 12, b: -8 } } },
    { f: 4, p: { armR: { a: 84, b: -4 } }, ease: easeOut },
    { f: 30, p: { armR: { a: 82, b: -6 }, yaw: 0.55 } },
    { f: 38, p: { armR: { a: 14, b: -8 }, yaw: -0.2, look: -0.4 }, ease: easeOut },
  ]);
  const face = faceAt(t, [[0, 'neutral'], [6, 'groggy'], [38, 'smug']]);
  return (
    <>
      <g transform={camT(kf(t, [[0, 980], [len, 964]]), 560, kf(t, [[0, 1.0], [len, 1.03]]))}>
        <SchoolStreet t={t + 60} id="s6" />
        <Hero look={YOU} pose={{ ...pose, ...face, handR: t >= 4 && t < 36 ? 'point' : 'open' }} rimId="rimR" shadow={0.7} t={t} />
        <SelectBox {...CELL_LO} o={clamp((t - 44) / 4)} />
      </g>
      {bar(1, 99)}
    </>
  );
};

// ---------- S7: macro, the outlined brick block: the fist comes in from the left and cracks it ----------
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const hit = 33; // in the pause after "Go through it."
  const hand = { x: kf(t, [[0, 380], [hit - 13, 420], [hit, 640], [hit + 2, 650], [len, 630]]), y: kf(t, [[0, 800], [hit - 13, 790], [hit, 744], [len, 752]]) };
  return (
    <g transform={camT(kf(t, [[0, 666], [len, 662]]), 726, kf(t, [[0, 3.9], [len, 4.05]]))}>
      <SchoolStreet t={t + 90} id="s7" />
      <MineCracks {...CELL_LO} p={clamp((t - hit + 1) / 10) * 0.8} id="s7" hx={0.42} hy={0.55} />
      <SelectBox {...CELL_LO} />
      <Impact x={hand.x + 28} y={hand.y - 4} t={t - hit} s={0.5} />
      <InsertArm hand={hand} from={{ x: 380, y: 950 }} look={YOU} kind="fist" rot={-90} k={0.26} />
    </g>
  );
};

// ---------- S8: insert, the wall: "Mine." The lower block pops into the lit room; the outline moves up; hit two ----------
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const pop = 2;
  const hit2 = Math.min(len - 4, 18);
  const fly = clamp((t - 12) / 10);
  const hand = { x: kf(t, [[0, 600], [8, 470], [hit2, 642], [hit2 + 2, 652], [len, 630]]), y: kf(t, [[0, 750], [8, 700], [hit2, 616], [len, 620]]) };
  return (
    <>
      <g transform={camT(662, 682, kf(t, [[0, 2.5], [len, 2.58]]))}>
        <SchoolStreet t={t + 120} id="s8" hole={t >= pop ? 0.5 : 0} />
        {t < pop ? <MineCracks {...CELL_LO} p={0.85} id="s8a" hx={0.42} hy={0.55} /> : null}
        <MineCracks {...CELL_HI} p={clamp((t - hit2 + 1) / 10) * 0.7} id="s8b" hx={0.4} hy={0.6} />
        {t < pop ? <SelectBox {...CELL_LO} /> : <SelectBox {...CELL_HI} o={clamp((t - pop - 4) / 3)} />}
        <BlockBurst x={662} y={738} t={t - pop} kind="brick" n={14} size={8} spread={0.5} />
        <ItemBlock x={662 - fly * 300} y={746 - fly * 60} t={t} size={30} kind="brick" pop={t - pop} />
        <Impact x={hand.x + 30} y={hand.y - 4} t={t - hit2} s={0.7} />
        <InsertArm hand={hand} from={{ x: 300, y: 940 }} look={YOU} kind="fist" rot={-90} k={0.4} />
      </g>
      {bar(t >= pop + 6 ? 2 : 1, t, pop + 6)}
    </>
  );
};

// ---------- S9: medium, the school wall: "Mine." The doorway opens; You steps into its light ----------
export const S9: React.FC<ShotProps> = ({ t, len }) => {
  const pop = 2;
  const fly = clamp((t - 10) / 10);
  const x = kf(t, [[0, 470], [5, 470], [21, 660], [len, 664]], easeOut);
  const walking = t >= 5 && t < 21;
  const pose = walking
    ? walkPose(x, (t - 5) * 0.7, STREET_FEET, 0.62, {}, 1)
    : P({ x, y: STREET_FEET - LEG_LEN * 0.62, scale: 0.62, yaw: t < 5 ? 0.5 : 0.2, look: t < 5 ? 0.6 : 0.1, armL: { a: 12, b: -8 }, armR: { a: 12, b: -8 } });
  const face = faceAt(t, [[0, 'happy'], [21, 'smug']]);
  return (
    <>
      <g transform={camT(kf(t, [[0, 600], [len, 640]]), 640, kf(t, [[0, 1.6], [len, 1.66]]))}>
        <SchoolStreet t={t + 160} id="s9" hole={t >= pop ? 1 : 0.5} />
        {t < pop ? <MineCracks {...CELL_HI} p={0.8} id="s9" hx={0.4} hy={0.6} /> : null}
        {t < pop ? <SelectBox {...CELL_HI} /> : null}
        <BlockBurst x={662} y={614} t={t - pop} kind="brick" n={14} size={10} spread={0.7} />
        <ItemBlock x={662 - fly * 200} y={620 + fly * 40} t={t} size={30} kind="brick" pop={t - pop} />
        <Glow x={662} y={680} r={260} o={0.35 * clamp((t - pop) / 6)} />
        <Hero look={YOU} pose={{ ...pose, ...face }} rimId="rimL" shadow={0.7} t={t} />
      </g>
      {bar(t >= pop + 6 ? 3 : 2, t, pop + 6)}
    </>
  );
};

// ---------- S10: wide, the classroom: You steps in through the fresh hole; the teacher freezes, the class turns ----------
const HOLE_IN = { x0: 1240, x1: 1444, y0: 314, y1: 720 };
const S10_AT = stand(CLS, 0.87, 0.03);
const TEACH = stand(CLS, 0.19, 0.08);
const SUM = (
  <g fontFamily={FONT.hand} fontSize={92} fill="#EDEFE6" opacity={0.92} textAnchor="middle">
    <text x={826} y={400}>7 × 8 =</text>
    <text x={1018} y={400}>?</text>
  </g>
);
export const S10: React.FC<ShotProps> = ({ t, len }) => {
  const x = kf(t, [[0, S10_AT.x], [14, S10_AT.x], [len, S10_AT.x - 150]], easeInOutish);
  const pose =
    t >= 14
      ? walkPose(x, (t - 14) * 0.55, S10_AT.y + LEG_LEN * S10_AT.scale, S10_AT.scale, {}, -1)
      : P({ x, y: S10_AT.y, scale: S10_AT.scale, yaw: -0.45, look: -0.6, armL: { a: 12, b: -8 }, armR: { a: 12, b: -8 } });
  const teacher = P({ x: TEACH.x, y: TEACH.y, scale: TEACH.scale, yaw: 0.45, look: 1, armR: { a: 116, b: -14 }, armL: { a: 14, b: -10 }, expr: t < 8 ? 'neutral' : 'shock', blink: t >= 6 && t < 9 ? 1 : 0 });
  const chalk = toWorld(teacher, joints(teacher).armR.end);
  return (
    <g transform={camT(940, 520, kf(t, [[0, 0.98], [len, 1.02]]))}>
      {/* past the room's edges (a tall frame sees them): more ceiling above, more floor below */}
      <rect x={-2000} y={-2400} width={6000} height={2870} fill="#2A2430" />
      <rect x={-2000} y={470} width={6000} height={2600} fill="#2C2532" />
      <Classroom
        t={t + 40}
        id="s10"
        turn={kf(t, [[0, 0], [6, 0], [26, 1]])}
        board={SUM}
        behindDesk={
          <g>
            <Actor look={LOOKS.teacher} pose={teacher} rimId="rimR" shadow={0} />
            <rect x={chalk.x - 4} y={chalk.y - 14} width={8} height={18} rx={2} fill="#F4F1EA" transform={`rotate(-20 ${chalk.x} ${chalk.y})`} />
          </g>
        }
      />
      {/* the hole: the dawn street outside, brick edges, a little rubble */}
      <defs>
        <linearGradient id="s10out" x1="0" y1={HOLE_IN.y0} x2="0" y2={HOLE_IN.y1} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6E3A6E" />
          <stop offset="70%" stopColor="#F2985A" />
          <stop offset="100%" stopColor="#5A5168" />
        </linearGradient>
      </defs>
      <rect x={HOLE_IN.x0} y={HOLE_IN.y0} width={HOLE_IN.x1 - HOLE_IN.x0} height={HOLE_IN.y1 - HOLE_IN.y0} fill="url(#s10out)" />
      <rect x={HOLE_IN.x0} y={HOLE_IN.y1 - 60} width={HOLE_IN.x1 - HOLE_IN.x0} height={60} fill="#2B2535" />
      <rect x={HOLE_IN.x0 - 6} y={HOLE_IN.y0 - 6} width={HOLE_IN.x1 - HOLE_IN.x0 + 12} height={HOLE_IN.y1 - HOLE_IN.y0 + 6} fill="none" stroke="#7E4334" strokeWidth={14} />
      <Glow x={(HOLE_IN.x0 + HOLE_IN.x1) / 2} y={560} r={360} o={0.55} />
      <Hero look={YOU} pose={pose} rimId="rimL" shadow={0.6} t={t} />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={HOLE_IN.x0 - 40 + k * 90} y={724 + (k % 2) * 8} width={26} height={22} fill="#7E4334" stroke="#2A1A16" strokeWidth={3} transform={`rotate(${k * 17 - 10} ${HOLE_IN.x0 - 27 + k * 90} 735)`} />
      ))}
      {/* a classmate's head and desk close to camera */}
      <Foreground blur={10}>
        <rect x={-120} y={960} width={760} height={900} fill="#1A1420" />
        <circle cx={250} cy={930} r={120} fill="#141018" />
        <path d="M 110 1080 Q 120 990 250 980 Q 380 990 390 1080 Z" fill="#141018" />
      </Foreground>
    </g>
  );
};
function easeInOutish(v: number) {
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}

// ---------- S11: over the shoulder, the parking lot: a car parked across your bike, hazards blinking ----------
export const S11: React.FC<ShotProps> = ({ t, len }) => (
  <>
    <g transform={camT(kf(t, [[0, 1000], [len, 1012]]), 760, kf(t, [[0, 1.5], [len, 1.56]]))}>
      <ParkingLot t={t + 30} id="s11" />
      <Car x={1000} y={LOT.carY} s={0.95} hazard t={t + 9} />
      <BackView x={kf(t, [[0, 430], [len, 442]])} y={1060} s={2.1} look={YOU} rim="rimR" id="s11" dim={0.3} blur={9} />
    </g>
    {bar(3, 99)}
  </>
);

// ---------- S12: close-up, the car: outlined like a block; knock, knock, knock; the cracks spread ----------
export const S12: React.FC<ShotProps> = ({ t, len }) => {
  const taps = [0.14, 0.42, 0.7].map((k) => Math.round(len * k));
  const done = taps.filter((k) => t >= k).length;
  const last = taps.filter((k) => t >= k).pop();
  const hand = { x: kf(t, [[0, 520], [taps[0], 700], [taps[0] + 3, 640], [taps[1], 700], [taps[1] + 3, 640], [taps[2], 700], [taps[2] + 3, 652], [len, 640]]), y: kf(t, [[0, 860], [taps[0], 840], [len, 846]]) };
  return (
    <g transform={camT(880, 830, kf(t, [[0, 2.5], [len, 2.6]]))}>
      <ParkingLot t={t + 60} id="s12" />
      <Car x={1000} y={LOT.carY} s={0.95} hazard t={t + 27} />
      <MineCracks x={748} y={734} w={300} h={170} p={(done / 3) * 0.85} id="s12" hx={0.06} hy={0.55} />
      <SelectBox x={738} y={724} w={580} h={214} d={34} />
      {last !== undefined ? <Impact x={724} y={842} t={t - last} s={0.5} /> : null}
      <InsertArm hand={hand} from={{ x: 300, y: 1160 }} look={YOU} kind="fist" rot={-90} k={0.4} />
    </g>
  );
};

// ---------- S13: medium, the parking lot: the car is a block bobbing over your palm; its owner, keys in hand, stares ----------
export const S13: React.FC<ShotProps> = ({ t, len }) => {
  const pose = P({ x: 420, y: LOT_FEET - LEG_LEN * 0.85, scale: 0.85, yaw: 0.35, look: 0.3, armR: { a: 62, b: -64 }, armL: { a: 12, b: -8 } });
  const palm = toWorld(pose, joints(pose).armR.end);
  const owner = P({ x: 1080, y: 812 - LEG_LEN * 0.62, scale: 0.62, yaw: -0.4, look: -0.8, armR: { a: 60, b: 30 }, armL: { a: 12, b: -8 }, expr: 'shock' });
  const keys = toWorld(owner, joints(owner).armR.end);
  return (
    <>
      <g transform={camT(kf(t, [[0, 700], [len, 690]]), 720, kf(t, [[0, 1.45], [len, 1.5]]))}>
        <ParkingLot t={t + 90} id="s13" />
        <BlockBurst x={1000} y={860} t={t} kind="car" n={18} size={16} />
        <Actor look={LOOKS.driver} pose={owner} rimId="rimL" shadow={0.6} />
        <g transform={`translate(${keys.x} ${keys.y + 14})`}>
          <circle r={9} fill="none" stroke="#D9D3C8" strokeWidth={4} />
          <path d="M 4 8 L 14 30 M 9 20 L 15 18 M 11 25 L 17 23" stroke="#D9D3C8" strokeWidth={4} strokeLinecap="round" />
        </g>
        <Hero look={YOU} pose={{ ...pose, expr: 'smug' }} rimId="rimR" shadow={0.7} t={t} />
        <ItemBlock x={palm.x + 4} y={palm.y - 64} t={t} size={34} kind="car" pop={t} />
      </g>
      {bar(t >= 6 ? 4 : 3, t, 6)}
    </>
  );
};

// ---------- S14: wide, the parking lot at dusk: the command types itself, then the title ----------
export const S14: React.FC<ShotProps> = ({ t, len }) => {
  const pose = P({ x: 420, y: LOT_FEET - LEG_LEN * 0.85, scale: 0.85, yaw: 0.35, look: 0.3, armR: { a: 62, b: -64 }, armL: { a: 12, b: -8 }, expr: 'smug' });
  const palm = toWorld(pose, joints(pose).armR.end);
  const titleAt = 20;
  return (
    <>
      <g transform={camT(kf(t, [[0, 820], [len, 800]]), kf(t, [[0, 760], [len, 750]]), kf(t, [[0, 0.95], [len, 1.0]]))}>
        <ParkingLot t={t + 120} id="s14" />
        <Actor look={LOOKS.driver} pose={P({ x: 1080, y: 812 - LEG_LEN * 0.62, scale: 0.62, yaw: -0.4, look: -0.8, armR: { a: 60, b: 30 }, expr: 'shock' })} rimId="rimL" shadow={0.6} />
        <Hero look={YOU} pose={pose} rimId="rimR" shadow={0.7} t={t + 30} />
        <ItemBlock x={palm.x + 4} y={palm.y - 64} t={t + 30} size={34} kind="car" />
      </g>
      <HudShade o={0.3 * clamp((t - titleAt + 6) / 8)} />
      <GrTitle t={t - titleAt} lines={['WHAT IF YOU COULD', 'MINE ANYTHING?']} accent="ANYTHING" accentT={30} y={200} size={124} />
      <ChatBox f={t} lines={[{ at: 0, text: '/gamerule mineAnything true' }, { at: 12, text: 'Gamerule mineAnything is now set to: true', kind: 'sys' }]} />
    </>
  );
};
