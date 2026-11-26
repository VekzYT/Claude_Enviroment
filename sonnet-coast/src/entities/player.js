// The operative: on-foot movement and parkour (dodge roll, sidestep, slide, vault, ledge climb,
// wall kick), getting in and out of vehicles, health, and the animated model (playerLook.js builds
// and dresses it, playerAnim.js poses it, playerMoves.js reads the world for it).
import * as THREE from 'three';
import { G, emit } from '../state.js';
import { Input } from '../input.js';
import { groundHeight, surfaceAt } from '../world/roads.js';
import { resolveCircle } from '../world/colliders.js';
import { WATER_Y, POI } from '../world/layout.js';
import { clamp, wrapAngle, lerp, smoothstep } from '../util/math.js';
import { OUTFITS, DEFAULT_OUTFIT, fullOutfit, buildModel, dressModel, RIG } from './playerLook.js';
import { PlayerAnim } from './playerAnim.js';
import { pushOut, supportAt, planVault, planClimb, wallAhead } from './playerMoves.js';

export { OUTFITS, DEFAULT_OUTFIT };

const out = { x: 0, z: 0, broken: [] };
const sup = { vehicle: null };
const GRAV = 24;
// what a dodge makes you untouchable by
const DODGEABLE = new Set(['shot', 'punch', 'melee', 'gator']);
const MOVES = new Set(['roll', 'dodge', 'slide', 'vault', 'climb']);
const DUST = { asphalt: [0.5, 0.49, 0.47], concrete: [0.62, 0.6, 0.56], sand: [0.82, 0.74, 0.58], dirt: [0.55, 0.45, 0.32], grass: [0.42, 0.46, 0.3], mud: [0.36, 0.3, 0.22] };

export class Player {
  constructor() {
    this.pos = new THREE.Vector3(POI.safehouse.x + 4, 3, POI.safehouse.z + 4);
    this.vel = new THREE.Vector3();
    this.heading = Math.PI / 2;
    this.onGround = true;
    this.vehicle = null;
    // foot | entering | ragdoll | dead | busted, and the moves: roll | dodge | slide | vault | climb
    this.state = 'foot';
    this.stateT = 0;
    this.mv = null;            // the current move's plan
    this.health = 100; this.maxHealth = 100; this.armor = 0;
    this.lastHurt = -99;
    this.swimming = false;
    this.aiming = false;
    this.sprinting = false;
    this.speed = 0;
    this.punchT = 0; this.recoil = 0;
    this.enterTarget = null; this.enterDur = 0;
    this.invuln = 0;
    this.dodgeT = 0;           // untouchable by shots and blows while > 0
    this.kickT = 0; this.wallKicked = false;
    this.rollQueued = 0;       // C pressed in the air: break the fall with a roll
    this.landSeq = 0; this.landImpact = 0;
    this.standOn = null;       // vehicle whose roof we stand on
    this.clearOf = null; this.clearT = 0;   // a helicopter just bailed out of, not collided with for a moment
    this.camDip = 0;
    this.dustT = 0;
    this.scan = 0;
    this.outfit = fullOutfit(DEFAULT_OUTFIT);
    const m = buildModel();
    this.model = m.root; this.P = m.P; this.mats = m.mats;
    G.scene.add(this.model);
    this.anim = new PlayerAnim(this);
    this.applyOutfit();
    this.heldItem = null;
  }

  applyOutfit(o = this.outfit) {
    this.outfit = fullOutfit(o);
    dressModel(this.P, this.mats, this.outfit);
  }
  setHeld(name) {
    this.heldItem = name;
    for (const k of Object.keys(this.P.items)) this.P.items[k].visible = k === name;
  }
  muzzlePos(target = new THREE.Vector3()) { return this.P.muzzle.getWorldPosition(target); }

  get inVehicle() { return !!this.vehicle; }
  get alive() { return this.state !== 'dead' && this.state !== 'busted'; }
  // position that matters for the world (vehicle or body)
  get worldPos() { return this.vehicle ? this.vehicle.pos : this.pos; }
  get worldSpeed() { return this.vehicle ? this.vehicle.speed : this.speed; }

