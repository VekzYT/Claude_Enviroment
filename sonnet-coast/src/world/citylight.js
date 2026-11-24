// Analytic city lighting.
//
// A forward renderer cannot afford thousands of real street lamps, but the city is a regular
// grid, so the nearest lamps to any pixel can be found with arithmetic instead of a light list.
// This module patches three.js' shader chunks so every lit material gets:
//   * four street lamps (both kerbs of the nearest N-S and E-W street), evaluated through the
//     material's own BRDF, so wet asphalt streaks and car paint glints for free;
//   * coloured "neon spill" from the storefront line of the nearest block faces;
//   * height fog (haze pools at ground level, towers rise out of it).
// Lamp on/off state and storefront colours live in two tiny data textures.
import * as THREE from 'three';
import { CITY } from './layout.js';

const NX = CITY.xs.length, NZ = CITY.zs.length;
const TEX = 64;
export const LAMP_SLOTS = [18, 50, 82];
export const LAMP_Y = CITY.y + 0.16 + 6.9;

const lampData = new Uint8Array(TEX * TEX * 4).fill(255);
const neonData = new Uint8Array(TEX * TEX * 4).fill(0);
const lampTex = new THREE.DataTexture(lampData, TEX, TEX, THREE.RGBAFormat);
const neonTex = new THREE.DataTexture(neonData, TEX, TEX, THREE.RGBAFormat);
for (const t of [lampTex, neonTex]) { t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; }

export const cityUniforms = {
  uCityRect: { value: new THREE.Vector4(CITY.x0, CITY.z0, CITY.x1 - CITY.x0, CITY.z1 - CITY.z0) },
  uCityN: { value: new THREE.Vector2(NX, NZ) },
  uXW: { value: Float32Array.from(CITY.xw) },
  uZW: { value: Float32Array.from(CITY.zw) },
  uCityLampTex: { value: lampTex },
  uCityNeonTex: { value: neonTex },
  uLampColor: { value: new THREE.Color(0, 0, 0) },
  uNeonK: { value: 0 },
  uLampY: { value: LAMP_Y },
  uFogHeight: { value: new THREE.Vector4(2, 0.02, 0, 0) },
  uWet: { value: 0 },
};

// axis 'z' = a north-south street (constant x, line index i); 'x' = east-west street (constant z).
// cell = block index along the street, slot 0..2, side 0 = low-coordinate kerb, 1 = high.
function lampTexel(axis, line, cell, slot, side) {
  const col = cell * 3 + slot;
  const row = (axis === 'z' ? 0 : 32) + line * 2 + side;
  return (row * TEX + col) * 4;
}
export function setLamp(axis, line, cell, slot, side, on) {
  lampData[lampTexel(axis, line, cell, slot, side)] = on ? 255 : 0;
  lampTex.needsUpdate = true;
}
// Colour of the storefront glow on the block face that looks onto a street.
export function setNeon(axis, line, cell, side, color, strength = 1) {
  const o = (((axis === 'z' ? 0 : 32) + line * 2 + side) * TEX + cell) * 4;
  neonData[o] = color.r * 255; neonData[o + 1] = color.g * 255; neonData[o + 2] = color.b * 255;
  neonData[o + 3] = Math.round(strength * 255);
  neonTex.needsUpdate = true;
}

const DECL = /* glsl */`
varying vec3 vCityPos;
uniform vec4 uCityRect;
uniform vec2 uCityN;
uniform float uXW[${NX}];
uniform float uZW[${NZ}];
uniform sampler2D uCityLampTex;
uniform sampler2D uCityNeonTex;
uniform vec3 uLampColor;
uniform float uNeonK;
uniform float uLampY;
uniform vec4 uFogHeight;
uniform float uWet;
`;

