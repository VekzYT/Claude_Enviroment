// Shared steering/throttle logic for every AI-driven vehicle.
import { clamp, wrapAngle } from '../util/math.js';
import { segmentBlocked } from '../world/colliders.js';
import { terrainHeight } from '../world/roads.js';
import { WATER_Y } from '../world/layout.js';

// Steer v towards (tx, tz) aiming for wantSpeed (m/s).
// opts: arrive (slow down near the point), avoid (feel for walls), allowReverse, water (boat: stay off land)
export function driveToward(v, tx, tz, wantSpeed, dt, opts = {}) {
  const st = v.aiState || (v.aiState = { stuck: 0, reverse: 0, feel: 0, bias: 0, tick: (v.id * 7) % 5 });
  const dx = tx - v.pos.x, dz = tz - v.pos.z;
  const dist = Math.hypot(dx, dz);
  let desired = Math.atan2(dx, dz);

  // feel for obstacles a few times a second
  if (opts.avoid) {
    st.tick = (st.tick + 1) % 4;
    if (st.tick === 0) {
      const L = clamp(v.speed * 0.9, 7, 30);
      const y = v.pos.y + 0.8;
      const ray = (ang) => {
        const a = v.heading + ang;
        const ex = v.pos.x + Math.sin(a) * L, ez = v.pos.z + Math.cos(a) * L;
        if (segmentBlocked(v.pos.x, v.pos.z, ex, ez, y)) return true;
        if (opts.water) return WATER_Y - terrainHeight(ex, ez) < 0.6;
        if (opts.noWater) return terrainHeight(ex, ez) < WATER_Y - 0.5 && terrainHeight(v.pos.x + Math.sin(a) * L * 0.5, v.pos.z + Math.cos(a) * L * 0.5) < WATER_Y - 0.5 && !opts.bridgeOk?.(ex, ez);
        return false;
      };
      const c = ray(0), l = ray(0.5), r = ray(-0.5);
      if (c || l || r) {
        if (!l && (r || c)) st.bias = 0.9;
        else if (!r && (l || c)) st.bias = -0.9;
        else st.bias = st.bias >= 0 ? 1.3 : -1.3;
        st.feel = 0.5;
        st.blockedAhead = c && l && r;
      } else st.blockedAhead = false;
    }
    if (st.feel > 0) { st.feel -= dt; desired = v.heading + st.bias; }
  }

  const diff = wrapAngle(desired - v.heading); // + means the target is to the left
  let steer = clamp(-diff * 2.4, -1, 1);
  let throttle;
  const turnSlow = 1 - clamp((Math.abs(diff) - 0.15) / 1.3, 0, 0.78);
  let target = wantSpeed * turnSlow;
  if (opts.arrive) target = Math.min(target, Math.max(1.5, dist * 0.55));
  if (st.blockedAhead) target = Math.min(target, 4);

  // stuck recovery: back up and swing the nose round
  if (st.reverse > 0) {
    st.reverse -= dt;
    throttle = -0.8;
    steer = clamp(diff * 2.4, -1, 1);
  } else {
    const sp = v.fwd;
    if (opts.allowReverse && Math.abs(diff) > 2.3 && dist < 16 && Math.abs(sp) < 6) {
      throttle = -0.7; steer = clamp(diff * 2.4, -1, 1);
    } else if (sp < target - 0.8) throttle = 1;
    else if (sp > target + 2) throttle = -clamp((sp - target) / 7, 0.15, 1);
    else throttle = 0.22;
    if (throttle > 0.5 && Math.abs(v.fwd) < 0.8 && wantSpeed > 1) {
      st.stuck += dt;
      if (st.stuck > 1.1) { st.stuck = 0; st.reverse = 1.2 + Math.random() * 0.6; }
    } else st.stuck = Math.max(0, st.stuck - dt * 2);
  }
  v.inThrottle = throttle;
  v.inSteer = steer;
  v.inHandbrake = false;
  return dist;
}

export function stopVehicle(v) {
  v.inThrottle = v.fwd > 0.6 ? -1 : 0;
  v.inSteer = 0;
  v.inHandbrake = Math.abs(v.fwd) < 1.5;
}
