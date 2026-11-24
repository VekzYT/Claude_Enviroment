// One big animated water plane. Colour comes from a baked depth/biome map so the sea is
// turquoise in the shallows, deep blue offshore and murky green in the bayou.
import * as THREE from 'three';
import { WORLD_MIN, WORLD_MAX, WATER_Y } from './layout.js';
import { rawHeight, swampMask, riverDist, forestMask } from './terrain.js';
import { smoothstep, lerp, clamp } from '../util/math.js';

export function buildWater(scene) {
  const S = 384;
  const data = new Uint8Array(S * S * 4);
  const size = WORLD_MAX - WORLD_MIN;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const x = WORLD_MIN + ((i + 0.5) / S) * size, z = WORLD_MIN + ((j + 0.5) / S) * size;
    const h = rawHeight(x, z);
    const depth = clamp(-h, 0, 14);
    const shallow = smoothstep(3.5, 0, depth);
    // sea
    let r = lerp(0.02, 0.10, shallow), g = lerp(0.20, 0.62, shallow), b = lerp(0.36, 0.62, shallow);
    const sw = Math.max(smoothstep(0.12, 0.5, swampMask(x, z)), smoothstep(100, 34, riverDist(x, z)) * (1 - forestMask(x, z) * 0.5));
    if (sw > 0) {
      const k = clamp(sw, 0, 1);
      r = lerp(r, 0.10, k); g = lerp(g, 0.19, k); b = lerp(b, 0.11, k);
    }
    const o = (j * S + i) * 4;
    data[o] = r * 255; data[o + 1] = g * 255; data[o + 2] = b * 255;
    data[o + 3] = smoothstep(0.9, 0.0, depth) * (1 - clamp(sw, 0, 1) * 0.8) * 255; // foam
  }
  const map = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  map.magFilter = map.minFilter = THREE.LinearFilter;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  map.needsUpdate = true;

  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uMap: { value: null },
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunColor: { value: new THREE.Color(1, 1, 1) },
      uSkyColor: { value: new THREE.Color(0.5, 0.7, 0.9) },
      uHorizon: { value: new THREE.Color(0.8, 0.8, 0.9) },
      uAmbient: { value: 1 },
      uWorld: { value: new THREE.Vector2(WORLD_MIN, size) },
    },
  ]);
  uniforms.uMap.value = map;

  const mat = new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    vertexShader: /* glsl */`
      #include <common>
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vCityPos = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      uniform sampler2D uMap;
      uniform float uTime, uAmbient;
      uniform vec3 uSunDir, uSunColor, uSkyColor, uHorizon;
      uniform vec2 uWorld;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      float waves(vec2 p) {
        float t = uTime;
        float h = 0.0;
        h += vnoise(p * 0.08 + vec2(t * 0.25, t * 0.11)) * 0.6;
        h += vnoise(p * 0.21 - vec2(t * 0.31, -t * 0.17)) * 0.3;
        h += vnoise(p * 0.63 + vec2(-t * 0.5, t * 0.42)) * 0.1;
        return h;
      }
      void main() {
        vec2 uv = (vWorld.xz - uWorld.x) / uWorld.y;
        vec4 m = texture2D(uMap, clamp(uv, 0.0, 1.0));
        float outside = step(1.0, max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0);
        vec3 base = mix(m.rgb, vec3(0.02, 0.20, 0.36), outside);
        vec2 p = vWorld.xz;
        float e = 0.6;
        float h0 = waves(p), hx = waves(p + vec2(e, 0.0)), hz = waves(p + vec2(0.0, e));
        vec3 n = normalize(vec3((h0 - hx) * 1.6, 1.0, (h0 - hz) * 1.6));
        vec3 v = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 col = base * (0.35 + 0.75 * uAmbient);
        vec3 refl = mix(uHorizon, uSkyColor, clamp(reflect(-v, n).y * 1.6, 0.0, 1.0));
        col = mix(col, refl, fres * 0.6);
        vec3 hv = normalize(uSunDir + v);
        float spec = pow(max(dot(n, hv), 0.0), 180.0);
        col += uSunColor * spec * 1.6;
        float foam = m.a * (1.0 - outside);
        float f = smoothstep(0.55, 0.95, foam + (h0 - 0.5) * 0.5) * 0.7;
        col = mix(col, vec3(0.92, 0.96, 0.96) * (0.12 + 0.88 * uAmbient), f);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const geo = new THREE.PlaneGeometry(9000, 9000, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = WATER_Y;
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { mesh, uniforms };
}
