// Floating status badges above tiles with problems: one instanced billboard draw, bobbing and
// cycling through a tile's problems in the shader so the CPU only touches them when flags change.
import * as THREE from 'three';
import type { GameState } from '../core/types';
import { Problem, TileKind } from '../core/types';

const CELL = 128;
const COLS = 4;
const ROWS = 2;

// atlas slots
const ICON_POWER = 0;
const ICON_WATER = 1;
const ICON_ROAD = 2;
const ICON_SMOG = 3;
const ICON_WARN = 4;

/** Priority order when a tile has several problems (first shown first). */
const ORDER: Array<[number, number]> = [
  [Problem.Inactive, ICON_WARN],
  [Problem.NoRoad, ICON_ROAD],
  [Problem.NoPower, ICON_POWER],
  [Problem.NoWater, ICON_WATER],
  [Problem.Polluted, ICON_SMOG],
];

function drawBadge(g: CanvasRenderingContext2D, cx: number, cy: number, ring: string, draw: (g: CanvasRenderingContext2D) => void): void {
  const r = CELL * 0.4;
  // soft drop shadow
  g.save();
  g.fillStyle = 'rgba(20, 30, 50, 0.35)';
  g.beginPath();
  g.arc(cx, cy + 5, r + 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // white rim, coloured disc
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(cx, cy, r + 3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = ring;
  g.beginPath();
  g.arc(cx, cy, r - 4, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.translate(cx, cy);
  draw(g);
  g.restore();
}

function createIconAtlas(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = CELL * COLS;
  c.height = CELL * ROWS;
  const g = c.getContext('2d')!;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const at = (k: number): [number, number] => [(k % COLS) * CELL + CELL / 2, Math.floor(k / COLS) * CELL + CELL / 2 - 2];

  // no power: a lightning bolt
  drawBadge(g, ...at(ICON_POWER), '#f5a300', (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(6, -34);
    g.lineTo(-18, 4);
    g.lineTo(-2, 4);
    g.lineTo(-8, 34);
    g.lineTo(18, -6);
    g.lineTo(2, -6);
    g.closePath();
    g.fill();
  });
  // no water: a drop
  drawBadge(g, ...at(ICON_WATER), '#2b8cf0', (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(0, -32);
    g.bezierCurveTo(10, -16, 22, -2, 22, 10);
    g.arc(0, 10, 22, 0, Math.PI, false);
    g.bezierCurveTo(-22, -2, -10, -16, 0, -32);
    g.fill();
    g.fillStyle = 'rgba(43,140,240,0.55)';
    g.beginPath();
    g.ellipse(-8, 10, 5, 9, -0.3, 0, Math.PI * 2);
    g.fill();
  });
  // no road: a little road sign on a post
  drawBadge(g, ...at(ICON_ROAD), '#ef6a2e', (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(-3, -4, 6, 34);
    g.beginPath();
    g.moveTo(0, -34);
    g.lineTo(22, -12);
    g.lineTo(0, 10);
    g.lineTo(-22, -12);
    g.closePath();
    g.fill();
    g.fillStyle = '#ef6a2e';
    g.fillRect(-2, -24, 4, 7);
    g.fillRect(-2, -13, 4, 7);
    g.fillRect(-2, -2, 4, 5);
  });
  // polluted: a grey-brown smog cloud
  drawBadge(g, ...at(ICON_SMOG), '#7d6a8c', (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(-12, 4, 13, 0, Math.PI * 2);
    g.arc(4, -6, 16, 0, Math.PI * 2);
    g.arc(16, 6, 11, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-24, 4, 44, 13);
    g.strokeStyle = '#7d6a8c';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(-14, 26);
    g.quadraticCurveTo(-6, 20, 2, 26);
    g.quadraticCurveTo(10, 32, 18, 26);
    g.stroke();
  });
  // not working: a warning triangle
  drawBadge(g, ...at(ICON_WARN), '#e5383b', (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(0, -30);
    g.lineTo(28, 22);
    g.lineTo(-28, 22);
    g.closePath();
    g.fill();
    g.fillStyle = '#e5383b';
    g.fillRect(-3.5, -12, 7, 20);
    g.beginPath();
    g.arc(0, 15, 4, 0, Math.PI * 2);
    g.fill();
  });

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}

/** Camera distances at which badges merge into 2×2, then 4×4 tile blocks. */
const LOD_NEAR = 22;
const LOD_FAR = 46;

const VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec4 aIcons;
attribute float aCount;
attribute float aLod;
uniform float uTime;
uniform float uLod;
varying vec2 vUv;
void main() {
  // each badge belongs to one level of detail (−1 = every level); others collapse off-screen
  if (aLod > -0.5 && abs(aLod - uLod) > 0.5) {
    gl_Position = vec4(0.0, 0.0, -2.0, 1.0);
    vUv = vec2(0.0);
    return;
  }
  float phase = fract(sin(dot(aPos.xz, vec2(12.9898, 78.233))) * 43758.5453);
  // several problems take turns, about two seconds each
  float k = mod(floor(uTime * 0.5 + phase * 3.0), max(aCount, 1.0));
  float icon = k < 0.5 ? aIcons.x : (k < 1.5 ? aIcons.y : (k < 2.5 ? aIcons.z : aIcons.w));
  vec3 wp = aPos + vec3(0.0, 0.07 * sin(uTime * 2.4 + phase * 6.2831), 0.0);
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  // keep badges readable when zoomed out: grow with distance, within limits
  float size = clamp(-mv.z * 0.036, 0.5, 2.2);
  mv.xy += position.xy * size;
  gl_Position = projectionMatrix * mv;
  vec2 cell = vec2(mod(icon, ${COLS}.0), floor(icon / ${COLS}.0));
  vUv = (vec2(uv.x, 1.0 - uv.y) + cell) / vec2(${COLS}.0, ${ROWS}.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.05) discard;
  gl_FragColor = c;
  #include <colorspace_fragment>
}`;

/**
 * Badges come in three levels of detail inside one draw: one per tile up close, one per 2×2 block
 * at mid zoom and one per 4×4 block far out (problems merged), so a district short of water shows
 * a handful of drops instead of a carpet of them. Placed buildings always keep their own badge.
 */
export class IconLayer {
  readonly mesh: THREE.Mesh;
  private readonly geo: THREE.InstancedBufferGeometry;
  private readonly mat: THREE.ShaderMaterial;
  private aPos: THREE.InstancedBufferAttribute;
  private aIcons: THREE.InstancedBufferAttribute;
  private aCount: THREE.InstancedBufferAttribute;
  private aLod: THREE.InstancedBufferAttribute;
  private cap = 0;
  private written = 0;
  readonly uniforms = { uTime: { value: 0 }, uLod: { value: 1 }, uMap: { value: null as THREE.Texture | null } };

  constructor() {
    const quad = new THREE.PlaneGeometry(1, 1);
    this.geo = new THREE.InstancedBufferGeometry();
    this.geo.index = quad.index;
    this.geo.setAttribute('position', quad.getAttribute('position'));
    this.geo.setAttribute('uv', quad.getAttribute('uv'));
    this.uniforms.uMap.value = createIconAtlas();
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(0), 3);
    this.aIcons = new THREE.InstancedBufferAttribute(new Float32Array(0), 4);
    this.aCount = new THREE.InstancedBufferAttribute(new Float32Array(0), 1);
    this.aLod = new THREE.InstancedBufferAttribute(new Float32Array(0), 1);
    this.ensure(256);
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 20;
    this.mesh.name = 'status-icons';
    this.geo.instanceCount = 0;
  }

  private ensure(n: number): void {
    if (n <= this.cap) return;
    this.cap = Math.max(n, this.cap * 2);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(this.cap * 3), 3);
    this.aIcons = new THREE.InstancedBufferAttribute(new Float32Array(this.cap * 4), 4);
    this.aCount = new THREE.InstancedBufferAttribute(new Float32Array(this.cap), 1);
    this.aLod = new THREE.InstancedBufferAttribute(new Float32Array(this.cap), 1);
    this.geo.setAttribute('aPos', this.aPos);
    this.geo.setAttribute('aIcons', this.aIcons);
    this.geo.setAttribute('aCount', this.aCount);
    this.geo.setAttribute('aLod', this.aLod);
  }

  /** Write one badge (skipped if none of its flags has an icon). */
  private put(x: number, y: number, z: number, flags: number, lod: number): void {
    const k = this.written;
    const ic = this.aIcons.array as Float32Array;
    let m = 0;
    for (let o = 0; o < ORDER.length && m < 4; o++) {
      if (flags & ORDER[o][0]) ic[k * 4 + m++] = ORDER[o][1];
    }
    if (m === 0) return;
    for (let r = m; r < 4; r++) ic[k * 4 + r] = ic[k * 4];
    const pos = this.aPos.array as Float32Array;
    pos[k * 3] = x;
    pos[k * 3 + 1] = y;
    pos[k * 3 + 2] = z;
    (this.aCount.array as Float32Array)[k] = m;
    (this.aLod.array as Float32Array)[k] = lod;
    this.written++;
  }

  /** Rebuild badges from tiles.problems (on rev.derived). heightAt gives the model height per tile. */
  rebuild(state: GameState, heightAt: (i: number) => number): void {
    const size = state.size;
    const n = size * size;
    const t = state.tiles;
    this.ensure(n + Math.ceil(size / 2) ** 2 + Math.ceil(size / 4) ** 2 + 4);
    this.written = 0;
    const seenBld = new Set<number>();

    // placed buildings (every level of detail) and single lots (closest level)
    for (let i = 0; i < n; i++) {
      const flags = t.problems[i];
      if (!flags) continue;
      if (t.kind[i] === TileKind.Building) {
        const id = t.bld[i];
        if (seenBld.has(id)) continue;
        seenBld.add(id);
        const b = id >= 0 ? state.buildings[id] : null;
        const x = b ? b.x + b.w / 2 : (i % size) + 0.5;
        const z = b ? b.z + b.h / 2 : ((i / size) | 0) + 0.5;
        this.put(x, heightAt(i) + 0.45, z, flags, -1);
      } else {
        this.put((i % size) + 0.5, heightAt(i) + 0.42, ((i / size) | 0) + 0.5, flags, 0);
      }
    }
    // merged blocks: problems of all lots in the block, over the middle of the troubled ones
    for (let lod = 1; lod <= 2; lod++) {
      const B = lod === 1 ? 2 : 4;
      for (let bz = 0; bz < size; bz += B) {
        for (let bx = 0; bx < size; bx += B) {
          let flags = 0;
          let cnt = 0;
          let sx = 0;
          let sz = 0;
          let top = 0;
          for (let z = bz; z < Math.min(size, bz + B); z++) {
            for (let x = bx; x < Math.min(size, bx + B); x++) {
              const i = z * size + x;
              const f = t.problems[i];
              if (!f || t.kind[i] === TileKind.Building) continue;
              flags |= f;
              cnt++;
              sx += x + 0.5;
              sz += z + 0.5;
              top = Math.max(top, heightAt(i));
            }
          }
          if (cnt) this.put(sx / cnt, top + 0.42, sz / cnt, flags, lod);
        }
      }
    }
    this.geo.instanceCount = this.written;
    this.mesh.visible = this.written > 0;
    this.aPos.needsUpdate = true;
    this.aIcons.needsUpdate = true;
    this.aCount.needsUpdate = true;
    this.aLod.needsUpdate = true;
  }

  /** Per frame: animation time, and which level of detail fits the camera distance. */
  update(time: number, viewDistance: number): void {
    this.uniforms.uTime.value = time;
    this.uniforms.uLod.value = viewDistance < LOD_NEAR ? 0 : viewDistance < LOD_FAR ? 1 : 2;
  }

  dispose(): void {
    this.geo.dispose();
    this.mat.dispose();
    this.uniforms.uMap.value?.dispose();
  }
}
