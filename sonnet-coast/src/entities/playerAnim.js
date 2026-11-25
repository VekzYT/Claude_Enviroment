// Procedural animation for the operative. Every joint is a channel that eases towards the pose of
// what the player is doing, so any change of state blends; the stride, punches, recoil and landing
// squash are layered on top, and hands that must touch something (a ledge, a steering wheel, a car
// door, the ground in a slide) are placed there with two-bone IK.
import * as THREE from 'three';
import { G } from '../state.js';
import { clamp, wrapAngle, smoothstep, lerp } from '../util/math.js';
import { rand, chance } from '../util/rng.js';
import { RIG } from './playerLook.js';

const DROP = 0, PITCH = 1, BANK = 2, PIVY = 3, PIVZ = 4, SP = 5, SY = 6, SR = 7, HP = 8, HY = 9, HR = 10, HIPY = 11, HIPR = 12, SWAY = 13,
  LAP = 14, LAR = 15, LAY = 16, LEL = 17, RAP = 18, RAR = 19, RAY = 20, REL = 21,
  LTP = 22, LTR = 23, LKN = 24, LFT = 25, RTP = 26, RTR = 27, RKN = 28, RFT = 29, LOCO = 30, LIE = 31, SWL = 32, SWR = 33;
const NJ = 34;
const REST = new Float32Array(NJ);
REST[SP] = 0.02; REST[HP] = 0.03; REST[LAR] = REST[RAR] = 0.1; REST[LEL] = REST[REL] = -0.2;
REST[LTR] = REST[RTR] = 0.025; REST[LKN] = REST[RKN] = 0.04; REST[LOCO] = 1; REST[SWL] = REST[SWR] = 1;
const { TH_LEN, SH_LEN, UA_LEN, FA_LEN } = RIG;
const LEG = TH_LEN + SH_LEN, ARM2 = FA_LEN + 0.045;
const TAU = Math.PI * 2;

