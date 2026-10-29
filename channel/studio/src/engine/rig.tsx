import React from 'react';
import { lerp, easeInOut } from './anim';

// The cast, drawn entirely in code: one rig, and a costume (a Look) per character. Every character is built
// once here, so they look identical in every shot: that's the "drawn, not guessed" point. Original
// characters only: never a channel's own hero or anything that resembles a famous cartoon character.

export const C = {
  skin: '#F6EFE3',
  skinShade: '#E2D3BE',
  ink: '#1D2033',
  jacket: '#F2B33D',
  jacketShade: '#D4922A',
  shoe: '#2FB7A6',
  orange: '#FF8A3D',
  limb: '#EFE2CC',
};

/** A costume for the rig: the same body and animation, different colours and one optional extra piece. */
export type Look = {
  skin: string;
  skinShade: string;
  hand: string;
  jacket: string;
  jacketShade: string;
  accent: string;
  limb: string;
  line: string;
  shoe: string;
  face: string;
  hair: string;
  extra?: 'hood' | 'curls' | 'bunches' | 'bob' | 'suit' | 'hoodDown' | 'cap' | 'raincoat' | 'bun' | 'stache';
  /** GAMERULE: the legs in their own colour (trousers), when they differ from the sleeves */
  leg?: string;
  /** GAMERULE: the hero's cube backpack (the inventory), with straps across the chest */
  pack?: boolean;
  /** GAMERULE: the pixel player marker floating above the head, the channel's logo; on once the gamerule is set */
  marker?: boolean;
  /** GAMERULE: round reading glasses */
  specs?: boolean;
  /** GAMERULE: the colour of the extra piece (Dex's cap) */
  piece?: string;
};
export type CastName = 'pip' | 'pipHood' | 'pipInk' | 'mo' | 'sis' | 'mom' | 'suit' | 'you' | 'youPlain' | 'dex' | 'juni' | 'momGR' | 'driver' | 'teacher';
export const LOOKS: Record<CastName, Look> = {
  // A: Pip as built
  pip: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: C.limb, line: C.ink, shoe: C.shoe, face: C.ink, hair: C.ink },
  // B: Pip in a dark hoodie with mustard drawstrings: the body goes dark and catches the rim light, the head stays the brightest thing
  pipHood: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#2E2B3D', jacketShade: '#24212F', accent: C.jacket, limb: '#2E2B3D', line: '#121019', shoe: C.shoe, face: C.ink, hair: C.ink, extra: 'hood' },
  // C: a dark head with light features, the genre's high-contrast convention, in Pip's mustard
  pipInk: { skin: '#26232F', skinShade: '#1C1A24', hand: '#26232F', jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: '#26232F', line: '#121019', shoe: C.shoe, face: '#F6EFE3', hair: '#26232F' },
  // Mo, Pip's friend: a second recurring character with his own costume (curly hair, headphones round his neck)
  mo: { skin: '#C98E68', skinShade: '#B07A58', hand: '#C98E68', jacket: '#5E6E46', jacketShade: '#4C5A38', accent: '#E9C46A', limb: '#3A3446', line: '#1A1622', shoe: '#D9534F', face: C.ink, hair: '#2A1C18', extra: 'curls' },
  // the formula's recurring cast (beats 5 and 6): Pip's little sister (draw her at about 0.7 of Pip's scale), his mum,
  // and the man in a suit who notices the power. All three are ours: plain shapes, no famous silhouettes.
  sis: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#3E8C86', jacketShade: '#2F6E69', accent: '#F28C6A', limb: '#3A3446', line: '#14121C', shoe: '#F28C6A', face: C.ink, hair: '#3A2620', extra: 'bunches' },
  mom: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8A5A6A', jacketShade: '#704858', accent: '#E9C46A', limb: '#3A3446', line: '#14121C', shoe: '#5A4A6A', face: C.ink, hair: '#5A3226', extra: 'bob' },
  suit: { skin: '#D9C6AE', skinShade: '#C2AE96', hand: '#D9C6AE', jacket: '#2B2F3A', jacketShade: '#20232C', accent: '#A8323E', limb: '#2B2F3A', line: '#0E0F14', shoe: '#14151A', face: C.ink, hair: '#17141A', extra: 'suit' },
  // GAMERULE's cast (channel/BIBLE.md). You: no hair, lime hoodie with the hood down and white drawstrings, the
  // cube backpack, and the player marker once the gamerule is on (youPlain is the same without it).
  you: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8BE04E', jacketShade: '#5DA832', accent: '#F4F1EA', limb: '#8BE04E', leg: '#3B3458', line: '#141024', shoe: '#F4F1EA', face: C.ink, hair: C.ink, extra: 'hoodDown', pack: true, marker: true },
  youPlain: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8BE04E', jacketShade: '#5DA832', accent: '#F4F1EA', limb: '#8BE04E', leg: '#3B3458', line: '#141024', shoe: '#F4F1EA', face: C.ink, hair: C.ink, extra: 'hoodDown', pack: true },
  // Dex, the best friend with the bad ideas: a red cap worn backwards, a denim jacket, red trainers
  dex: { skin: '#9C6B4E', skinShade: '#86593F', hand: '#9C6B4E', jacket: '#4F7BB8', jacketShade: '#3D6396', accent: '#2C4A73', limb: '#4F7BB8', leg: '#2F2B3A', line: '#141024', shoe: '#E8483F', face: C.ink, hair: '#1E1612', extra: 'cap', piece: '#E8483F' },
  // Juni, the little sister (draw her at about 0.68 of You): purple raincoat, hood up with yellow piping, a star clip, yellow boots
  juni: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8B5CF6', jacketShade: '#6E44D6', accent: '#FFD93B', limb: '#8B5CF6', leg: '#3A3446', line: '#141024', shoe: '#FFD93B', face: C.ink, hair: '#3A2620', extra: 'raincoat' },
  // Mom: hair up in a bun, round reading glasses, a rust cardigan over a cream top
  momGR: { skin: '#E3C3A3', skinShade: '#CDAA88', hand: '#E3C3A3', jacket: '#C2643A', jacketShade: '#A4522E', accent: '#F2E6D0', limb: '#C2643A', leg: '#4A4060', line: '#141024', shoe: '#5A4A6A', face: C.ink, hair: '#5A3226', extra: 'bun', specs: true },
  // a bit part: the car's owner in episode 1. Bald, a thick moustache, a grey work jacket
  driver: { skin: '#D9B08C', skinShade: '#C29A78', hand: '#D9B08C', jacket: '#5A6B7A', jacketShade: '#475665', accent: '#3A4652', limb: '#5A6B7A', leg: '#2F2B3A', line: '#141024', shoe: '#3A3446', face: C.ink, hair: '#3A2A22', extra: 'stache' },
  // a bit part: the teacher in episode 1. A brown jacket over a shirt and a teal tie, combed-back hair, reading glasses
  teacher: { skin: '#B98A66', skinShade: '#A27552', hand: '#B98A66', jacket: '#7A5A44', jacketShade: '#614634', accent: '#2F8C86', limb: '#7A5A44', leg: '#3A3446', line: '#141024', shoe: '#2A2232', face: C.ink, hair: '#2A1E1A', extra: 'suit', specs: true },
};

