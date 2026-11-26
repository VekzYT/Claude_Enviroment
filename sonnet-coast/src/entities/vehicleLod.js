// Vehicle level of detail. Each vehicle is drawn in one of three tiers, by distance from the camera:
//   0 full   its own meshes (moving within ~40 m, parked within ~16 m, the player's ride, sirens)
//   1 rest   one instance of the type's full model merged into a single mesh (restGeometry), wheels at rest
//   2 proxy  beyond ~88 m, one instance of a low-poly stand-in (proxyGeometry)
// Instances take the vehicle's paint as their colour and its lamps (and brake lights) from a per-instance
// switch, and follow its own transform, so nothing moves when a vehicle changes tier. A street full of
// cars costs a few draw calls per type. The wheels of full-tier vehicles, every ground shadow and every
// night-time headlight pool are instanced here as well.
import * as THREE from 'three';
import { G, addPlugin, DETAIL_LAYER } from '../state.js';
import { VEHICLES, TRAFFIC_POOL } from './vehicleTypes.js';
import { proxyGeometry, restGeometry, wheelGeometry, riderCount, vehicleMats } from './vehicleMesh.js';
import { headlightBeamMaterial } from './vehicle.js';
import { makeBlobTexture } from '../world/textures.js';

const FAR = 88, FULL_MOVING = 40, FULL_PARKED = 16, HYST = 4;

// Standard (proxy) or physical with clear coat (rest) material reading the aProxy attribute (see vehicleMesh.js).
// iLight per instance: 1 = lamps on, +2 = braking.
function lodMaterial(physical) {
  const m = physical
    ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.25 })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3, envMapIntensity: 1.2 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'attribute vec4 aProxy;\nattribute float iLight;\nvarying vec4 vProxy;\nvarying float vLight;\nvoid main() {\n  vProxy = aProxy; vLight = iLight;')
      .replace('#include <color_vertex>', 'vColor = color;\n#ifdef USE_INSTANCING_COLOR\n  vColor *= mix(vec3(1.0), instanceColor, aProxy.z);\n#endif');
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'varying vec4 vProxy;\nvarying float vLight;\nvoid main() {')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  roughnessFactor = vProxy.x; metalnessFactor = vProxy.y;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  float lampsOn = mod(vLight, 2.0), braking = step(1.5, vLight);
  if (vProxy.w > 3.5) {}
  else if (vProxy.w > 2.5) totalEmissiveRadiance += diffuseColor.rgb * 1.4;
  else if (vProxy.w > 1.5) totalEmissiveRadiance += vec3(0.75, 0.04, 0.06) * (1.0 + 1.5 * lampsOn + 3.0 * braking);
  else if (vProxy.w > 0.5) totalEmissiveRadiance += vec3(2.2, 2.09, 1.87) * lampsOn;`);
    // tinted glass reflects about as much as the full model's (glassTint)
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
  if (vProxy.w > 3.5) {
    radiance *= 0.45;
#ifdef USE_CLEARCOAT
    clearcoatRadiance *= 0.45;
#endif
  }
#endif`);
    // the clear coat sits on the glossy parts only (paint, glass), as on the full model
    if (physical) sh.fragmentShader = sh.fragmentShader.replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n  material.clearcoat *= step(vProxy.x, 0.45);');
  };
  m.customProgramCacheKey = () => (physical ? 'vehicle-rest' : 'vehicle-proxy');
  return m;
}