// Legs bent so the pelvis sits d lower with the feet flat under the hips.
function crouch(o, d) {
  const a = Math.acos(clamp(1 - d / LEG, -1, 1));
  o[DROP] = -d; o[LTP] = o[RTP] = -a; o[LKN] = o[RKN] = 2 * a; o[LFT] = o[RFT] = -a;
  o[SP] += a * 0.45;
  return a;
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _y = new THREE.Vector3(0, 1, 0);
const _ik = { ap: 0, ar: 0, el: 0 };
const _tL = new THREE.Vector3(), _tR = new THREE.Vector3();

export class PlayerAnim {
  constructor(pl) {
    this.pl = pl;
    this.J = Float32Array.from(REST);
    this.T = new Float32Array(NJ);
    this.F = new Float32Array(NJ);
    this.phase = 0; this.shuffle = 0;
    this.lastH = pl.heading; this.yr = 0;
    this.lastSpeed = 0; this.acc = 0;
    this.landT = 0; this.landAmp = 0; this.landSeq = 0;
    this.lastPunch = 0; this.punchSide = 1; this.guardT = 0;
    this.idleT = 0; this.lookT = 2; this.lookH = 0; this.lookP = 0; this.fidget = null; this.fidgetT = 0; this.nextFidget = 9;
    this.lead = 0;
    this.scale = 1;
    // hands that IK places this frame (world space), and how firmly
    this.ikL = 0; this.ikR = 0; this.ikSpace = 'world';
    this.support = 0;   // > 0: the left hand holds the right one (a two-handed aim)
  }

  update(dt, t) {
    const pl = this.pl, J = this.J, T = this.T, F = this.F;
    dt = Math.max(1e-4, Math.min(dt, 0.1));
    const s = pl.speed;
    // turn rate and acceleration, smoothed (leaning into turns and into speed changes)
    const dh = wrapAngle(pl.heading - this.lastH) / dt;
    this.lastH = pl.heading;
    this.yr += (clamp(dh, -12, 12) - this.yr) * Math.min(1, dt * 10);
    this.acc += (clamp((s - this.lastSpeed) / dt, -30, 30) - this.acc) * Math.min(1, dt * 6);
    this.lastSpeed = s;
    if (pl.punchT > this.lastPunch + 0.05) {
      if (pl.heldItem === null || pl.heldItem === undefined) this.punchSide ^= 1;
      this.guardT = 1.8;
    }
    this.lastPunch = pl.punchT;
    this.guardT = Math.max(0, this.guardT - dt);
    if (pl.landSeq !== this.landSeq) { this.landSeq = pl.landSeq; this.landT = 1; this.landAmp = clamp((pl.landImpact - 3) / 10, 0.18, 1); }
    this.landT = Math.max(0, this.landT - dt * 3.4);
    this.ikL = this.ikR = 0; this.ikSpace = 'world'; this.support = 0;

    const rate = this.target(T, dt, t);
    const k = 1 - Math.exp(-dt * rate);
    for (let q = 0; q < NJ; q++) J[q] += (T[q] - J[q]) * k;
    F.set(J);
    this.locomotion(F, dt, t);
    this.overlays(F, dt, t);
    this.apply(F, t);
  }

  // ---- target pose ------------------------------------------------------------------------------
  // Fills o with the pose for what the player is doing; returns how fast to ease towards it (1/s).
  target(o, dt, t) {
    const pl = this.pl, st = pl.state;
    o.set(REST);
    if (pl.vehicle) return this.seated(o, t);
    switch (st) {
      case 'roll': return this.rollPose(o);
      case 'dodge': return this.dodgePose(o);
      case 'slide': return this.slidePose(o, t);
      case 'vault': return this.vaultPose(o);
      case 'climb': return this.climbPose(o);
      case 'entering': return this.enterPose(o, t);
      case 'busted':
        // kneeling, hands behind the head
        o[DROP] = -0.36; o[LTP] = o[RTP] = 0.02; o[LKN] = o[RKN] = 1.62; o[LFT] = o[RFT] = 0.5; o[LTR] = o[RTR] = 0.12;
        o[LAP] = o[RAP] = -2.55; o[LAR] = o[RAR] = 0.95; o[LEL] = o[REL] = -2.25; o[HP] = 0.25; o[SP] = 0.05;
        o[LOCO] = 0; o[SWL] = o[SWR] = 0;
        return 7;
      case 'ragdoll': case 'dead': {
        const air = !pl.onGround;
        const fl = Math.sin(t * 15) * (air ? 1 : 0);
        o[LIE] = air ? 0.55 : 1; o[LOCO] = 0; o[SWL] = o[SWR] = 0;
        o[LAP] = -0.4 + fl * 0.6; o[RAP] = -0.2 - fl * 0.6; o[LAR] = o[RAR] = 1.1; o[LEL] = o[REL] = -0.5;
        o[LTR] = 0.2; o[RTR] = 0.16; o[LKN] = 0.35 + (air ? 0.5 : 0); o[RKN] = 0.6 - fl * 0.3; o[LTP] = -0.25; o[RTP] = 0.1;
        o[HP] = -0.25; o[HY] = st === 'dead' ? 0.6 : 0;
        return air ? 9 : 6;
      }
    }
    if (pl.swimming) return this.swimPose(o, t);
    if (!pl.onGround) return this.airPose(o, t);
    return this.standPose(o, dt, t);
  }

  standPose(o, dt, t) {
    const pl = this.pl, s = pl.speed;
    const W = G.weapons, held = pl.heldItem;
    const aim = pl.aiming || (W && W.facingCamera);
    // idle: breathing, weight shifting from leg to leg, a look around now and then, the odd fidget
    const still = s < 0.4 && Math.abs(this.yr) < 0.8;
    this.idleT = still && !aim ? this.idleT + dt : 0;
    if (!this.idleT) this.nextFidget = 9;
    const breathe = Math.sin(t * 1.75);
    o[SP] += breathe * 0.014; o[HP] -= breathe * 0.008; o[LAR] += breathe * 0.012; o[RAR] += breathe * 0.012;
    if (still) {
      const w = Math.sin(t * 0.31) * 1.6, sh = clamp(w, -1, 1);
      o[HIPR] = sh * 0.065; o[SR] = -sh * 0.035; o[SWAY] = sh * 0.03;
      o[sh > 0 ? RKN : LKN] = 0.04 + Math.abs(sh) * 0.2;
      o[sh > 0 ? RTP : LTP] = -Math.abs(sh) * 0.07;
      o[sh > 0 ? RFT : LFT] = Math.abs(sh) * 0.1;
    }
    if (this.idleT > 2.5) {
      this.lookT -= dt;
      if (this.lookT <= 0) { this.lookT = rand(2.2, 5.5); this.lookH = chance(0.35) ? 0 : rand(-0.95, 0.95); this.lookP = rand(-0.12, 0.16); }
      o[HY] = this.lookH; o[HP] += this.lookP; o[SY] = this.lookH * 0.18;
    } else { this.lookT = 0.6; this.lookH = 0; }
    if (this.idleT > this.nextFidget && !held) { this.fidget = chance(0.5) ? 'watch' : 'stretch'; this.fidgetT = 0; this.nextFidget = this.idleT + rand(9, 15); }
    if (this.fidget) {
      this.fidgetT += dt;
      const f = smoothstep(0, 0.35, this.fidgetT) * (1 - smoothstep(1.9, 2.3, this.fidgetT));
      if (this.fidget === 'watch') {
        o[LAP] = lerp(o[LAP], -1.2, f); o[LAY] = lerp(o[LAY], 1.0, f); o[LEL] = lerp(o[LEL], -1.95, f); o[LAR] = lerp(o[LAR], 0.22, f);
        o[HP] = lerp(o[HP], 0.48, f); o[HY] = lerp(o[HY], 0.42, f); o[SY] = lerp(o[SY], 0.1, f);
      } else {
        o[LAP] = o[RAP] = -2.85 * f; o[LEL] = o[REL] = lerp(-0.2, -0.7, f); o[LAR] = o[RAR] = lerp(0.1, 0.32, f);
        o[SP] -= 0.14 * f; o[HP] -= 0.3 * f; o[HR] = Math.sin(this.fidgetT * 3) * 0.12 * f;
      }
      if (this.fidgetT > 2.3 || this.idleT === 0) this.fidget = null;
    }
    // leaning into turns and into changes of speed
    o[BANK] = clamp(-this.yr * s * 0.024, -0.34, 0.34);
    o[HR] -= o[BANK] * 0.7;
    o[PITCH] = clamp(this.acc * 0.013, -0.1, 0.13);
    // what the hands are doing
    if (aim) {
      // the gun arm follows the camera's pitch, whatever the torso is doing
      const pitch = clamp(G.cam.pitch, -0.9, 0.7);
      crouch(o, 0.035); o[LTP] -= 0.12; o[RTP] += 0.1; o[RFT] -= 0.1;
      o[SP] += pitch * 0.2; o[HP] += pitch * 0.3;
      const ap = pitch - o[SP];
      if (held === 'emp') {
        o[RAP] = -2.3 + ap * 0.5; o[RAR] = 0.25; o[REL] = -1.7; o[LAP] = -1.35 + ap; o[LEL] = -0.2; o[LAR] = 0.1; o[SY] = -0.2;
      } else {
        // a slight turn of the shoulders brings the gun to the middle; the other hand cups the grip (see apply)
        o[RAP] = -Math.PI / 2 + ap; o[RAR] = -0.04; o[RAY] = 0; o[REL] = -0.05;
        o[LAP] = -1.35 + ap; o[LAR] = 0.05; o[LAY] = 0.62; o[LEL] = -0.6; o[SY] = 0.16; o[HY] = -0.14;
        if (!(W && W.reloadT > 0)) this.support = 1;
      }
      o[SWL] = o[SWR] = 0;
      if (W && W.reloadT > 0) { o[LAP] = -1.0; o[LAY] = 0.75; o[LEL] = -1.7; o[RAP] = -0.8; o[REL] = -1.3; o[HP] += 0.25; }
    } else if (held === 'pistol') {
      o[RAP] = -0.35; o[REL] = -0.6; o[RAY] = 0.15; o[SWR] = 0.3;
      if (W && W.reloadT > 0) { o[LAP] = -0.85; o[LAY] = 0.8; o[LEL] = -1.6; o[RAP] = -0.7; o[REL] = -1.25; o[HP] += 0.3; o[SWL] = o[SWR] = 0; }
    } else if (held === 'baton') { o[RAP] = -0.15; o[REL] = -0.4; o[SWR] = 0.6; }
    else if (held === 'hack') { o[RAP] = -0.75; o[REL] = -1.25; o[RAY] = 0.35; o[SWR] = 0; o[HP] += 0.15; }
    else if (held === 'emp') { o[REL] = -0.7; o[SWR] = 0.6; }
    else if (this.guardT > 0 && !held) {
      // fighting stance between punches
      const g = smoothstep(0, 0.4, this.guardT);
      o[LAP] = lerp(o[LAP], -0.95, g); o[RAP] = lerp(o[RAP], -0.9, g); o[LAR] = o[RAR] = lerp(0.1, 0.2, g);
      o[LAY] = o[RAY] = 0.55 * g; o[LEL] = lerp(o[LEL], -2.05, g); o[REL] = lerp(o[REL], -2.0, g);
      o[SWL] = o[SWR] = 1 - 0.85 * g; o[SY] += 0.1 * g; o[HP] += 0.06 * g;
      if (s < 1) { crouch(o, 0.04 * g); o[LTP] -= 0.12 * g; o[RTP] += 0.1 * g; }
      // snap the guard up with the first punch
      if (this.guardT > 1.5) return 20;
    }
    return 11;
  }

  airPose(o, t) {
    const pl = this.pl, vy = pl.vel.y;
    o[LOCO] = 0;
    const rise = smoothstep(-2.5, 2.5, vy);
    const L = this.lead;
    const lead = L ? [RTP, RKN, RFT] : [LTP, LKN, LFT], trail = L ? [LTP, LKN, LFT] : [RTP, RKN, RFT];
    const fwdArm = L ? [LAP, LEL] : [RAP, REL], backArm = L ? [RAP, REL] : [LAP, LEL];
    // rising: lead knee up, arms driving; falling: legs reaching down for the ground, arms out
    o[lead[0]] = lerp(-0.42, -1.35, rise); o[lead[1]] = lerp(0.45, 1.75, rise); o[lead[2]] = lerp(0.1, -0.15, rise);
    o[trail[0]] = lerp(-0.22, 0.35, rise); o[trail[1]] = lerp(0.55, 1.35, rise); o[trail[2]] = lerp(0.1, 0.35, rise);
    o[fwdArm[0]] = lerp(-0.6, -1.45, rise); o[fwdArm[1]] = lerp(-0.5, -1.2, rise);
    o[backArm[0]] = lerp(-0.45, 0.65, rise); o[backArm[1]] = lerp(-0.5, -0.35, rise);
    o[LAR] = o[RAR] = lerp(0.75, 0.2, rise);
    o[SP] = lerp(0.04, 0.12, rise); o[HP] = lerp(0.12, -0.04, rise);
    o[SWL] = o[SWR] = 0;
    // a long drop: arms windmilling, legs pedalling
    const fall = smoothstep(-10, -16, vy);
    if (fall > 0) {
      const w = t * 11;
      o[LAP] = lerp(o[LAP], -1.6 + Math.sin(w) * 1.3, fall); o[RAP] = lerp(o[RAP], -1.6 - Math.sin(w) * 1.3, fall);
      o[LAR] = o[RAR] = lerp(o[LAR], 0.9, fall);
      o[LTP] = lerp(o[LTP], -0.5 + Math.sin(w * 0.8) * 0.5, fall); o[RTP] = lerp(o[RTP], -0.5 - Math.sin(w * 0.8) * 0.5, fall);
    }
    // kicking off a wall: back arched, one leg pushing off, arms reaching up
    if (pl.kickT > 0) {
      const k = smoothstep(0, 0.12, pl.kickT);
      o[LTP] = lerp(o[LTP], 0.55, k); o[LKN] = lerp(o[LKN], 0.25, k); o[RTP] = lerp(o[RTP], -1.1, k); o[RKN] = lerp(o[RKN], 1.6, k);
      o[LAP] = lerp(o[LAP], -2.4, k); o[RAP] = lerp(o[RAP], -2.2, k); o[LAR] = o[RAR] = lerp(o[LAR], 0.45, k);
      o[SP] = lerp(o[SP], -0.2, k); o[HP] = lerp(o[HP], -0.25, k);
    }
    return 12;
  }

  swimPose(o, t) {
    const pl = this.pl, s = pl.speed;
    const crawl = smoothstep(0.6, 1.8, s);
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    o[PIVY] = RIG.HIP_Y;
    o[PITCH] = lerp(0.22, 1.32, crawl);
    o[SP] = lerp(0.05, -0.12, crawl); o[HP] = lerp(0.0, -0.55, crawl);
    // treading water: sculling hands, slow egg-beater legs (the crawl itself is an overlay)
    const sc = Math.sin(t * 4);
    o[LAP] = o[RAP] = -0.45; o[LAR] = o[RAR] = 1.05 + sc * 0.15; o[LAY] = 0.6 * sc; o[RAY] = -0.6 * sc; o[LEL] = o[REL] = -0.6;
    const eb = Math.sin(t * 3);
    o[LTP] = -0.55 + eb * 0.3; o[RTP] = -0.55 - eb * 0.3; o[LKN] = 1.05 - eb * 0.4; o[RKN] = 1.05 + eb * 0.4; o[LTR] = o[RTR] = 0.25;
    return 6;
  }

  rollPose(o) {
    const pl = this.pl, u = pl.stateT / pl.mv.dur;
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    if (u < 0.8) {
      // tucked into a ball: knees to the chest, arms wrapped round the shins, chin down
      // the ball turns about its middle, which rests about half a metre up
      o[DROP] = -0.5; o[PIVY] = 0.5; o[PIVZ] = 0.25;
      o[SP] = 0.95; o[HP] = 0.6;
      o[LTP] = o[RTP] = -1.95; o[LKN] = o[RKN] = 2.4; o[LFT] = o[RFT] = 0.2; o[LTR] = o[RTR] = 0.12;
      o[LAP] = o[RAP] = -0.85; o[LEL] = o[REL] = -1.75; o[LAY] = o[RAY] = 0.35; o[LAR] = o[RAR] = 0.2;
      if (u < 0.12) { o[LAP] = o[RAP] = -1.35; o[LEL] = o[REL] = -0.3; }   // hands reaching for the ground
      return 24;
    }
    crouch(o, 0.22); o[LAP] = o[RAP] = -0.7; o[LEL] = o[REL] = -0.9; o[LAR] = o[RAR] = 0.25;
    return 16;
  }

  dodgePose(o) {
    const pl = this.pl, mv = pl.mv;
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    crouch(o, 0.2);
    o[BANK] = -mv.side * 0.32; o[PITCH] = mv.fwd * 0.18;
    // the leg on the side we hop towards reaches out
    if (mv.side > 0) { o[LTR] = 0.4; o[RTR] = -0.05; } else { o[RTR] = 0.4; o[LTR] = -0.05; }
    // keep the weapon up (a sidestep out of the line of fire)
    const pitch = clamp(G.cam.pitch, -0.9, 0.7) * 0.72;
    o[RAP] = -1.5 + pitch; o[REL] = -0.06; o[LAP] = -1.34 + pitch; o[LAY] = 0.62; o[LEL] = -0.55; o[SY] = 0.18;
    return 20;
  }

  slidePose(o, t) {
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    o[DROP] = -0.7; o[PIVY] = 0.3; o[PITCH] = -0.5;
    o[SP] = 0.12; o[HP] = 0.42;
    // lead leg out in front, the other folded under, one hand trailing on the ground
    o[RTP] = -0.9; o[RKN] = 0.12; o[RFT] = -0.35; o[RTR] = 0.06;
    o[LTP] = -0.18; o[LKN] = 2.05; o[LFT] = 0.35; o[LTR] = 0.3;
    o[LAP] = 0.35; o[LAR] = 0.55; o[LEL] = -0.2;
    o[RAP] = -0.95; o[RAR] = 0.35; o[REL] = -0.75;
    o[HR] = Math.sin(t * 20) * 0.015;
    return 18;
  }

  vaultPose(o) {
    const pl = this.pl, mv = pl.mv, u = pl.stateT / mv.dur;
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    if (u < mv.uIn) {
      // reaching for the top, lead knee lifting
      o[LAP] = o[RAP] = -1.25; o[LEL] = o[REL] = -0.25; o[LAR] = o[RAR] = 0.18;
      o[LTP] = -0.9; o[LKN] = 1.4; o[RTP] = -0.2; o[RKN] = 0.7; o[SP] = 0.25; o[PITCH] = 0.12;
    } else if (u < mv.uOut) {
      // over the top: hands planted, knees tucked to the chest
      const k = (u - mv.uIn) / Math.max(0.05, mv.uOut - mv.uIn);
      o[LAP] = o[RAP] = lerp(-0.7, 0.35, k); o[LEL] = o[REL] = -0.12; o[LAR] = o[RAR] = 0.22;
      o[LTP] = o[RTP] = -1.55; o[LKN] = o[RKN] = 2.1; o[LTR] = o[RTR] = 0.15;
      o[DROP] = -0.45; o[SP] = 0.42; o[HP] = -0.1; o[PITCH] = 0.32; o[PIVY] = 0.5;
      this.ikL = this.ikR = 1 - smoothstep(0.55, 0.9, k);
      _tL.copy(mv.plantL); _tR.copy(mv.plantR);
    } else {
      // legs reaching for the landing
      o[LTP] = -0.5; o[RTP] = -0.25; o[LKN] = 0.55; o[RKN] = 0.7; o[LAR] = o[RAR] = 0.5; o[LAP] = o[RAP] = -0.55; o[SP] = 0.12; o[PITCH] = 0.08;
    }
    return 18;
  }

  climbPose(o) {
    const pl = this.pl, mv = pl.mv, u = pl.climbU();
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    if (u < 0.22) {
      // spring up, arms overhead for the edge
      o[LAP] = o[RAP] = -2.95; o[LAR] = o[RAR] = 0.22; o[LEL] = o[REL] = -0.15;
      o[LTP] = -0.35; o[LKN] = 0.6; o[RTP] = 0.05; o[RKN] = 0.35; o[HP] = -0.25;
      this.ikL = this.ikR = smoothstep(0.1, 0.22, u);
    } else if (u < 0.62) {
      // hanging, then pulling up: one foot finds the wall
      o[LAP] = o[RAP] = -2.4; o[LEL] = o[REL] = -1.6; o[LAR] = o[RAR] = 0.3;
      o[LTP] = -1.05; o[LKN] = 1.75; o[LFT] = -0.2; o[RTP] = 0.12; o[RKN] = 0.45;
      o[SP] = 0.18; o[HP] = -0.3;
      this.ikL = this.ikR = 1;
    } else if (u < 0.86) {
      // mantling: pressing down on the hands, a knee onto the top
      o[LAP] = o[RAP] = 0.15; o[LEL] = o[REL] = -0.2; o[LAR] = o[RAR] = 0.4;
      o[LTP] = -1.65; o[LKN] = 2.2; o[RTP] = -0.35; o[RKN] = 1.3; o[DROP] = -0.25; o[SP] = 0.6; o[PITCH] = 0.22; o[HP] = 0.05;
      this.ikL = this.ikR = 1 - smoothstep(0.76, 0.86, u);
    } else {
      crouch(o, 0.26 * (1 - smoothstep(0.86, 1, u))); o[LAR] = o[RAR] = 0.2;
    }
    _tL.copy(mv.gripL); _tR.copy(mv.gripR);
    return u < 0.86 ? 16 : 12;
  }

  enterPose(o, t) {
    const pl = this.pl, v = pl.enterTarget;
    o[LOCO] = 0;
    if (v) {
      // a hand on the door handle; pulling a driver out takes both hands and some weight
      const s = Math.sin(v.heading), c = Math.cos(v.heading), side = v.T.wid / 2 + 0.06;
      _tR.set(v.pos.x + c * side + s * 0.25, v.pos.y + Math.min(v.T.hgt * 0.62, 1.05), v.pos.z - s * side + c * 0.25);
      const u = smoothstep(0, 0.25, pl.stateT);
      this.ikR = u;
      o[SP] = 0.12; o[SY] = 0.2;
      if (pl.enterKind === 'jack') {
        _tL.copy(_tR).addScaledVector(_w.set(s, 0, c), -0.25);
        this.ikL = u;
        const pull = Math.max(0, Math.sin(pl.stateT * 7));
        o[PITCH] = -0.12 * pull; o[SP] = 0.05; crouch(o, 0.08); o[LTP] -= 0.2;
      } else if (pl.enterKind === 'break') {
        // working the lock: elbow jabs at the window
        const j = Math.max(0, Math.sin(pl.stateT * 12));
        this.ikR = 0;
        o[RAP] = -1.0 - j * 0.4; o[RAR] = 0.5; o[REL] = -2.0 + j * 1.2; o[SY] = 0.35 * j; o[LAP] = -0.6; o[LEL] = -1.2;
      }
    }
    return 12;
  }

  seated(o, t) {
    const pl = this.pl, v = pl.vehicle;
    o[LOCO] = 0; o[SWL] = o[SWR] = 0;
    const st = v.cls === 'car' ? clamp(v.steer / Math.max(0.3, v.T.steer), -1, 1) : clamp(v.steer, -1, 1);
    if (v.T.bike || v.cls === 'hover') {
      // astride: knees hugging the tank, feet back on the pegs, low over the bars, leaning into turns
      const tuck = clamp(v.speed / 40, 0, 1);
      o[LTP] = o[RTP] = -0.5; o[LTR] = o[RTR] = 0.24; o[LKN] = o[RKN] = 2.1; o[LFT] = o[RFT] = -0.55;
      o[SP] = 0.8 + tuck * 0.15; o[HP] = -0.7 - tuck * 0.15;
      o[BANK] = -st * 0.22; o[HY] = -st * 0.18;
      // grips on the bars (model space: about 0.9 m ahead of the saddle and 0.28 m above it), turning
      // with the steering
      _tL.set(0.38, 0.98 - tuck * 0.04, 0.8 + st * 0.05); _tR.set(-0.38, 0.98 - tuck * 0.04, 0.8 - st * 0.05);
      this.ikL = this.ikR = 1; this.ikSpace = 'model';
      return 10;
    } else {
      // hands on the wheel at ten to two, turning it; head looking into the turn
      o[LTP] = o[RTP] = -1.45; o[LKN] = o[RKN] = 1.35; o[LFT] = o[RFT] = -0.1; o[LTR] = 0.08; o[RTR] = 0.05;
      o[SP] = -0.06; o[HY] = -st * 0.28; o[SR] = st * 0.04;
      const a = st * 1.15, R = 0.17;
      _tL.set(Math.cos(0.5 + a) * R, 0.24 + Math.sin(0.5 + a) * R, 0.44 - Math.sin(0.5 + a) * R * 0.35);
      _tR.set(Math.cos(Math.PI - 0.5 + a) * R, 0.24 + Math.sin(Math.PI - 0.5 + a) * R, 0.44 - Math.sin(Math.PI - 0.5 + a) * R * 0.35);
    }
    this.ikL = this.ikR = 1; this.ikSpace = 'torso';
    return 10;
  }

  // ---- layers on top of the eased pose ----------------------------------------------------------
  locomotion(F, dt, t) {
    const pl = this.pl, J = this.J;
    const s = pl.speed, loco = J[LOCO];
    // stride rate: about two steps a second walking, over three sprinting
    this.phase += dt * Math.PI * (s > 0.15 ? 1.55 + s * 0.22 : 0) * (loco > 0.3 ? 1 : 0);
    // small steps when turning on the spot
    const sh = clamp(Math.abs(this.yr) / 3, 0, 1) * (1 - clamp(s / 1.2, 0, 1)) * loco;
    this.shuffle += dt * 11 * (sh > 0.05 ? 1 : 0);
    if (sh > 0.05) {
      const a = Math.max(0, Math.sin(this.shuffle)) * sh, b = Math.max(0, -Math.sin(this.shuffle)) * sh;
      F[LKN] += 0.5 * a; F[LTP] -= 0.25 * a; F[LFT] -= 0.25 * a;
      F[RKN] += 0.5 * b; F[RTP] -= 0.25 * b; F[RFT] -= 0.25 * b;
      F[HIPY] += clamp(this.yr * 0.03, -0.12, 0.12);
    }
    const amp = clamp(s / 1.3, 0, 1) * loco;
    if (amp < 0.01) return;
    this.lead = Math.sin(this.phase) > 0 ? 1 : 0;
    const run = smoothstep(2.3, 4.4, s), spr = smoothstep(5.6, 7.6, s);
    const sn = Math.sin(this.phase), cs = Math.cos(this.phase);
    // which way the legs travel relative to the body (strafing and backing up while aiming)
    const hs = Math.sin(pl.heading), hc = Math.cos(pl.heading);
    const fwd = s > 0.3 ? clamp((pl.vel.x * hs + pl.vel.z * hc) / s, -1, 1) : 1;
    const side = s > 0.3 ? clamp((pl.vel.x * hc - pl.vel.z * hs) / s, -1, 1) : 0;
    const A = ((0.2 + 0.14 * Math.min(s, 2.2)) * (1 - run) + run * 0.5 + spr * 0.12) * amp;
    let hL = 0, hR = 0;
    for (let k = 0; k < 2; k++) {
      const ss = k ? -sn : sn, cc = k ? -cs : cs;
      const sw = Math.max(0, cc);
      const th = -A * ss * fwd - (run * 0.12 + spr * 0.08) * amp;
      // running, the knee stays soft through the stance and folds up behind after the push-off
      const kn = amp * (0.06 + (0.85 + run * 0.95 + spr * 0.55) * sw ** 1.4 + 0.12 * Math.max(0, -cc) * (1 - run)) + run * amp * (0.25 + 0.75 * Math.max(0, -ss * fwd) ** 1.5);
      const fw = amp * (0.55 * Math.max(0, -ss) ** 2 * clamp(cc + 0.7, 0, 1) - 0.25 * Math.max(0, ss) ** 2) * (1 - run * 0.5);
      const iT = k ? RTP : LTP, iK = k ? RKN : LKN, iF = k ? RFT : LFT, iR = k ? RTR : LTR;
      F[iT] += th; F[iK] += kn; F[iF] += fw - th - kn;
      F[iR] += (k ? -1 : 1) * side * 0.5 * A * sn;
      const h = TH_LEN * Math.cos(th) + SH_LEN * Math.cos(th + kn);
      if (k) hR = h; else hL = h;
    }
    // running has a flight phase: the hips rise while the legs are spread
    F[DROP] += Math.max(hL, hR) - LEG + run * 0.06 * Math.abs(sn) * amp;
    // arms: a relaxed swing walking, a hard pump with bent elbows running
    const Aa = amp * ((0.3 + 0.08 * Math.min(s, 2)) * (1 - run) + run * 0.75 + spr * 0.4);
    F[LAP] += Aa * sn * fwd * J[SWL]; F[RAP] -= Aa * sn * fwd * J[SWR];
    F[LEL] -= (amp * (0.12 + 0.3 * Math.max(0, -sn)) * (1 - run) + run * amp * (1.25 + 0.3 * sn) + spr * amp * 0.15) * J[SWL];
    F[REL] -= (amp * (0.12 + 0.3 * Math.max(0, sn)) * (1 - run) + run * amp * (1.25 - 0.3 * sn) + spr * amp * 0.15) * J[SWR];
    F[LAR] += run * 0.1 * amp; F[RAR] += run * 0.1 * amp;
    // hips and shoulders counter-rotate; the head stays on target
    const hy = -0.13 * A * sn;
    F[HIPY] += hy; F[SY] -= hy * 1.7; F[HY] += hy * 0.8;
    F[HIPR] -= 0.05 * amp * cs * (1 - run); F[SR] += 0.035 * amp * cs * (1 - run);
    F[SWAY] -= 0.02 * amp * cs * (1 - run);
    // running form: body leaning into the run, chin up
    F[SP] += 0.03 * amp + run * 0.13 + spr * 0.08;
    F[PITCH] += (run * 0.05 + spr * 0.1) * amp * Math.max(0, fwd);
    F[HP] -= run * 0.1 + spr * 0.1;
  }

  overlays(F, dt, t) {
    const pl = this.pl;
    // punches: alternating jabs and crosses with the fists, a downward strike with the baton,
    // an overarm throw for the EMP
    if (pl.punchT > 0 && !pl.vehicle) {
      const k = 1 - pl.punchT / 0.3;
      const held = pl.heldItem;
      if (!held) {
        const e = k < 0.32 ? smoothstep(0, 0.32, k) : 1 - smoothstep(0.42, 1, k);
        const R = this.punchSide === 1;
        const ap = R ? RAP : LAP, el = R ? REL : LEL, ay = R ? RAY : LAY, ar = R ? RAR : LAR;
        F[ap] = lerp(F[ap], -1.5, e); F[el] = lerp(F[el], -0.08, e); F[ay] = lerp(F[ay], 0.16, e); F[ar] = lerp(F[ar], 0.08, e);
        const tw = (R ? 0.5 : -0.5) * e;
        F[SY] += tw; F[HIPY] += tw * 0.4; F[HY] -= tw * 0.85; F[PITCH] += 0.05 * e;
      } else if (held === 'baton') {
        const sw = smoothstep(0.12, 0.55, k), w = Math.sin(Math.min(1, k * 1.1) * Math.PI) ** 0.5;
        F[RAP] = lerp(F[RAP], lerp(-2.7, -0.6, sw), w); F[REL] = lerp(F[REL], lerp(-1.3, -0.1, sw), w); F[RAR] = lerp(F[RAR], 0.2, w);
        F[SY] += lerp(0.4, -0.35, sw) * w; F[SP] += 0.12 * sw * w;
      } else {
        const sw = smoothstep(0.1, 0.5, k), w = Math.sin(Math.min(1, k * 1.1) * Math.PI) ** 0.5;
        F[RAP] = lerp(F[RAP], lerp(-2.6, -1.0, sw), w); F[REL] = lerp(F[REL], lerp(-1.7, -0.15, sw), w);
        F[LAP] = lerp(F[LAP], -1.2, w); F[LEL] = lerp(F[LEL], -0.3, w);
        F[SY] += lerp(0.35, -0.3, sw) * w;
      }
    }
    // pistol recoil: arms kick up, head and shoulders rock back
    if (pl.recoil > 0) { const r = pl.recoil; F[RAP] -= 0.3 * r; F[REL] -= 0.28 * r; F[LAP] -= 0.22 * r; F[SP] -= 0.05 * r; F[HP] -= 0.04 * r; }
    // landing: knees and hips soak it up (and the body squashes a little, see apply)
    const env = this.landT ** 1.6 * this.landAmp;
    if (env > 0.001 && !pl.vehicle) {
      const d = 0.24 * env, a = Math.acos(clamp(1 - d / LEG, -1, 1));
      F[DROP] -= d; F[LTP] -= a; F[RTP] -= a; F[LKN] += 2 * a; F[RKN] += 2 * a; F[LFT] -= a; F[RFT] -= a;
      F[SP] += a * 0.7; F[HP] -= a * 0.3; F[LAR] += 0.3 * env; F[RAR] += 0.3 * env; F[LAP] -= 0.25 * env; F[RAP] -= 0.25 * env;
    }
    // swimming: front crawl with a breath to the side every other stroke, flutter kick
    if (pl.swimming && !pl.vehicle && pl.state === 'foot') {
      const w = smoothstep(0.6, 1.8, pl.speed);
      if (w > 0) {
        const ph = t * 4.4;
        const a = ph % TAU, b = (ph + Math.PI) % TAU;
        F[LAP] = lerp(F[LAP], -Math.PI + a, w); F[RAP] = lerp(F[RAP], -Math.PI + b, w);
        F[LAR] = lerp(F[LAR], 0.2, w); F[RAR] = lerp(F[RAR], 0.2, w); F[LAY] = lerp(F[LAY], 0, w); F[RAY] = lerp(F[RAY], 0, w);
        F[LEL] = lerp(F[LEL], -0.2 - 1.1 * Math.max(0, Math.sin(a - Math.PI)), w); F[REL] = lerp(F[REL], -0.2 - 1.1 * Math.max(0, Math.sin(b - Math.PI)), w);
        F[BANK] += Math.sin(ph) * 0.35 * w;
        F[HY] += Math.max(0, Math.sin(ph * 0.5)) ** 3 * 0.9 * w;
        const fk = Math.sin(t * 11);
        F[LTP] = lerp(F[LTP], 0.05 + fk * 0.28, w); F[RTP] = lerp(F[RTP], 0.05 - fk * 0.28, w);
        F[LKN] = lerp(F[LKN], 0.25 + Math.max(0, fk) * 0.3, w); F[RKN] = lerp(F[RKN], 0.25 + Math.max(0, -fk) * 0.3, w);
        F[LTR] = lerp(F[LTR], 0.04, w); F[RTR] = lerp(F[RTR], 0.04, w); F[LFT] = lerp(F[LFT], 0.6, w); F[RFT] = lerp(F[RFT], 0.6, w);
      }
    }
    // slide: the trailing hand brushes the ground beside the hip
    if (pl.state === 'slide') {
      const s = Math.sin(pl.heading), c = Math.cos(pl.heading);
      _tL.set(pl.pos.x + c * 0.42 - s * 0.15, pl.pos.y + 0.05, pl.pos.z - s * 0.42 - c * 0.15);
      this.ikL = smoothstep(0.05, 0.2, pl.stateT);
    }
  }

  // ---- write the pose onto the bones ------------------------------------------------------------
  apply(F, t) {
    const pl = this.pl, P = pl.P, m = pl.model;
    const lie = clamp(F[LIE], 0, 1);
    const spin = pl.state === 'roll' ? TAU * smoothstep(0.06, 0.8, pl.stateT / pl.mv.dur) : 0;
    const env = pl.vehicle ? 0 : this.landT ** 1.6 * this.landAmp;
    this.scale = 1 - 0.07 * env;
    if (pl.vehicle) {
      m.rotation.set(F[PITCH], 0, F[BANK]);
    } else {
      const pitch = F[PITCH] + spin - lie * 1.5;
      m.rotation.set(pitch, pl.heading, F[BANK]);
      // turn about the pivot (feet by default; the hips or the body's middle for rolls and slides)
      const py = F[PIVY] * (1 - lie), pz = F[PIVZ];
      _w.set(0, py, pz).applyAxisAngle(_y, pl.heading);
      _v.set(0, py * this.scale, pz).applyEuler(_e.set(pitch, pl.heading, F[BANK], 'YXZ'));
      m.position.set(pl.pos.x + _w.x - _v.x, pl.pos.y + _w.y - _v.y + lie * 0.16 + (pl.swimming ? 0.08 : 0), pl.pos.z + _w.z - _v.z);
      m.scale.set(1 + 0.035 * env, this.scale, 1 + 0.035 * env);
    }
    P.pelvis.position.set(F[SWAY], RIG.HIP_Y + F[DROP] * (1 - lie), 0);
    P.pelvis.rotation.set(0, F[HIPY], F[HIPR]);
    P.torso.rotation.set(F[SP], F[SY], F[SR]);
    P.head.rotation.set(F[HP], F[HY], F[HR]);
    P.thL.rotation.set(F[LTP], 0, F[LTR]); P.thR.rotation.set(F[RTP], 0, -F[RTR]);
    P.shL.rotation.x = F[LKN]; P.shR.rotation.x = F[RKN];
    P.ftL.rotation.x = F[LFT]; P.ftR.rotation.x = F[RFT];
    // hands placed by IK where they must touch something; targets are in world, model (a rider's
    // grips, which move with the vehicle) or torso space
    if (this.ikL || this.ikR) {
      const sp = this.ikSpace;
      if (sp !== 'torso') m.updateMatrixWorld();
      for (let k = 0; k < 2; k++) {
        const w = k ? this.ikR : this.ikL;
        if (w < 0.001) continue;
        _v.copy(k ? _tR : _tL);
        if (sp === 'model') m.localToWorld(_v);
        if (sp !== 'torso') P.torso.worldToLocal(_v);
        const sx = (k ? -1 : 1) * Math.abs(P.uaL.position.x);
        solveArm(_v.x - sx, _v.y - RIG.SHOULDER_Y, _v.z + 0.008, k ? -1 : 1);
        const ap = k ? RAP : LAP, ar = k ? RAR : LAR, ay = k ? RAY : LAY, el = k ? REL : LEL;
        F[ap] = lerp(F[ap], _ik.ap, w); F[ar] = lerp(F[ar], _ik.ar, w); F[ay] = lerp(F[ay], 0, w); F[el] = lerp(F[el], _ik.el, w);
      }
    }
    P.uaR.rotation.set(F[RAP], F[RAY], -F[RAR]); P.faR.rotation.x = F[REL];
    // a two-handed grip: the left hand goes to wherever the right hand now is
    if (this.support) {
      m.updateMatrixWorld();
      P.hand.getWorldPosition(_v);
      _v.y -= 0.035;
      P.torso.worldToLocal(_v);
      solveArm(_v.x - Math.abs(P.uaL.position.x), _v.y - RIG.SHOULDER_Y, _v.z + 0.008, 1);
      const w = this.support;
      F[LAP] = lerp(F[LAP], _ik.ap, w); F[LAR] = lerp(F[LAR], _ik.ar, w); F[LAY] = lerp(F[LAY], 0, w); F[LEL] = lerp(F[LEL], _ik.el, w);
    }
    P.uaL.rotation.set(F[LAP], -F[LAY], F[LAR]); P.faL.rotation.x = F[LEL];
    pl.camDip = 0.22 * env;
  }
}

// Two-bone IK for an arm hanging from the shoulder (d = hand target from the shoulder, torso space;
// sg = +1 left, -1 right): upper arm Rz(sg*ar) Rx(ap), elbow bending the forearm forward.
function solveArm(dx, dy, dz, sg) {
  const L1 = UA_LEN, L2 = ARM2;
  // swing so the target lies in the arm's bending plane, keeping the elbow below and behind
  let c = Math.atan2(dx, -dy);
  if (c > Math.PI / 2) c -= Math.PI; else if (c < -Math.PI / 2) c += Math.PI;   // overhead: raise the arm forwards, not over the side
  const e1 = dx * Math.sin(c) - dy * Math.cos(c);
  const l = clamp(Math.hypot(e1, dz), 0.08, L1 + L2 - 0.002);
  const thD = Math.atan2(dz, e1);
  const beta = Math.acos(clamp((L1 * L1 + l * l - L2 * L2) / (2 * L1 * l), -1, 1));
  const bend = Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - l * l) / (2 * L1 * L2), -1, 1));
  _ik.ap = -(thD - beta); _ik.el = -bend; _ik.ar = c * sg;
}