const LIGHTING = /* glsl */`
#if defined( RE_Direct )
{
  vec2 cRel = vCityPos.xz - uCityRect.xy;
  if ( ( uLampColor.r + uNeonK ) > 0.002 && vCityPos.y < uLampY + 16.0 &&
       cRel.x > -34.0 && cRel.y > -34.0 && cRel.x < uCityRect.z + 34.0 && cRel.y < uCityRect.w + 34.0 ) {
    for ( int ax = 0; ax < 2; ax ++ ) {
      // across = distance along the axis that crosses the street, along = distance down the street
      float across = ax == 0 ? cRel.x : cRel.y;
      float along = ax == 0 ? cRel.y : cRel.x;
      float nLines = ax == 0 ? uCityN.x : uCityN.y;
      float nCells = ( ax == 0 ? uCityN.y : uCityN.x ) - 1.0;
      float line = clamp( floor( across / 100.0 + 0.5 ), 0.0, nLines - 1.0 );
      float off = across - line * 100.0;              // signed distance from the centreline
      float hw = ax == 0 ? uXW[ int( line ) ] : uZW[ int( line ) ];
      if ( abs( off ) > hw + 30.0 ) continue;
      float cell = clamp( floor( along / 100.0 ), 0.0, nCells - 1.0 );
      float f = along - cell * 100.0;
      float slot = clamp( floor( ( f - 2.0 ) / 32.0 ), 0.0, 2.0 );
      float lampAlong = cell * 100.0 + 18.0 + slot * 32.0;
      float rowBase = ( ax == 0 ? 0.0 : 32.0 ) + line * 2.0;
      // --- street lamps, one on each kerb -----------------------------------
      if ( uLampColor.r > 0.001 ) {
        for ( int s = 0; s < 2; s ++ ) {
          float sgn = s == 0 ? -1.0 : 1.0;
          // textureLod: no screen-space derivatives, so it is legal inside loops and branches on every backend
          float alive = textureLod( uCityLampTex, ( vec2( cell * 3.0 + slot, rowBase + float( s ) ) + 0.5 ) / ${TEX}.0, 0.0 ).r;
          if ( alive < 0.5 ) continue;
          float la = line * 100.0 + sgn * ( hw - 0.6 );
          vec3 lp = ax == 0 ? vec3( uCityRect.x + la, uLampY, uCityRect.y + lampAlong )
                            : vec3( uCityRect.x + lampAlong, uLampY, uCityRect.y + la );
          vec3 toL = lp - vCityPos;
          float d2 = dot( toL, toL );
          float fall = clamp( 1.0 - d2 / 900.0, 0.0, 1.0 );
          if ( fall <= 0.0 ) continue;
          // lamp heads are hooded: nothing above the lamp, a soft cone below
          vec3 dirW = toL * inversesqrt( d2 );
          float hood = smoothstep( -0.05, 0.3, dirW.y );
          directLight.color = uLampColor * ( fall * fall * hood * 42.0 / ( d2 + 18.0 ) );
          directLight.direction = normalize( ( viewMatrix * vec4( dirW, 0.0 ) ).xyz );
          directLight.visible = true;
          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
        }
      }
      // --- neon spill from the nearer storefront line ------------------------
      if ( uNeonK > 0.001 && vCityPos.y < 14.0 ) {
        float sgn = off < 0.0 ? -1.0 : 1.0;
        float side = off < 0.0 ? 0.0 : 1.0;
        vec4 neon = textureLod( uCityNeonTex, ( vec2( cell, rowBase + side ) + 0.5 ) / ${TEX}.0, 0.0 );
        if ( neon.a > 0.02 ) {
          float la = line * 100.0 + sgn * ( hw + 4.2 );
          float al = cell * 100.0 + clamp( f, 14.0, 86.0 );
          vec3 lp = ax == 0 ? vec3( uCityRect.x + la, 5.4, uCityRect.y + al )
                            : vec3( uCityRect.x + al, 5.4, uCityRect.y + la );
          vec3 toL = lp - vCityPos;
          float d = length( toL );
          float fall = clamp( 1.0 - d / 19.0, 0.0, 1.0 );
          float ends = smoothstep( 4.0, 16.0, f ) * smoothstep( 96.0, 84.0, f );
          directLight.color = neon.rgb * ( neon.a * uNeonK * fall * fall * ends * 3.2 / ( 1.0 + d * 0.22 ) );
          directLight.direction = normalize( ( viewMatrix * vec4( toL / max( d, 0.001 ), 0.0 ) ).xyz );
          directLight.visible = true;
          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
        }
      }
    }
  }
}
#endif
`;

const FOG = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  float fogHf = exp( - max( vCityPos.y - uFogHeight.x, 0.0 ) * uFogHeight.y );
  fogFactor = clamp( fogFactor * ( 0.5 + 0.5 * fogHf ) + uFogHeight.z * fogHf * smoothstep( 10.0, 220.0, vFogDepth ), 0.0, 1.0 );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;

let installed = false;
export function installCityLighting() {
  if (installed) return;
  installed = true;
  const C = THREE.ShaderChunk;
  C.common = C.common + DECL;
  C.project_vertex = C.project_vertex + /* glsl */`
#ifdef USE_INSTANCING
  vCityPos = ( modelMatrix * instanceMatrix * vec4( transformed, 1.0 ) ).xyz;
#else
  vCityPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
#endif
`;
  C.lights_fragment_end = LIGHTING + C.lights_fragment_end;
  C.fog_fragment = FOG;
  // Wet roads: rain lowers roughness on anything that opts in via the WET_SURFACE define.
  C.roughnessmap_fragment = C.roughnessmap_fragment + /* glsl */`
#ifdef WET_SURFACE
  roughnessFactor = mix( roughnessFactor, roughnessFactor * 0.3 + 0.03, uWet );
#endif
`;
  // Every material shares the same uniform objects, so one write updates them all.
  const base = THREE.Material.prototype.onBeforeCompile;
  THREE.Material.prototype.onBeforeCompile = function (shader, renderer) {
    Object.assign(shader.uniforms, cityUniforms);
    if (base) base.call(this, shader, renderer);
  };
}

// Hand-written ShaderMaterials that use the fog chunks must `#include <common>` in both stages
// and write `vCityPos` (world position) in the vertex shader.