// An instanced mesh refilled every frame, growing when it runs out of room.
class Pool {
  constructor(geo, mat, { shadow = false, order = 0, lamps = false } = {}) {
    // models carry a paint colour and a lamp switch per instance; wheels and ground decals neither
    this.geo = geo; this.mat = mat; this.shadow = shadow; this.order = order; this.lamps = lamps;
    this.cap = 0; this.n = 0; this.mesh = null;
  }
  grow() {
    const cap = Math.max(16, this.cap * 2), old = this.mesh;
    const im = new THREE.InstancedMesh(this.geo, this.mat, cap);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.lamps) {
      im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
      im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      const a = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
      a.setUsage(THREE.DynamicDrawUsage);
      if (old) a.array.set(this.geo.getAttribute('iLight').array);
      this.geo.setAttribute('iLight', a);
    }
    if (old) {
      im.instanceMatrix.array.set(old.instanceMatrix.array);
      if (this.lamps) im.instanceColor.array.set(old.instanceColor.array);
      G.scene.remove(old); old.dispose();
    }
    im.frustumCulled = false;   // culled per instance in update()
    im.castShadow = this.shadow; im.receiveShadow = this.shadow;
    im.renderOrder = this.order;
    im.layers.set(DETAIL_LAYER);
    im.count = 0; im.visible = false;
    G.scene.add(im);
    this.mesh = im; this.cap = cap;
  }
  // a ground decal under the vehicle's transform e: lifted by ty, pushed forward by tz, scaled by sx, sz
  // (the product e * translate * scale, written out)
  decal(e, ty, tz, sx, sz) {
    if (this.n >= this.cap) this.grow();
    const a = this.mesh.instanceMatrix.array, o = this.n++ * 16;
    a[o] = e[0] * sx; a[o + 1] = e[1] * sx; a[o + 2] = e[2] * sx; a[o + 3] = 0;
    a[o + 4] = e[4]; a[o + 5] = e[5]; a[o + 6] = e[6]; a[o + 7] = 0;
    a[o + 8] = e[8] * sz; a[o + 9] = e[9] * sz; a[o + 10] = e[10] * sz; a[o + 11] = 0;
    a[o + 12] = e[12] + e[4] * ty + e[8] * tz; a[o + 13] = e[13] + e[5] * ty + e[9] * tz; a[o + 14] = e[14] + e[6] * ty + e[10] * tz; a[o + 15] = 1;
  }
  push(matrix, color, light = 0) {
    if (this.n >= this.cap) this.grow();
    const i = this.n++;
    this.mesh.setMatrixAt(i, matrix);
    if (this.lamps) { this.mesh.setColorAt(i, color); this.geo.getAttribute('iLight').array[i] = light; }
  }
  end() {
    const m = this.mesh;
    if (!m) return;
    m.count = this.n; m.visible = this.n > 0;
    if (this.n) {
      m.instanceMatrix.needsUpdate = true;
      if (this.lamps) { m.instanceColor.needsUpdate = true; this.geo.getAttribute('iLight').needsUpdate = true; }
    }
    this.n = 0;
  }
}

const _m = new THREE.Matrix4(), _pm = new THREE.Matrix4();
const _fr = new THREE.Frustum(), _sph = new THREE.Sphere();