/** The player marker: a pixel-art arrow, lime with a darker rim and one highlight pixel. Centred on (0, 0). */
export const PlayerMarker: React.FC<{ px?: number; glow?: number }> = ({ px = 6, glow = 1 }) => {
  const rows = [9, 7, 5, 3, 1];
  return (
    <g transform={`translate(0 ${-2.5 * px})`}>
      {glow > 0 ? <ellipse cx={0} cy={2.5 * px} rx={5.4 * px} ry={3.2 * px} fill="#C8F59E" opacity={0.13 * glow} /> : null}
      {rows.map((n, r) =>
        Array.from({ length: n }, (_, i) => {
          const edge = i === 0 || i === n - 1 || r === 0;
          return <rect key={`${r}-${i}`} x={-(n * px) / 2 + i * px} y={r * px} width={px + 0.4} height={px + 0.4} fill={edge ? '#2F7D32' : '#8BE04E'} />;
        }),
      )}
      <rect x={-3.5 * px} y={px} width={px} height={px} fill="#C8F59E" />
    </g>
  );
};

// ---------- the hero ----------
/** Mitten hands: open (a palm and a thumb) or pointing (a fist with the index finger out). */
export type HandKind = 'open' | 'point';
export type Expr = 'neutral' | 'happy' | 'smug' | 'shock' | 'worried' | 'oops' | 'cool' | 'dizzy' | 'groggy';
export type Limb = { a: number; b: number }; // a: upper segment angle, b: bend of the lower segment (degrees)
export type Pose = {
  x: number;
  y: number; // hip point
  scale: number;
  facing: 1 | -1;
  tilt: number; // torso lean around the hips, degrees, + leans screen-right
  spin: number; // whole-body rotation around the chest (tumbles)
  headTilt: number;
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
  expr: Expr;
  blink: number; // 0 open, 1 shut
  look: number; // -1..1 eye offset
  glasses: number; // 0..1
  yaw: number; // -1 profile facing screen-left, 0 front, 1 profile facing screen-right
  squash: number; // + squashes (landing), - stretches (jump), about the feet
  handL: HandKind;
  handR: HandKind;
  sway: number; // secondary motion: how far loose things (the hood's drawstrings) swing, degrees-ish
};

export const basePose: Pose = {
  x: 960,
  y: 700,
  scale: 1,
  facing: 1,
  tilt: 0,
  spin: 0,
  headTilt: 0,
  armL: { a: 10, b: -8 },
  armR: { a: 10, b: -8 },
  legL: { a: 5, b: 0 },
  legR: { a: -5, b: 0 },
  expr: 'neutral',
  blink: 0,
  look: 0,
  glasses: 0,
  yaw: 0,
  squash: 0,
  handL: 'open',
  handR: 'open',
  sway: 0,
};

type Key = { f: number; p: Partial<Pose>; ease?: (t: number) => number };

const mixLimb = (a: Limb, b: Limb, t: number): Limb => ({ a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t) });

