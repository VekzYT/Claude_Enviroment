// Props that can be knocked over by vehicles (street lights, palms, signs).
import * as THREE from 'three';
import { removeCollider } from './colliders.js';

export const breakables = [];
const falling = [];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q0 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _ax = new THREE.Vector3();

export function registerBreakable(b) {
  b.collider.breakIdx = breakables.length;
  b.collider.breakMin = b.minSpeed ?? 6;
  breakables.push(b);
  return b;
}

// Knock a prop over in direction (dx, dz). Returns true if it broke.
export function breakProp(idx, dx, dz) {
  const b = breakables[idx];
  if (!b || b.broken) return false;
  b.broken = true;
  removeCollider(b.collider);
  if (b.onBreak) b.onBreak(b);
  const len = Math.hypot(dx, dz) || 1;
  b.dx = dx / len; b.dz = dz / len;
  b.t = 0;
  // remember base transforms
  b.base = b.fall.map((ref) => {
    const m = new THREE.Matrix4();
    ref.bucket.mesh.getMatrixAt(ref.index, m);
    return m;
  });
  for (const ref of b.hide) {
    ref.bucket.mesh.getMatrixAt(ref.index, _m);
    _m.decompose(_p, _q, _s);
    _m.compose(_p, _q, _s.set(0, 0, 0));
    ref.bucket.mesh.setMatrixAt(ref.index, _m);
    ref.bucket.mesh.instanceMatrix.needsUpdate = true;
  }
  falling.push(b);
  return true;
}

export function updateBreakables(dt) {
  for (let i = falling.length - 1; i >= 0; i--) {
    const b = falling[i];
    b.t = Math.min(1, b.t + dt * 1.8);
    const ease = b.t * b.t;
    const ang = ease * 1.5;
    _ax.set(b.dz, 0, -b.dx);
    _q.setFromAxisAngle(_ax, ang);
    b.fall.forEach((ref, k) => {
      b.base[k].decompose(_p, _q0, _s);
      _q0.premultiply(_q);
      _m.compose(_p, _q0, _s);
      ref.bucket.mesh.setMatrixAt(ref.index, _m);
      ref.bucket.mesh.instanceMatrix.needsUpdate = true;
    });
    if (b.t >= 1) falling.splice(i, 1);
  }
}
