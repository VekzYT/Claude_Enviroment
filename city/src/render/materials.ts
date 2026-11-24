// Materials shared across the world: the model material (body + glow parts in one draw) and the
// animated water. Both are stock three.js materials patched with onBeforeCompile, so they keep
// lighting, shadows and fog for free.
import * as THREE from 'three';

export interface ModelUniforms {
  /** 0 by day, 1 at night (state.timeOfDay → nightAmount). */
  uNight: { value: number };
  /** Colour of unlit window glass (follows the sky a little). */
  uGlass: { value: THREE.Color };
  /** How bright lit windows are. */
  uGlowBoost: { value: number };
}

export function createModelUniforms(): ModelUniforms {
  return {
    uNight: { value: 0 },
    uGlass: { value: new THREE.Color('#33496a') },
    uGlowBoost: { value: 1.25 },
  };
}

/**
 * Patch a Lambert material so vertices with aGlow = 1 are window glass by day and glow with their
 * vertex colour at night. Each instance lights up at a slightly different moment as dusk falls,
 * and at a slightly different brightness, so a night city does not look like one switch.
 */
export function applyGlowPatch(mat: THREE.MeshLambertMaterial, u: ModelUniforms): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = u.uNight;
    shader.uniforms.uGlass = u.uGlass;
    shader.uniforms.uGlowBoost = u.uGlowBoost;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aGlow;
varying float vGlow;
varying float vLit;
uniform float uNight;`,
      )
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
      .replace(
        '#include <common>',
        `#include <common>
varying float vGlow;
varying float vLit;
uniform vec3 uGlass;
uniform float uGlowBoost;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec3 glowLitCol = diffuseColor.rgb;
diffuseColor.rgb = mix(diffuseColor.rgb, mix(uGlass, glowLitCol * 0.2, vLit), vGlow);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance += glowLitCol * (vGlow * vLit * uGlowBoost);`,
      );
  };
  mat.customProgramCacheKey = () => 'cubopolis-glow';
}

export function createModelMaterial(u: ModelUniforms): THREE.MeshLambertMaterial {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  applyGlowPatch(mat, u);
  return mat;
}

export interface WaterUniforms {
  uTime: { value: number };
  uMask: { value: THREE.Texture | null };
  uSize: { value: number };
  uDeep: { value: THREE.Color };
  uShallow: { value: THREE.Color };
  uFoam: { value: THREE.Color };
  uNight: { value: number };
}

export function createWaterUniforms(): WaterUniforms {
  return {
    uTime: { value: 0 },
    uMask: { value: null },
    uSize: { value: 64 },
    uDeep: { value: new THREE.Color('#2e86d4') },
    uShallow: { value: new THREE.Color('#5fd0e6') },
    uFoam: { value: new THREE.Color('#effcff') },
    uNight: { value: 0 },
  };
}

/**
 * Water: one flat sheet across the map, hidden under land by the depth test. Colour comes from a
 * land mask texture (linear filtered, so shallows and foam hug the shore smoothly), quantised to
 * 16 texels per tile so the shimmer matches the pixel-art ground.
 */
export function createWaterMaterial(u: WaterUniforms): THREE.MeshPhongMaterial {
  const mat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: new THREE.Color('#3c4652'),
    shininess: 140,
    transparent: true,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vWPos;
uniform float uTime;
uniform sampler2D uMask;
uniform float uSize;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform float uNight;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(41.31, 289.17))) * 15731.743); }
float wWave(vec2 q, float t) {
  return sin(q.x * 2.9 + t * 1.25) * sin(q.y * 2.3 - t * 1.05)
       + 0.55 * sin((q.x + q.y) * 4.7 + t * 1.9)
       + 0.35 * sin((q.x - q.y) * 7.3 - t * 2.4);
}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
vec2 wq = (floor(vWPos.xz * 16.0) + 0.5) / 16.0;
float landM = texture2D(uMask, wq / uSize).r;
float wv = wWave(wq, uTime);
float shallowK = smoothstep(0.04, 0.42, landM);
vec3 wcol = mix(uDeep, uShallow, shallowK);
wcol *= 0.93 + 0.07 * wv;
// little sparkles that blink in and out
float sp = wHash(floor(wq * 16.0));
float blink = fract(sp * 13.7 + uTime * 0.35);
wcol += vec3(0.16) * step(0.975, sp) * smoothstep(0.0, 0.15, blink) * smoothstep(0.45, 0.15, blink) * (1.0 - uNight * 0.6);
// foam band along the shore, breathing slowly
float foamEdge = landM + 0.05 * sin(uTime * 1.6 + wq.x * 5.0 + wq.y * 4.0);
float foam = smoothstep(0.30, 0.40, foamEdge);
wcol = mix(wcol, uFoam, foam * 0.9);
diffuseColor.rgb = wcol;
diffuseColor.a = mix(0.9, 0.72, shallowK);
diffuseColor.a = mix(diffuseColor.a, 0.95, foam);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{
  float e = 1.0 / 16.0;
  float hx = wWave(wq + vec2(e, 0.0), uTime) - wv;
  float hz = wWave(wq + vec2(0.0, e), uTime) - wv;
  vec3 wn = normalize(vec3(-hx * 0.28, 1.0, -hz * 0.28));
  normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
}`,
      );
  };
  mat.customProgramCacheKey = () => 'cubopolis-water';
  return mat;
}