/** Interpolates every numeric part of a pose between keys; the face swaps (never morphs) at its key. */
export const poseAt = (f: number, keys: Key[], from: Pose = basePose): Pose => {
  // resolve each key into a full pose, carrying values forward
  const full: { f: number; p: Pose; ease?: (t: number) => number }[] = [];
  let cur = from;
  for (const k of keys) {
    cur = { ...cur, ...k.p };
    full.push({ f: k.f, p: cur, ease: k.ease });
  }
  if (f <= full[0].f) return full[0].p;
  for (let i = 0; i < full.length - 1; i++) {
    const A = full[i];
    const B = full[i + 1];
    if (f <= B.f) {
      const t = (B.ease ?? easeInOut)((f - A.f) / Math.max(1e-6, B.f - A.f));
      return {
        x: lerp(A.p.x, B.p.x, t),
        y: lerp(A.p.y, B.p.y, t),
        scale: lerp(A.p.scale, B.p.scale, t),
        facing: t < 0.5 ? A.p.facing : B.p.facing,
        tilt: lerp(A.p.tilt, B.p.tilt, t),
        spin: lerp(A.p.spin, B.p.spin, t),
        headTilt: lerp(A.p.headTilt, B.p.headTilt, t),
        armL: mixLimb(A.p.armL, B.p.armL, t),
        armR: mixLimb(A.p.armR, B.p.armR, t),
        legL: mixLimb(A.p.legL, B.p.legL, t),
        legR: mixLimb(A.p.legR, B.p.legR, t),
        expr: A.p.expr, // a face swaps when its own key lands, so hold the earlier one
        handL: A.p.handL,
        handR: A.p.handR,
        blink: lerp(A.p.blink, B.p.blink, t),
        look: lerp(A.p.look, B.p.look, t),
        glasses: lerp(A.p.glasses, B.p.glasses, t),
        yaw: lerp(A.p.yaw, B.p.yaw, t),
        squash: lerp(A.p.squash, B.p.squash, t),
        sway: lerp(A.p.sway, B.p.sway, t),
      };
    }
  }
  return full[full.length - 1].p;
};

// body measurements (local space: hips at 0,0, y down)
const UPPER_ARM = 62;
const FORE_ARM = 58;
const THIGH = 72;
const SHIN = 68;
const SHOULDER = { x: 42, y: -108 };
const HIP = { x: 17, y: 0 };
export const HEAD = { x: 0, y: -176, r: 62 };
export const LEG_LEN = THIGH + SHIN;

const rad = (d: number) => (d * Math.PI) / 180;
type P = { x: number; y: number };
const rot = (p: P, deg: number, c: P = { x: 0, y: 0 }): P => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};