class VehicleLod {
  constructor() {
    this.mats = [lodMaterial(false), lodMaterial(true)];
    this.pools = new Map();   // type -> { r, p, w, r0, p0, ... }: rest / proxy, then with rider look k seated, and wheels
    const quad = new THREE.PlaneGeometry(1, 1);
    quad.rotateX(-Math.PI / 2);
    const blobMat = new THREE.MeshBasicMaterial({ map: makeBlobTexture(), transparent: true, depthWrite: false, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 });
    this.blobs = new Pool(quad, blobMat, { order: 2 });
    const beam = headlightBeamMaterial();
    G.env.nightLerp(beam, 'opacity', 0, 0.3);
    this.beams = new Pool(quad, beam, { order: 2 });
    // build everything traffic drives up front (with its riders), so the first one to show does not hitch
    this.all = [this.blobs, this.beams];
    for (const id of new Set([...TRAFFIC_POOL, 'bus', 'police', 'policeOffroad', 'swat'])) {
      const T = VEHICLES[id], riders = riderCount(T);
      for (const kind of ['r', 'p']) for (let k = -1; k < riders; k++) this.pool(kind, T, k);
    }
  }
  pool(kind, T, rider = -1) {
    let set = this.pools.get(T);
    if (!set) this.pools.set(T, (set = {}));
    const key = rider >= 0 ? kind + rider : kind;
    let p = set[key];
    if (!p) {
      if (kind === 'w') p = new Pool(wheelGeometry(T), vehicleMats().wheel, { shadow: true });
      else p = new Pool(kind === 'r' ? restGeometry(T, rider) : proxyGeometry(T, rider), this.mats[kind === 'r' ? 1 : 0], { shadow: true, lamps: true });
      set[key] = p;
      this.all.push(p);
    }
    return p;
  }
  tier(v, d) {
    // helicopters have no merged or proxy models (heli.js hides their small parts at a distance)
    if (v === G.player.vehicle || v.sirenOn || v.cls === 'heli') return 0;
    const cur = v.lod || 0;
    if (d > (cur === 2 ? FAR - HYST * 3 : FAR)) return 2;
    const near = v.m.under ? FAR : v.asleep ? FULL_PARKED : FULL_MOVING;   // underglow only on the full model
    return d > near + (cur ? -HYST : HYST) ? 1 : 0;
  }
  seen(x, y, z, r) {
    _sph.center.set(x, y + 1, z); _sph.radius = r;
    return _fr.intersectsSphere(_sph);
  }
  update() {
    const cam = G.camera, cp = cam.position, mine = G.player.vehicle, t = G.time;
    cam.updateMatrixWorld();
    _fr.setFromProjectionMatrix(_pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    for (const v of G.vehicles) {
      const m = v.m, T = v.T;
      const d = Math.sqrt((v.pos.x - cp.x) ** 2 + (v.pos.z - cp.z) ** 2);
      const lod = this.tier(v, d);
      if (lod !== (v.lod || 0)) {
        v.lod = lod; v.proxied = lod > 0;
        v.mesh.visible = lod === 0;
        if (!lod) v.syncMesh(0, t);   // catch the lamps and wheels up before it shows
      }
      const npc = !!v.driver && v.driver !== 'player' && !v.destroyed;
      if (m.rider) m.rider.visible = npc && !lod;
      // the turning wheels of the full tier are drawn from the pool below
      if (m.wheels.length && m.wheels[0].mesh.visible) for (const w of m.wheels) w.mesh.visible = false;
      // out of view: nothing to draw (a margin keeps shadows cast into view)
      if (!this.seen(v.pos.x, v.pos.y, v.pos.z, T.len * 0.5 + (lod === 2 ? 4 : 9))) continue;
      if (!v.asleep) v.mesh.updateMatrix();   // a sleeping vehicle has not moved
      const M = v.mesh.matrix;
      if (lod) {
        const braking = npc && ((v.inThrottle < -0.1 && v.fwd > 1) || v.inHandbrake);
        this.pool(lod === 1 ? 'r' : 'p', T, npc && m.rider ? m.riderIdx : -1).push(M, m.paintMat.color, (v.lightsOn && !v.destroyed ? 1 : 0) + (braking ? 2 : 0));
      } else if (m.wheels.length && m.wheels[0].pivot.visible) {
        const wp = this.pool('w', T);
        for (const w of m.wheels) {
          w.pivot.updateMatrix(); w.mesh.updateMatrix();
          wp.push(_m.multiplyMatrices(M, w.pivot.matrix).multiply(w.mesh.matrix));
        }
      }
      if (v.sunk || v.cls === 'boat' || v.hideBlob) continue;
      const gy = (v.groundY ?? v.pos.y) - v.pos.y;
      this.blobs.decal(M.elements, gy + 0.06, 0, T.wid * 1.7, T.len * 1.35);
      if (v.lightsOn && !v.destroyed && v !== mine) this.beams.decal(M.elements, gy + 0.07, T.len / 2 + 6.5, T.wid * 3.6, 15);
    }
    for (const p of this.all) p.end();
  }
}

addPlugin({
  init() { G.vehicleLod = new VehicleLod(); },
  lateUpdate() { G.vehicleLod.update(); },
});
