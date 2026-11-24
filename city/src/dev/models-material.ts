// DEV ONLY. The world's model material (render/materials.ts glow patch) copied for the models
// harnesses, so they do not depend on the world module while it is being edited, plus a helper that
// joins body and glow geometry with an aGlow attribute like render/instances.ts combineParts.
import * as THREE from 'three';

export interface GlowUniforms {
  uNight: { value: number };
  uGlass: { value: THREE.Color };
  uGlowBoost: { value: number };
}

export function modelMaterial(u: GlowUniforms): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = u.uNight;
    shader.uniforms.uGlass = u.uGlass;
    shader.uniforms.uGlowBoost = u.uGlowBoost;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aGlow;\nvarying float vGlow;\nvarying float vLit;\nuniform float uNight;`)
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
vGlow = aGlow;
float glowTh = 0.18;
float glowLvl = 1.0;
#ifdef USE_INSTANCING
  vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
  float gh = fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453);
  glowTh = 0.05 + gh * 0.5;
  glowLvl = 0.7 + 0.3 * fract(gh * 7.31);
#endif
vLit = smoothstep(glowTh, glowTh + 0.15, uNight) * glowLvl;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vGlow;\nvarying float vLit;\nuniform vec3 uGlass;\nuniform float uGlowBoost;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 glowLitCol = diffuseColor.rgb;
diffuseColor.rgb = mix(diffuseColor.rgb, mix(uGlass, glowLitCol * 0.2, vLit), vGlow);`,
      )
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += glowLitCol * (vGlow * vLit * uGlowBoost);`);
  };
  mat.customProgramCacheKey = () => 'gallery-glow';
  return mat;
}

/** body + glow in one geometry with aGlow, like render/instances.ts combineParts. */
export function combine(body: THREE.BufferGeometry, glow: THREE.BufferGeometry | null): THREE.BufferGeometry {
  const list: Array<[THREE.BufferGeometry, number]> = [[body, 0]];
  if (glow) list.push([glow, 1]);
  let n = 0;
  for (const [g] of list) n += g.getAttribute('position').count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const gl = new Float32Array(n);
  let o = 0;
  for (const [g, f] of list) {
    const c = g.getAttribute('position').count;
    pos.set(g.getAttribute('position').array as Float32Array, o * 3);
    nor.set(g.getAttribute('normal').array as Float32Array, o * 3);
    col.set(g.getAttribute('color').array as Float32Array, o * 3);
    gl.fill(f, o, o + c);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
  return out;
}