/** Joint positions in local space (before the hip translate/scale), so scenes can attach props to hands. */
export const joints = (pose: Pose) => {
  const side = (s: 1 | -1, limb: Limb, root: P, l1: number, l2: number, isLeg: boolean) => {
    // arms swing outward (away from the body) on their own side; legs swing forward in the facing direction
    const dir = isLeg ? pose.facing : s;
    const d1 = { x: dir * Math.sin(rad(limb.a)), y: Math.cos(rad(limb.a)) };
    const mid = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
    const a2 = limb.a + limb.b;
    const d2 = { x: dir * Math.sin(rad(a2)), y: Math.cos(rad(a2)) };
    return { root, mid, end: { x: mid.x + d2.x * l2, y: mid.y + d2.y * l2 } };
  };
  const torsoRot = (p: P) => rot(p, pose.tilt);
  const sp = limbSpread(pose.yaw);
  const shL = { x: -SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const shR = { x: SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const armL = side(-1, pose.armL, shL, UPPER_ARM, FORE_ARM, false);
  const armR = side(1, pose.armR, shR, UPPER_ARM, FORE_ARM, false);
  const legL = side(-1, pose.legL, { x: -HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const legR = side(1, pose.legR, { x: HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const r = (o: { root: P; mid: P; end: P }) => ({ root: torsoRot(o.root), mid: torsoRot(o.mid), end: torsoRot(o.end) });
  return { armL: r(armL), armR: r(armR), legL, legR, head: torsoRot(HEAD) };
};

/** How wide the body reads as it turns: full width face-on, about 60% in profile. */
export const turnWidth = (yaw: number) => 1 - 0.4 * Math.min(1, Math.abs(yaw));
/** Shoulders and hips close up as he turns, so in profile the limbs overlap the body. */
export const limbSpread = (yaw: number) => 1 - 0.85 * Math.min(1, Math.abs(yaw));

/** Face swaps happen through a blink: two frames shut either side of each change, as in the genre. */
export const faceAt = (f: number, keys: [number, Expr][]): { expr: Expr; blink: number } => {
  let expr = keys[0][1];
  let blink = 0;
  for (let i = 0; i < keys.length; i++) {
    const [k, e] = keys[i];
    if (f >= k) expr = e;
    if (i > 0 && f >= k - 2 && f < k + 1) blink = 1;
  }
  return { expr, blink };
};

/** A local point to world space, for attaching props (the mug in Pip's hand). */
export const toWorld = (pose: Pose, p: P): P => {
  const spun = rot(p, pose.spin, { x: 0, y: -90 });
  return { x: pose.x + spun.x * pose.scale, y: pose.y + spun.y * pose.scale };
};

/** Straight-arm reach: the right arm angle (local) that points the hand at a world target. */
export const reachAngle = (pose: Pose, target: P) => {
  const sh = toWorld(pose, rot({ x: SHOULDER.x * limbSpread(pose.yaw) + pose.yaw * 6, y: SHOULDER.y }, pose.tilt));
  const world = (Math.atan2(target.x - sh.x, target.y - sh.y) * 180) / Math.PI; // 0 = straight down
  return world - pose.tilt;
};

const Face: React.FC<{ expr: Expr; blink: number; look: number; glasses: number; yaw?: number; ink?: string }> = ({ expr, blink, look, glasses, yaw = 0, ink = C.ink }) => {
  const ex = look * 7;
  const ay = Math.min(1, Math.abs(yaw));
  const farHidden = ay > 0.72;
  const farSide = yaw > 0 ? -1 : 1; // facing screen-right hides the screen-left eye
  const eyeY = HEAD.y - 4;
  const lid = expr === 'groggy' ? 0.62 : expr === 'smug' || expr === 'cool' ? 0.45 : 0;
  const lidY = expr === 'groggy' ? 1 : -3; // groggy lids hang lower
  const open = Math.max(0.08, 1 - Math.max(blink, lid));
  const eye = (cx: number) => {
    if (farHidden && Math.sign(cx) === farSide) return null;
    if (expr === 'happy') return <path d={`M ${cx - 10} ${eyeY + 3} Q ${cx} ${eyeY - 9} ${cx + 10} ${eyeY + 3}`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'oops') return <path d={`M ${cx - 9} ${eyeY - 6} L ${cx + 4} ${eyeY} L ${cx - 9} ${eyeY + 6}`} transform={cx > 0 ? `translate(${2 * cx},0) scale(-1,1)` : undefined} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    if (expr === 'dizzy') return <g stroke={ink} strokeWidth={5} strokeLinecap="round"><path d={`M ${cx - 7} ${eyeY - 7} L ${cx + 7} ${eyeY + 7} M ${cx + 7} ${eyeY - 7} L ${cx - 7} ${eyeY + 7}`} /></g>;
    const big = expr === 'shock';
    const rx = big ? 11 : 7;
    const ry = (big ? 13 : 10) * open;
    return (
      <g>
        <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={rx} ry={ry} fill={ink} />
        {big && open > 0.5 ? <circle cx={cx + ex + 3.5} cy={eyeY - 4} r={3.4} fill="#fff" /> : null}
        {lid ? <path d={`M ${cx - 12} ${eyeY + lidY - 1} L ${cx + 12} ${eyeY + lidY + 1}`} stroke={ink} strokeWidth={4} strokeLinecap="round" /> : null}
      </g>
    );
  };
  const brows: Record<Expr, string> = {
    neutral: '',
    happy: '',
    smug: `M -34 ${eyeY - 22} L -12 ${eyeY - 20} M 12 ${eyeY - 26} L 34 ${eyeY - 30}`,
    shock: `M -32 ${eyeY - 28} Q -21 ${eyeY - 36} -10 ${eyeY - 29} M 10 ${eyeY - 29} Q 21 ${eyeY - 36} 32 ${eyeY - 28}`,
    worried: `M -32 ${eyeY - 18} L -12 ${eyeY - 26} M 12 ${eyeY - 26} L 32 ${eyeY - 18}`,
    oops: `M -32 ${eyeY - 20} L -12 ${eyeY - 16} M 12 ${eyeY - 16} L 32 ${eyeY - 20}`,
    cool: '',
    dizzy: '',
    groggy: `M -34 ${eyeY - 22} L -12 ${eyeY - 15} M 12 ${eyeY - 15} L 34 ${eyeY - 22}`,
  };
  const mY = HEAD.y + 28;
  const mouth: Record<Expr, React.ReactNode> = {
    neutral: <path d={`M -10 ${mY} Q 0 ${mY + 4} 10 ${mY}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    happy: <path d={`M -18 ${mY - 4} Q 0 ${mY + 20} 18 ${mY - 4} Z`} fill={ink} />,
    smug: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={0} cy={mY + 4} rx={10} ry={14} fill={ink} />,
    worried: <path d={`M -16 ${mY + 4} Q -8 ${mY - 4} 0 ${mY + 4} Q 8 ${mY + 12} 16 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    oops: <g><rect x={-18} y={mY - 6} width={36} height={16} rx={6} fill={ink} /><path d={`M -14 ${mY + 2} L 14 ${mY + 2}`} stroke="#fff" strokeWidth={3} /></g>,
    cool: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    dizzy: <path d={`M -14 ${mY + 4} Q -7 ${mY - 4} 0 ${mY + 4} Q 7 ${mY + 12} 14 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    groggy: <path d={`M -13 ${mY + 5} Q 0 ${mY - 3} 13 ${mY + 5}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
  };
  return (
    <g transform={`translate(${yaw * 30} 0) scale(${1 - 0.28 * ay} 1)`}>
      {eye(-21)}
      {eye(21)}
      {brows[expr] ? <path d={brows[expr]} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" /> : null}
      {mouth[expr]}
      {expr === 'shock' || expr === 'oops' ? <path d={`M 52 ${HEAD.y - 30} q 6 10 0 16 q -6 -6 0 -16 Z`} fill="#8FD3FF" /> : null}
      {glasses > 0.01 ? (
        <g opacity={glasses} transform={`translate(0 ${(1 - glasses) * -60})`}>
          {/* classic shades: a full bar across, two big lenses, one bright glint so it reads at feed size */}
          <path d={`M -58 ${eyeY - 12} L 58 ${eyeY - 12}`} stroke={ink} strokeWidth={6} strokeLinecap="round" />
          <path d={`M -50 ${eyeY - 14} L -6 ${eyeY - 14} L -10 ${eyeY + 8} Q -28 ${eyeY + 18} -46 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
          <path d={`M 6 ${eyeY - 14} L 50 ${eyeY - 14} L 46 ${eyeY + 8} Q 28 ${eyeY + 18} 10 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
          <path d={`M -40 ${eyeY + 2} L -26 ${eyeY - 10} M 16 ${eyeY + 2} L 30 ${eyeY - 10}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
        </g>
      ) : null}
    </g>
  );
};

export const Hero: React.FC<{ pose: Pose; shadow?: number; rimId?: string; look?: Look; t?: number }> = ({ pose, shadow = 1, rimId = 'rimR', look = LOOKS.pipHood, t = 0 }) => {
  const j = joints(pose);
  const L = look;
  // limbs are light with a dark outline, so they read on the dark sets (navy limbs vanished on navy walls)
  const limb = (o: { root: P; mid: P; end: P }, w: number, color = L.limb) => {
    const d = `M ${o.root.x} ${o.root.y} L ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`;
    return (
      <g>
        <path d={d} stroke={L.line} strokeWidth={w + 7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  const leg = (o: { root: P; mid: P; end: P }) => limb(o, 12, L.leg ?? L.limb);
  // GAMERULE: the cube backpack rides on the upper back, so it shows on the side away from where the body faces
  const backpack = L.pack ? (
    <g transform={`rotate(${pose.tilt}) translate(${-Math.sign(pose.yaw || 1) * 34 * Math.min(1, Math.abs(pose.yaw) * 1.6)} 0)`}>
      <path d="M -30 -118 L 0 -130 L 30 -118 L 0 -106 Z" fill="#3A4A5E" stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -30 -118 L 0 -106 L 0 -52 L -30 -64 Z" fill="#26313F" stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 0 -106 L 30 -118 L 30 -64 L 0 -52 Z" fill="#1C2532" stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 0 -103 L 0 -56 M -26 -116 L -2 -107" stroke="#8BE04E" strokeWidth={2.5} opacity={0.9} />
    </g>
  ) : null;
  const legs = pose.yaw < 0 ? <>{leg(j.legR)}{shoe(j.legR)}{leg(j.legL)}{shoe(j.legL)}</> : <>{leg(j.legL)}{shoe(j.legL)}{leg(j.legR)}{shoe(j.legR)}</>;
  function shoe(o: { root: P; mid: P; end: P }) {
    return <ellipse cx={o.end.x + pose.facing * 9} cy={o.end.y + 4} rx={22} ry={11} fill={L.shoe} stroke={L.line} strokeWidth={4} />;
  }
  // a mitten along the forearm: the palm, the thumb toward the body, two knuckle marks; or a pointing fist
  const hand = (o: { mid: P; end: P }, side: 1 | -1, kind: HandKind) => {
    const ang = (Math.atan2(o.end.x - o.mid.x, o.end.y - o.mid.y) * 180) / Math.PI;
    return (
      <g transform={`translate(${o.end.x} ${o.end.y}) rotate(${-ang})`}>
        {kind === 'point' ? (
          <g>
            <rect x={-4} y={10} width={8} height={24} rx={4} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
            <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={L.hand} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
            <ellipse cx={side * 10} cy={6} rx={4.5} ry={7} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
          </g>
        ) : (
          <g>
            <ellipse cx={side * 10} cy={3} rx={5.5} ry={9} transform={`rotate(${side * -28} ${side * 10} 3)`} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <ellipse cx={0} cy={10} rx={11} ry={15} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <path d="M -4 17 L -4 23 M 3 18 L 3 24" stroke={L.line} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  };
  const kw = turnWidth(pose.yaw);
  const torso = (
    <g transform={`rotate(${pose.tilt}) translate(${pose.yaw * 6} 0) scale(${kw} 1)`}>
      <path d="M -46 -112 Q 0 -124 46 -112 L 40 2 Q 0 12 -40 2 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 10 -116 Q 30 -114 46 -112 L 40 2 Q 26 8 12 9 Z" fill={L.jacketShade} opacity={0.55} />
      <path d="M 0 -112 L 0 4" stroke={L.jacketShade} strokeWidth={4} />
      {L.extra === 'suit' ? (
        // a white shirt in the V of the jacket and a tie in the accent colour
        <g>
          <path d="M -24 -116 L 0 -54 L 24 -116 Z" fill="#EDE8DE" />
          <path d="M -7 -112 L 7 -112 L 9 -100 L 5 -64 L 0 -56 L -5 -64 L -9 -100 Z" fill={L.accent} />
          <path d="M -26 -116 L 0 -54 M 26 -116 L 0 -54" stroke={L.line} strokeWidth={4} />
        </g>
      ) : L.extra === 'hoodDown' ? null : (
        <path d="M -22 -118 Q 0 -100 22 -118" stroke={L.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
      {L.pack ? (
        // the backpack's straps, over the shoulders and down the chest
        <g>
          <path d="M -28 -116 Q -30 -80 -24 -46" stroke={L.line} strokeWidth={13} fill="none" strokeLinecap="round" />
          <path d="M -28 -116 Q -30 -80 -24 -46" stroke="#2E3A4A" strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M 28 -116 Q 30 -80 24 -46" stroke={L.line} strokeWidth={13} fill="none" strokeLinecap="round" />
          <path d="M 28 -116 Q 30 -80 24 -46" stroke="#2E3A4A" strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      {L.extra === 'hoodDown' ? (
        // the hood lies down behind the neck (the head covers most of it); white drawstrings hang on the chest
        <g>
          <path d="M -44 -110 Q -54 -150 0 -154 Q 54 -150 44 -110 Q 0 -96 -44 -110 Z" fill={L.jacketShade} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
          {(() => {
            const sw = pose.sway * 0.6 - pose.tilt * 0.5;
            return (
              <g>
                <path d={`M -10 -110 Q ${-11 + sw * 0.3} -92 ${-12 + sw} -72 M 10 -110 Q ${11 + sw * 0.3} -92 ${12 + sw} -72`} stroke={L.accent} strokeWidth={4.5} strokeLinecap="round" fill="none" />
                <rect x={-15 + sw} y={-74} width={6} height={9} rx={2} fill={L.accent} />
                <rect x={9 + sw} y={-74} width={6} height={9} rx={2} fill={L.accent} />
              </g>
            );
          })()}
        </g>
      ) : null}
    </g>
  );
  const head = (
    <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt} 0 ${HEAD.y + 40})`}>
      {L.extra === 'cap' && Math.abs(pose.yaw) > 0.12 ? (
        // GAMERULE (Dex): the peak of a cap worn backwards sticks out behind the head, away from where he faces
        // (face-on it is hidden behind the head)
        <path
          transform={`translate(${-Math.sign(pose.yaw || 1) * (18 + 30 * Math.min(1, Math.abs(pose.yaw)))} 0) scale(${Math.sign(pose.yaw || 1)} 1)`}
          d={`M -40 ${HEAD.y - 34} Q -78 ${HEAD.y - 36} -84 ${HEAD.y - 24} Q -60 ${HEAD.y - 16} -30 ${HEAD.y - 22} Z`}
          fill={L.piece}
          stroke={L.line}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ) : null}
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={L.skin} stroke={L.line} strokeWidth={4} />
      <path d={`M ${HEAD.x + 14} ${HEAD.y + 58} A ${HEAD.r} ${HEAD.r} 0 0 0 ${HEAD.x + 60} ${HEAD.y + 14} A 70 70 0 0 1 ${HEAD.x + 14} ${HEAD.y + 58} Z`} fill={L.skinShade} />
      {L.extra === 'cap' ? (
        // the crown of the cap: a dome over the top of the head, a band, the strap opening at the front
        <g transform={`translate(${-pose.yaw * 10} 0)`}>
          <path d={`M -63 ${HEAD.y - 12} Q -66 ${HEAD.y - 72} 0 ${HEAD.y - 74} Q 66 ${HEAD.y - 72} 63 ${HEAD.y - 12} Q 0 ${HEAD.y - 26} -63 ${HEAD.y - 12} Z`} fill={L.piece} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M -60 ${HEAD.y - 18} Q 0 ${HEAD.y - 32} 60 ${HEAD.y - 18}`} stroke="#B8352E" strokeWidth={6} fill="none" />
          <circle cx={0} cy={HEAD.y - 72} r={5} fill="#B8352E" />
        </g>
      ) : null}
      {L.extra === 'bun' ? (
        // GAMERULE (Mom): hair pulled back into a bun on top, a soft side sweep
        <g transform={`translate(${-pose.yaw * 12} 0)`}>
          <circle cx={6} cy={HEAD.y - 70} r={22} fill={L.hair} stroke={L.line} strokeWidth={4} />
          <path d={`M -62 ${HEAD.y - 6} Q -66 ${HEAD.y - 66} 0 ${HEAD.y - 66} Q 66 ${HEAD.y - 66} 62 ${HEAD.y - 6} Q 56 ${HEAD.y - 40} 22 ${HEAD.y - 44} Q -10 ${HEAD.y - 50} -34 ${HEAD.y - 40} Q -56 ${HEAD.y - 34} -62 ${HEAD.y - 6} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ) : null}
      {L.extra === 'bunches' || L.extra === 'bob' || L.extra === 'suit' || L.extra === 'hoodDown' || L.extra === 'cap' || L.extra === 'raincoat' || L.extra === 'bun' || L.extra === 'stache' ? null : (
        <path transform={`translate(${-pose.yaw * 16} 0)`} d={`M -6 ${HEAD.y - 60} q 10 -26 30 -18 q -16 2 -14 16 q -8 -10 -16 2 Z`} fill={L.hair} />
      )}
      {L.extra === 'bunches' ? (
        // a fringe cap and two bunches tied with coral bands; the bunches swing a little with sway
        <g>
          {[-1, 1].map((sd) => (
            <g key={sd} transform={`rotate(${pose.sway * 0.5} ${sd * 58} ${HEAD.y - 30})`}>
              <circle cx={sd * 72 - pose.yaw * 10} cy={HEAD.y - 24} r={24} fill={L.hair} stroke={L.line} strokeWidth={4} />
              <circle cx={sd * 55 - pose.yaw * 10} cy={HEAD.y - 30} r={8} fill={L.accent} />
            </g>
          ))}
          <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 22} Q -62 ${HEAD.y - 66} 0 ${HEAD.y - 66} Q 62 ${HEAD.y - 66} 60 ${HEAD.y - 22} Q 40 ${HEAD.y - 46} 14 ${HEAD.y - 40} Q 0 ${HEAD.y - 50} -14 ${HEAD.y - 40} Q -40 ${HEAD.y - 46} -60 ${HEAD.y - 22} Z`} fill={L.hair} />
        </g>
      ) : null}
      {L.extra === 'bob' ? (
        // a chin-length bob framing the face, a side parting
        <path
          transform={`translate(${-pose.yaw * 12} 0)`}
          d={`M -74 ${HEAD.y + 34} Q -84 ${HEAD.y - 70} 0 ${HEAD.y - 72} Q 84 ${HEAD.y - 70} 74 ${HEAD.y + 34} L 56 ${HEAD.y + 34} Q 60 ${HEAD.y - 20} 40 ${HEAD.y - 40} Q 10 ${HEAD.y - 34} -16 ${HEAD.y - 48} Q -52 ${HEAD.y - 30} -56 ${HEAD.y + 34} Z`}
          fill={L.hair}
          stroke={L.line}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ) : null}
      {L.extra === 'suit' ? (
        // short combed-back hair with a hard side parting
        <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 18} Q -64 ${HEAD.y - 70} 4 ${HEAD.y - 68} Q 64 ${HEAD.y - 64} 60 ${HEAD.y - 18} Q 52 ${HEAD.y - 44} 18 ${HEAD.y - 46} L 12 ${HEAD.y - 54} L 6 ${HEAD.y - 46} Q -44 ${HEAD.y - 46} -60 ${HEAD.y - 18} Z`} fill={L.hair} />
      ) : null}
      <Face expr={pose.expr} blink={pose.blink} look={pose.look} glasses={pose.glasses} yaw={pose.yaw} ink={L.face} />
      {L.specs ? (
        // GAMERULE (Mom): round reading glasses, following the face as it turns
        <g transform={`translate(${pose.yaw * 30} 0) scale(${1 - 0.28 * Math.min(1, Math.abs(pose.yaw))} 1)`} fill="none" stroke={L.line} strokeWidth={4}>
          <circle cx={-21 + pose.look * 7} cy={HEAD.y - 4} r={15} />
          <circle cx={21 + pose.look * 7} cy={HEAD.y - 4} r={15} />
          <path d={`M ${-6 + pose.look * 7} ${HEAD.y - 6} L ${6 + pose.look * 7} ${HEAD.y - 6}`} />
        </g>
      ) : null}
      {L.extra === 'stache' ? (
        // a bushy moustache over the mouth, turning with the face
        <path transform={`translate(${pose.yaw * 30} 0) scale(${1 - 0.28 * Math.min(1, Math.abs(pose.yaw))} 1)`} d={`M -26 ${HEAD.y + 22} Q -14 ${HEAD.y + 6} 0 ${HEAD.y + 14} Q 14 ${HEAD.y + 6} 26 ${HEAD.y + 22} Q 12 ${HEAD.y + 18} 0 ${HEAD.y + 22} Q -12 ${HEAD.y + 18} -26 ${HEAD.y + 22} Z`} fill={L.hair} stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
      {L.extra === 'raincoat' ? (
        // GAMERULE (Juni): a yellow star clip on the hood, high on the side facing us
        <path transform={`translate(${-44 - pose.yaw * 8} ${HEAD.y - 58}) scale(0.9)`} d="M 0 -14 L 4 -4 L 15 -4 L 6 3 L 9 14 L 0 7 L -9 14 L -6 3 L -15 -4 L -4 -4 Z" fill="#FFD93B" stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
      {L.extra === 'curls'
        ? [-150, -125, -100, -78, -55, -30].map((deg, k) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={k} cx={Math.cos(a) * 54} cy={HEAD.y + Math.sin(a) * 54} r={24} fill={L.hair} />;
          })
        : null}
    </g>
  );
  return (
    <g>
      {shadow > 0 ? <ellipse cx={pose.x} cy={pose.y + LEG_LEN * pose.scale + 10} rx={70 * pose.scale} ry={12 * pose.scale} fill="#000" opacity={0.25 * shadow} /> : null}
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.scale}) rotate(${pose.spin} 0 -90)`} filter={`url(#${rimId})`}>
        <g transform={`translate(0 ${LEG_LEN}) scale(${1 + 0.6 * pose.squash} ${1 - pose.squash}) translate(0 ${-LEG_LEN})`}>
          {backpack}
          {/* the far side is drawn first, so a turned body overlaps itself the right way */}
          {legs}
          {pose.yaw < 0 ? <>{limb(j.armR, 11)}{hand(j.armR, -1, pose.handR)}</> : <>{limb(j.armL, 11)}{hand(j.armL, 1, pose.handL)}</>}
          {torso}
          {pose.yaw < 0 ? <>{limb(j.armL, 11)}{hand(j.armL, 1, pose.handL)}</> : <>{limb(j.armR, 11)}{hand(j.armR, -1, pose.handR)}</>}
          {L.extra === 'hood' ? (
            <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt * 0.5} 0 ${HEAD.y + 40})`}>
              <path d={`M -70 ${HEAD.y + 14} Q -80 ${HEAD.y - 74} 0 ${HEAD.y - 80} Q 80 ${HEAD.y - 74} 70 ${HEAD.y + 14} Q 52 -100 0 -106 Q -52 -100 -70 ${HEAD.y + 14} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} />
              {(() => {
                const sw = pose.sway * 0.7 - pose.tilt * 0.6;
                return (
                  <g>
                    <path d={`M -12 -108 Q ${-14 + sw * 0.3} -88 ${-16 + sw} -66 M 12 -108 Q ${14 + sw * 0.3} -88 ${16 + sw} -66`} stroke={L.accent} strokeWidth={5} strokeLinecap="round" fill="none" />
                    <circle cx={-16 + sw} cy={-64} r={5} fill={L.accent} />
                    <circle cx={16 + sw} cy={-64} r={5} fill={L.accent} />
                  </g>
                );
              })()}
            </g>
          ) : null}
          {L.extra === 'raincoat' ? (
            // GAMERULE (Juni): the raincoat's hood up round the face, piped in yellow; no drawstrings
            <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt * 0.5} 0 ${HEAD.y + 40})`}>
              <path d={`M -72 ${HEAD.y + 16} Q -82 ${HEAD.y - 76} 0 ${HEAD.y - 82} Q 82 ${HEAD.y - 76} 72 ${HEAD.y + 16} Q 52 -100 0 -106 Q -52 -100 -72 ${HEAD.y + 16} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} />
              <path d={`M -66 ${HEAD.y + 12} Q -76 ${HEAD.y - 70} 0 ${HEAD.y - 76} Q 76 ${HEAD.y - 70} 66 ${HEAD.y + 12}`} stroke={L.accent} strokeWidth={5} fill="none" />
            </g>
          ) : null}
          {L.extra === 'curls' ? (
            <g transform={`rotate(${pose.tilt})`}>
              <path d="M -46 -110 Q 0 -86 46 -110" stroke="#E06A5A" strokeWidth={8} fill="none" strokeLinecap="round" />
              <rect x={-60} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
              <rect x={40} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
            </g>
          ) : null}
          {head}
        </g>
      </g>
      {L.marker
        ? (() => {
            // GAMERULE: the marker floats upright over the head and bobs on the shot's clock
            const h = toWorld(pose, j.head);
            const bob = Math.sin(t / 9) * 4;
            return (
              <g transform={`translate(${h.x} ${h.y - (HEAD.r + 46 + bob) * pose.scale}) scale(${pose.scale})`}>
                <PlayerMarker />
              </g>
            );
          })()
        : null}
    </g>
  );
};


/** A character is the rig in a costume: <Actor> is the same as <Hero>, named for scenes with more than one person. */
export const Actor = Hero;

/**
 * A walk in profile. `phase` advances about 0.6 a frame for a normal walk; `ground` is the floor height under the hips
 * (a number, or a function of x for stairs and slopes). Leans into the step, bobs the head, bends the elbows, swings
 * loose things (the drawstrings) a beat behind the body.
 */
export const walkPose = (x: number, phase: number, ground: number | ((x: number) => number), scale = 0.9, extra: Partial<Pose> = {}, facing: 1 | -1 = 1): Pose => {
  const s = Math.sin(phase);
  const g = typeof ground === 'number' ? ground : ground(x);
  return {
    ...basePose,
    x,
    y: g - LEG_LEN * scale - Math.abs(Math.cos(phase)) * 7,
    scale,
    facing,
    yaw: facing,
    tilt: 5 * facing,
    headTilt: 2 * Math.sin(phase * 2),
    sway: 10 * Math.sin(phase + 0.8),
    legL: { a: 28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2)) },
    legR: { a: -28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2 + Math.PI)) },
    armL: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    armR: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    ...extra,
  };
};

/** Where the feet are for a pose standing at hip y: use it to put a character on a floor (y = floor - feetBelowHips). */
export const feetBelowHips = (scale: number) => LEG_LEN * scale;