  // ---- damage ----------------------------------------------------------------
  hurt(amount, source = null) {
    if (!this.alive || this.invuln > 0 || amount <= 0) return;
    if (this.dodgeT > 0 && DODGEABLE.has(source)) return;
    if (this.vehicle && source !== 'crash' && source !== 'explosion' && source !== 'drown') amount *= 0.45;
    if (this.armor > 0) {
      const a = Math.min(this.armor, amount * 0.8);
      this.armor -= a; amount -= a;
    }
    this.health -= amount;
    this.lastHurt = G.time;
    emit('playerHurt', amount, source);
    if (this.health <= 0) { this.health = 0; this.die(source); }
  }
  die(source) {
    if (!this.alive) return;
    if (this.vehicle) this.leaveVehicle(true);
    this.state = 'dead'; this.stateT = 0;
    emit('playerDied', source);
  }
  bust() {
    if (!this.alive) return;
    if (this.vehicle) this.leaveVehicle(true);
    this.state = 'busted'; this.stateT = 0;
    this.vel.set(0, 0, 0);
    emit('playerBusted');
  }
  knockDown(vx, vy, vz, seconds = 1.4) {
    if (!this.alive) return;
    if (this.vehicle) this.leaveVehicle(true);
    this.state = 'ragdoll'; this.stateT = seconds;
    this.vel.set(vx, vy, vz);
    this.onGround = false;
  }
  respawn(x, z, heading = 0) {
    this.teleport(x, groundHeight(x, z, 9999), z, heading);
    this.health = this.maxHealth; this.state = 'foot'; this.stateT = 0;
    this.invuln = 3;
    this.model.visible = true;
  }
  // The way to move the player on foot from outside (respawns, doors into interiors...): ends any
  // move in progress, which would otherwise keep placing the body along its own plan.
  teleport(x, y, z, heading = this.heading) {
    if (MOVES.has(this.state)) this.endMove();
    this.mv = null;
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0); this.speed = 0;
    this.heading = heading;
    this.standOn = null; this.onGround = true;
  }

  // ---- vehicles ------------------------------------------------------------
  nearestVehicle(range = 3.6) {
    let best = null, bd = range;
    for (const v of G.vehicles) {
      if (v.sunk || v.destroyed) continue;
      const dx = this.pos.x - v.pos.x, dz = this.pos.z - v.pos.z;
      if (Math.abs(this.pos.y - v.pos.y) > 3) continue;
      const s = Math.sin(v.heading), c = Math.cos(v.heading);
      // distance to the hull: project onto its axes
      const f = clamp(dx * s + dz * c, -v.T.len / 2, v.T.len / 2);
      const r = clamp(dx * -c + dz * s, -v.T.wid / 2, v.T.wid / 2);
      const hx = v.pos.x + s * f + -c * r, hz = v.pos.z + c * f + s * r;
      const d = Math.hypot(this.pos.x - hx, this.pos.z - hz);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  tryEnter() {
    const v = this.nearestVehicle();
    if (!v) return false;
    let dur = 0.45, kind = 'enter';
    if (v.driver && v.driver !== 'player') { dur = 0.95; kind = 'jack'; }
    else if (v.locked) { dur = 1.5; kind = 'break'; }
    this.state = 'entering'; this.stateT = 0; this.enterDur = dur; this.enterTarget = v; this.enterKind = kind;
    this.aiming = false;
    emit('enterStart', v, kind);
    return true;
  }
  finishEnter() {
    const v = this.enterTarget;
    this.enterTarget = null;
    if (!v || v.removed || v.destroyed || v.sunk || Math.hypot(v.pos.x - this.pos.x, v.pos.z - this.pos.z) > 7 + v.speed) { this.state = 'foot'; return; }
    const kind = this.enterKind;
    const prev = v.driver;
    if (prev && prev !== 'player') emit('driverEjected', v, prev);
    v.driver = 'player'; v.ai = null; v.locked = false; v.parked = false; v.traffic = false;
    if (!v.stolen && (kind !== 'enter' || v.isPolice)) emit('vehicleStolen', v, kind, prev);
    v.stolen = true;
    this.vehicle = v;
    this.state = 'foot';
    v.inThrottle = 0; v.inSteer = 0; v.inHandbrake = false;
    this.seat();
    emit('enteredVehicle', v, kind);
  }
  seat() {
    const v = this.vehicle;
    this.mv = null; this.standOn = null;
    if (v.T.open) {
      v.m.body.add(this.model);
      // hip joints just above the cushion, a little forward of its middle (towards the bars or the
      // wheel); a boat is driven standing at the helm
      const S = v.m.seat;
      if (v.cls === 'boat') this.model.position.set(S[0], S[1] - 0.93, S[2] + 0.28);
      else this.model.position.set(S[0], S[1] + 0.12 - (RIG.HIP_Y + RIG.THIGH_Y), S[2] + (v.T.bike || v.cls === 'hover' ? 0.1 : 0.12));
      this.model.rotation.set(0, 0, 0);
      this.model.scale.set(1, 1, 1);
      this.model.visible = true;
    } else this.model.visible = false;
  }
  leaveVehicle(forced = false) {
    const v = this.vehicle;
    if (!v) return;
    const speed = v.speed;
    this.vehicle = null;
    v.driver = null; v.inThrottle = 0; v.inSteer = 0; v.inNitro = false;
    v.lastUsed = G.time;
    G.scene.add(this.model);
    this.model.visible = true;
    // pick a free spot beside the car
    const tmp = new THREE.Vector3();
    let placed = false;
    for (const side of [-1, 1]) {
      v.doorPos(side, tmp);
      const hit = resolveCircle(tmp.x, tmp.z, 0.4, v.pos.y, out, 1.6);
      if (!hit || Math.hypot(out.x - tmp.x, out.z - tmp.z) < 0.5) { this.pos.set(out.x, v.pos.y, out.z); placed = true; break; }
    }
    if (!placed) this.pos.set(v.pos.x, v.pos.y + v.T.hgt + 0.2, v.pos.z);
    const g = groundHeight(this.pos.x, this.pos.z, v.pos.y + 2);
    // out of a helicopter: onto the roof or pad it stands on, or out of the door into the air
    const heli = v.cls === 'heli', air = heli && !v.onGround;
    if (heli) this.pos.y = v.pos.y + (air ? 0.6 : 0.05);
    else this.pos.y = v.cls === 'boat' ? Math.max(g, v.pos.y + 0.6) : Math.max(g, Math.min(this.pos.y, g + 2.5));
    this.heading = v.heading;
    this.vel.set(v.vel.x, air ? v.vel.y : 0, v.vel.z);
    emit('leftVehicle', v);
    if (air) {
      // jump clear of the door (and of the machine as it falls); a high bail-out opens the
      // parachute after a moment of free fall
      this.onGround = false;
      this.vel.x += Math.cos(v.heading) * 3; this.vel.z -= Math.sin(v.heading) * 3;
      this.clearOf = v; this.clearT = G.time + 3;
      if (v.agl > 18) { this.state = 'parachute'; this.stateT = 0; }
    } else if (!forced && speed > 9) {
      this.hurt((speed - 9) * 1.6, 'bail');
      if (this.alive) this.knockDown(v.vel.x * 0.8, 2.5, v.vel.z * 0.8, 1.2 + speed * 0.03);
    } else if (!forced) this.vel.multiplyScalar(0.3);
  }

  // ---- per-frame ---------------------------------------------------------------
  update(dt, t) {
    this.stateT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.punchT > 0) this.punchT -= dt;
    this.dodgeT = Math.max(0, this.dodgeT - dt);
    this.kickT = Math.max(0, this.kickT - dt);
    this.rollQueued = Math.max(0, this.rollQueued - dt);
    this.recoil = Math.max(0, this.recoil - dt * 6);
    // slow regeneration up to half health
    if (this.alive && this.health < 50 && t - this.lastHurt > 7) this.health = Math.min(50, this.health + dt * 2.5);

    if (this.vehicle) {
      this.driveInput(dt, t);
      // the body only shows on open vehicles (bikes, buggies, boats); otherwise only its heading is
      // kept current, so stepping out does not read as a sudden turn
      if (!this.vehicle || this.vehicle.T.open) this.anim.update(dt, t);
      else this.anim.lastH = this.heading;
      return;
    }

    switch (this.state) {
      case 'entering': {
        const v = this.enterTarget;
        if (v && !v.removed) {
          const d = v.doorPos(-1);
          const k = Math.min(1, dt * 6);
          this.pos.x += (d.x - this.pos.x) * k; this.pos.z += (d.z - this.pos.z) * k;
          this.heading += wrapAngle(Math.atan2(v.pos.x - this.pos.x, v.pos.z - this.pos.z) - this.heading) * k;
          if (this.enterKind === 'jack' && v.ai) { v.inThrottle = v.fwd > 0.5 ? -1 : 0; v.inHandbrake = true; v.ai.wait = 1; }
        }
        this.speed = 0;
        if (this.stateT >= this.enterDur) this.finishEnter();
        break;
      }
      case 'ragdoll':
        this.physics(dt, 0, 0, false, 0);
        this.stateT -= dt * 2; // counts down
        if (this.stateT <= 0 && this.onGround) { this.state = 'foot'; this.stateT = 0; }
        break;
      case 'dead': case 'busted':
        this.physics(dt, 0, 0, false, 0);
        break;
      case 'roll': case 'dodge': case 'slide': this.groundMove(dt); break;
      case 'vault': this.vaultUpdate(); break;
      case 'climb': this.climbUpdate(dt); break;
      case 'parachute': this.chuteUpdate(dt); break;
      default:
        this.footInput(dt, t);
    }
    if (this.vehicle) return;
    this.anim.update(dt, t);
  }

  // The direction the movement keys (or stick) point in the world, and how far they are pushed.
  moveDir(o) {
    const cam = G.cam;
    const mx = Input.axis('KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight');
    const mz = Input.axis('KeyS', 'KeyW', 'ArrowDown', 'ArrowUp');
    o.mag = Math.min(1, Math.hypot(mx, mz));
    if (o.mag < 0.01) { o.x = 0; o.z = 0; return o; }
    const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
    // camera forward (s,c); camera right (-c, s)
    let wx = s * mz + -c * mx, wz = c * mz + s * mx;
    const l = Math.hypot(wx, wz); wx /= l; wz /= l;
    o.x = wx; o.z = wz;
    return o;
  }

  footInput(dt, t) {
    const cam = G.cam, d = this.moveDir(_dir);
    const sprintKey = Input.any('ShiftLeft', 'ShiftRight');
    this.aiming = Input.mouse.right && !this.swimming;
    let want = 0;
    if (d.mag > 0.01) {
      want = this.swimming ? 2.7 : this.aiming ? 2.6 : sprintKey ? 7.8 : 4.6;
      // a gentle push of the touch stick walks
      want *= clamp((d.mag - 0.1) / 0.55, 0.35, 1);
    }
    this.sprinting = sprintKey && want > 5 && this.onGround && !this.swimming;
    if (this.aiming || G.weapons?.facingCamera) {
      this.heading += wrapAngle(cam.yaw - this.heading) * Math.min(1, dt * 16);
    } else if (want > 0) {
      this.heading += wrapAngle(Math.atan2(d.x, d.z) - this.heading) * Math.min(1, dt * (this.sprinting ? 8 : 11));
    }
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    // C: roll (a sidestep while aiming), or a slide out of a sprint; in the air it readies a break-fall
    if (Input.hit('KeyC') && !this.swimming) {
      if (!this.onGround) this.rollQueued = 0.6;
      else if (this.speed > 5.2 && (sprintKey || this.speed > 6.5)) return this.startSlide();
      else return this.startRoll(d.mag > 0.01 ? d.x : this.aiming ? -fx : fx, d.mag > 0.01 ? d.z : this.aiming ? -fz : fz);
    }
    let jump = false;
    if (Input.hit('Space')) {
      // Space: climb a ledge or vault what is in front, else jump; in the air, kick off a wall
      const ax = d.mag > 0.01 && !this.aiming ? d.x : fx, az = d.mag > 0.01 && !this.aiming ? d.z : fz;
      if (this.swimming) {
        const p = planClimb(this, fx, fz, null, false, 0.3, 2.6, 1.0);
        if (p) return this.startClimb(p);
      } else if (this.onGround) {
        const p = planClimb(this, ax, az) || planVault(this, ax, az, 1.15);
        if (p) return p.kind === 'vault' ? this.startVault(p) : this.startClimb(p);
        jump = true;
      } else if (!this.wallKicked && this.vel.x * fx + this.vel.z * fz > 1) {
        const w = wallAhead(this, fx, fz);
        if (w) this.wallKick(w);
      }
    }
    // holding Space in the air grabs a ledge within reach
    if (!this.onGround && !this.swimming && Input.key('Space') && this.vel.y < 3) {
      const p = planClimb(this, fx, fz, null, false, -0.2, 1.9, 0.7);
      if (p) return this.startClimb(p);
    }
    // sprinting into something low vaults it (looked for 20 times a second: well inside the reach)
    this.scan = (this.scan + 1) % 3;
    if (this.sprinting && this.speed > 5 && d.mag > 0.5 && !this.scan) {
      const p = planVault(this, fx, fz, 0.45 + this.speed * 0.08);
      if (p && p.kind === 'vault') return this.startVault(p);
    }
    this.physics(dt, d.x * want, d.z * want, jump);
    if (Input.hit('KeyF') || (Input.hit('KeyE') && !G.interact.active)) this.tryEnter();
  }

  // grip: how quickly the velocity follows the wanted one on the ground (0 = coasting). low: a
  // body near the ground (sliding) that passes under things.
  physics(dt, tvx, tvz, jump, grip = 11, low = false) {
    if (grip > 0) {
      const k = Math.min(1, dt * (this.onGround ? grip : 2.5));
      this.vel.x += (tvx - this.vel.x) * k; this.vel.z += (tvz - this.vel.z) * k;
    } else if (this.onGround) {
      const f = Math.max(0, 1 - dt * 3.5);
      this.vel.x *= f; this.vel.z *= f;
    }
    if (jump) { this.vel.y = 7.2; this.onGround = false; this.standOn = null; emit('playerJump'); }
    this.vel.y -= GRAV * dt;
    // riding on a car roof: carried along with it
    if (this.standOn && this.onGround) { this.pos.x += this.standOn.vel.x * dt; this.pos.z += this.standOn.vel.z * dt; }
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;

    // static geometry (the tops of low things can be stood on, see playerMoves)
    if (pushOut(this.pos.x, this.pos.z, 0.36, this.pos.y, low ? 0.8 : 1.7, out)) { this.pos.x = out.x; this.pos.z = out.z; }
    // vehicles are solid; fast ones hurt
    for (const v of G.vehicles) {
      if (v === this.standOn || (v === this.clearOf && G.time < this.clearT)) continue;
      const dx = this.pos.x - v.pos.x, dz = this.pos.z - v.pos.z;
      const rr = v.radius + 0.5;
      if (dx * dx + dz * dz > rr * rr) continue;
      if (this.pos.y > v.pos.y + v.T.hgt - 0.35 || this.pos.y + 1.7 < v.pos.y) continue;
      const s = Math.sin(v.heading), c = Math.cos(v.heading);
      for (let q = 0; q < 3; q++) {
        const cx = v.pos.x + s * v.cOff[q], cz = v.pos.z + c * v.cOff[q];
        const ex = this.pos.x - cx, ez = this.pos.z - cz;
        const r = v.cr + 0.34;
        const d2 = ex * ex + ez * ez;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 0.01;
        const along = (v.vel.x * ex + v.vel.z * ez) / d;
        if (v.speed > 5 && along > 3 && this.state !== 'ragdoll' && this.alive) {
          this.hurt(v.speed * 2.2, 'run over');
          if (this.alive) this.knockDown(v.vel.x * 0.8 + (ex / d) * 2, 3 + v.speed * 0.15, v.vel.z * 0.8 + (ez / d) * 2, 1.6);
          else this.vel.set(v.vel.x * 0.8, 4, v.vel.z * 0.8);
          emit('playerRunOver', v);
        }
        this.pos.x = cx + (ex / d) * r; this.pos.z = cz + (ez / d) * r;
      }
    }

    // ground (or a prop, roof or car top) and water
    const g = supportAt(this.pos.x, this.pos.z, this.pos.y, sup);
    const floatY = WATER_Y - 1.15;
    const deep = g < floatY - 0.15;
    if (deep && this.pos.y <= floatY + 0.05) {
      if (!this.swimming) emit('splash', this.pos.x, this.pos.z);
      this.swimming = true;
      this.pos.y = floatY; this.vel.y = 0; this.onGround = true; this.standOn = null;
    } else {
      this.swimming = false;
      if (this.pos.y <= g) {
        if (!this.onGround) this.land(-this.vel.y);
        this.pos.y = g; this.vel.y = 0; this.onGround = true; this.wallKicked = false;
        this.standOn = sup.vehicle;
      } else if (this.pos.y - g > 0.25) { this.onGround = false; this.standOn = null; }
    }
    this.speed = Math.hypot(this.vel.x, this.vel.z);
  }

  land(impact) {
    // a roll readied in the air (or a fast landing from a height) breaks the fall
    const roll = this.state === 'foot' && impact > 8 && (this.rollQueued > 0 || (impact > 12 && this.speed > 4.5));
    if (impact > 15) this.hurt((impact - 15) * (this.rollQueued > 0 ? 2 : 6), 'fall');
    if (impact > 3.5) { this.landSeq++; this.landImpact = impact; }
    if (impact > 5) { emit('playerLand'); if (impact > 9) this.dust(5); }
    if (roll && this.alive && this.state === 'foot') {
      const l = this.speed || 1;
      this.startRoll(this.speed > 0.5 ? this.vel.x / l : Math.sin(this.heading), this.speed > 0.5 ? this.vel.z / l : Math.cos(this.heading));
      this.landSeq--;   // the roll is the landing
    }
    this.rollQueued = 0;
  }
  dust(n) {
    if (!G.fx) return;
    const c = DUST[surfaceAt(this.pos.x, this.pos.z, this.pos.y)] || DUST.concrete;
    for (let i = 0; i < n; i++) G.fx.dust(this.pos.x, this.pos.y + 0.1, this.pos.z, c[0], c[1], c[2], 1.1);
  }

  // Under a parachute: the canopy fills over the first second, then a slow, steerable glide. A / D
  // turn, W speeds the glide up and S flares it; touching down (or water) ends it.
  chuteUpdate(dt) {
    const open = smoothstep(0.45, 1.3, this.stateT);
    const turn = Input.axis('KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'), trim = Input.axis('KeyS', 'KeyW', 'ArrowDown', 'ArrowUp');
    this.heading -= turn * 1.25 * open * dt;
    this.chuteTurn = turn * open;
    const glide = 7 + trim * 3.5, fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    // drag takes over from gravity as the canopy opens (physics() then takes gravity off again)
    this.vel.y += ((-4.6 + trim * 1.2) - this.vel.y) * Math.min(1, dt * 3 * open) + GRAV * dt * open;
    this.physics(dt, lerp(this.vel.x, fx * glide, open), lerp(this.vel.z, fz * glide, open), false, 4);
    if (this.onGround || this.swimming) {
      this.state = 'foot'; this.stateT = 0;
      this.vel.x *= 0.4; this.vel.z *= 0.4;
      emit('playerLand');
    }
  }

  // ---- moves ---------------------------------------------------------------------------------------
  startRoll(dx, dz) {
    const aim = this.aiming || G.weapons?.facingCamera;
    this.state = aim ? 'dodge' : 'roll'; this.stateT = 0;
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    // a sidestep keeps facing the target; how much of it is to the side or back, for the pose
    this.mv = { dx, dz, dur: aim ? 0.36 : 0.62, v0: Math.max(this.speed, aim ? 7.5 : 6.6), side: dx * fz - dz * fx, fwd: dx * fx + dz * fz };
    this.dodgeT = aim ? 0.34 : 0.5;
    emit('sfx', 'whoosh', this.pos.x, this.pos.z);
    this.dust(3);
  }
  startSlide() {
    const l = this.speed || 1;
    this.state = 'slide'; this.stateT = 0;
    this.mv = { dx: this.vel.x / l, dz: this.vel.z / l, v: Math.min(9.6, this.speed * 1.12), hit: null, rise: 0 };
    emit('sfx', 'whoosh', this.pos.x, this.pos.z);
  }
  // roll, sidestep and slide all run along the ground under their own speed
  groundMove(dt) {
    const mv = this.mv, st = this.state;
    const u = Math.min(1, this.stateT / (mv.dur || 1));
    if (st === 'slide') {
      // a little steering, friction, and anyone in the way gets swept off their feet
      const d = this.moveDir(_dir);
      if (d.mag > 0.3) {
        const turn = clamp(wrapAngle(Math.atan2(d.x, d.z) - Math.atan2(mv.dx, mv.dz)), -1.4 * dt, 1.4 * dt);
        const c = Math.cos(turn), s = Math.sin(turn), x = mv.dx;
        mv.dx = x * c + mv.dz * s; mv.dz = mv.dz * c - x * s;
      }
      mv.v = Math.max(0, mv.v - dt * 5.6);
      this.heading += wrapAngle(Math.atan2(mv.dx, mv.dz) - this.heading) * Math.min(1, dt * 12);
      this.physics(dt, mv.dx * mv.v, mv.dz * mv.v, false, 30, true);
      this.dustT -= dt;
      if (this.dustT <= 0 && this.onGround) { this.dustT = 0.06; this.dust(1); }
      if (G.peds && mv.v > 4) {
        const p = G.peds.nearest(this.pos.x + mv.dx * 0.6, this.pos.z + mv.dz * 0.6, 0.8, (q) => q !== mv.hit && q.state !== 'down' && Math.abs(q.pos.y - this.pos.y) < 1);
        if (p) {
          mv.hit = p;
          G.peds.knock(p, mv.dx * 3, 3, mv.dz * 3, 12, 'player');
          emit('sfx', 'punch', p.pos.x, p.pos.z);
          emit('crime', p.role === 'cop' ? 'assaultCop' : 'assault', p.pos.x, p.pos.z, p);
        }
      }
      // jump straight out of the slide, keeping the speed
      if (Input.hit('Space') && this.onGround && this.stateT > 0.12) { this.state = 'foot'; this.stateT = 0; this.mv = null; this.physics(0, this.vel.x, this.vel.z, true, 0); return; }
      // getting up takes a moment: the feet are drawn in under the body, then it rises
      if (!mv.rise && (mv.v < 2.8 || this.stateT > 1.15)) mv.rise = this.stateT;
      if ((mv.rise && this.stateT - mv.rise > 0.3) || (!this.onGround && this.stateT > 0.2)) this.endMove();
      return;
    }
    let v;
    if (st === 'roll') {
      v = lerp(mv.v0, 3.4, u);
      this.heading += wrapAngle(Math.atan2(mv.dx, mv.dz) - this.heading) * Math.min(1, dt * 22);
    } else {
      v = 1 + (mv.v0 - 1) * (1 - u) ** 1.4;
      this.heading += wrapAngle(G.cam.yaw - this.heading) * Math.min(1, dt * 16);
    }
    this.physics(dt, mv.dx * v, mv.dz * v, false, 30);
    if (u >= 1) this.endMove();
  }
  endMove() {
    this.state = 'foot'; this.stateT = 0; this.mv = null;
  }

  startVault(p) {
    this.state = 'vault'; this.stateT = 0; this.mv = p;
    this.heading = Math.atan2(p.dx, p.dz);
    this.vel.set(p.dx * p.exitSpeed, 0, p.dz * p.exitSpeed);
    this.onGround = false; this.standOn = null;
    emit('sfx', 'whoosh', this.pos.x, this.pos.z);
  }
  vaultUpdate() {
    const p = this.mv, u = Math.min(1, this.stateT / p.dur);
    const cl = p.top + 0.07;
    let y;
    if (u < p.uIn) y = p.sy + (cl - p.sy) * smoothstep(0, p.uIn, u);
    else if (u < p.uOut) y = cl + Math.sin(((u - p.uIn) / (p.uOut - p.uIn)) * Math.PI) * 0.06;
    else y = cl + (p.ey - cl) * ((u - p.uOut) / (1 - p.uOut)) ** 2;
    this.pos.set(lerp(p.sx, p.ex, u), y, lerp(p.sz, p.ez, u));
    this.speed = p.exitSpeed;
    if (u >= p.uOut && p.ey < p.sy - 1.2) {
      // vaulting a rail with a drop behind: let go and fall
      this.endMove(); this.onGround = false; this.vel.set(p.dx * p.exitSpeed * 0.8, 0, p.dz * p.exitSpeed * 0.8);
      return;
    }
    if (u >= 1) {
      this.endMove();
      this.pos.y = p.ey; this.onGround = true;
      this.landSeq++; this.landImpact = 5.5;
      if (p.veh) emit('sfx', 'thud', this.pos.x, this.pos.z);
    }
  }

  startClimb(p) {
    this.state = 'climb'; this.stateT = 0; this.mv = p;
    this.heading = p.heading;
    this.vel.set(0, 0, 0); this.speed = 0;
    this.onGround = false; this.standOn = null; this.swimming = false;
    p.grabbed = false;
    // a low mantle starts with the hands already on top
    if (p.kind === 'mantle') { p.hx = p.sx; p.hz = p.sz; }
    p.hangY = Math.max(p.sy, p.top - 1.95);
    p.pullY = Math.max(p.sy, p.top - 1.1);
  }
  climbUpdate(dt) {
    const p = this.mv, u = this.climbU();
    let x = p.hx, z = p.hz, y;
    if (u < 0.22) { const k = smoothstep(0, 0.22, u); x = lerp(p.sx, p.hx, k); z = lerp(p.sz, p.hz, k); y = lerp(p.sy, p.hangY, 1 - (1 - k) ** 2); }
    else if (u < 0.6) y = lerp(p.hangY, p.pullY, smoothstep(0.26, 0.6, u));
    else y = lerp(p.pullY, p.top, smoothstep(0.6, 0.78, u));
    if (u > 0.66) { const k = smoothstep(0.66, 0.9, u); x = lerp(p.hx, p.tx, k); z = lerp(p.hz, p.tz, k); }
    if (!p.grabbed && u > 0.2) { p.grabbed = true; emit('sfx', 'thud', x, z); }
    this.pos.set(x, y, z);
    this.speed = 0;
    if (this.stateT >= p.dur) {
      this.endMove();
      this.pos.set(p.tx, p.ty, p.tz); this.onGround = p.ty >= p.top - 0.01;
      // over a wall: keep going and drop down the far side
      if (p.over) this.vel.set(Math.sin(this.heading) * 2.5, 0, Math.cos(this.heading) * 2.5);
      supportAt(this.pos.x, this.pos.z, this.pos.y, sup);
      this.standOn = sup.vehicle;
    }
  }
  // progress through the climb; a low mantle skips the hang and the pull
  climbU() {
    const p = this.mv, u = Math.min(1, this.stateT / p.dur);
    return p.kind === 'mantle' ? 0.55 + 0.45 * u : u;
  }

  wallKick(w) {
    const nl = Math.hypot(w.nx, w.nz) || 1, nx = w.nx / nl, nz = w.nz / nl;
    const along = this.vel.x * -nz + this.vel.z * nx;
    this.vel.set(nx * 4.6 - nz * along * 0.6, 7.4, nz * 4.6 + nx * along * 0.6);
    this.heading = Math.atan2(this.vel.x, this.vel.z);
    this.kickT = 0.32; this.wallKicked = true;
    emit('playerJump');
  }

  driveInput(dt, t) {
    const v = this.vehicle;
    v.inThrottle = Input.axis('KeyS', 'KeyW', 'ArrowDown', 'ArrowUp');
    v.inSteer = Input.axis('KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight');
    v.inHandbrake = Input.key('Space');
    v.inNitro = Input.any('ShiftLeft', 'ShiftRight', 'KeyN');
    v.lastUsed = t;
    this.pos.copy(v.pos);
    this.heading = v.heading;
    this.speed = v.speed;
    if (Input.hit('KeyF') || (Input.hit('KeyE') && !G.interact.active)) this.leaveVehicle();
    else if (v.sunk || v.destroyed) this.leaveVehicle(true);
  }
}
const _dir = { x: 0, z: 0, mag: 0 };
