// Room lighting for interiors without adding three.js lights.
//
// Every extra PointLight would change the light count of every material in the game (a shader
// recompile of the whole scene each time a door is used) and cost every pixel outdoors. Instead,
// like the analytic street lamps in world/citylight.js, every lit material gets a short list of
// lamps from shared uniforms, evaluated through its own BRDF. Outdoors the list is empty and the
// whole block is one uniform branch.
import * as THREE from 'three';

export const MAX_LAMPS = 12;
const uniforms = {
  uIntN: { value: 0 },
  uIntP: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4()) },  // world xyz, range
  uIntC: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector3()) },  // colour x intensity
  uIntS: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4(0, -1, 0, -2)) },  // spot axis, cos of the cone (-2: all round)
};

const DECL = /* glsl */`
uniform float uIntN;
uniform vec4 uIntP[ ${MAX_LAMPS} ];
uniform vec3 uIntC[ ${MAX_LAMPS} ];
uniform vec4 uIntS[ ${MAX_LAMPS} ];
`;
// vCityPos (world position) comes from the city lighting patch, which every lit material has.
const LIGHTING = /* glsl */`
#if defined( RE_Direct )
if ( uIntN > 0.5 ) {
  for ( int i = 0; i < ${MAX_LAMPS}; i ++ ) {
    if ( float( i ) >= uIntN ) break;
    vec3 toL = uIntP[ i ].xyz - vCityPos;
    float d2 = max( dot( toL, toL ), 1e-4 );
    float r = uIntP[ i ].w;
    float fall = clamp( 1.0 - d2 / ( r * r ), 0.0, 1.0 );
    if ( fall <= 0.0 ) continue;
    vec3 dirW = toL * inversesqrt( d2 );
    float cone = uIntS[ i ].w < -1.5 ? 1.0 : smoothstep( uIntS[ i ].w, uIntS[ i ].w + 0.1, dot( -dirW, uIntS[ i ].xyz ) );
    directLight.color = uIntC[ i ] * ( fall * fall * cone / ( d2 + 0.5 ) );
    directLight.direction = normalize( ( viewMatrix * vec4( dirW, 0.0 ) ).xyz );
    directLight.visible = true;
    RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
  }
}
#endif
`;

// Runs at import, before any material is compiled.
{
  const C = THREE.ShaderChunk;
  C.common = C.common + DECL;
  C.lights_fragment_end = LIGHTING + C.lights_fragment_end;
  const base = THREE.Material.prototype.onBeforeCompile;
  THREE.Material.prototype.onBeforeCompile = function (shader, renderer) {
    Object.assign(shader.uniforms, uniforms);
    if (base) base.call(this, shader, renderer);
  };
}

// lamps: [{ x, y, z, range, color, power, dir?: [x, y, z], cone?: radians }] in world space.
export function setLamps(lamps) {
  const n = Math.min(MAX_LAMPS, lamps.length);
  uniforms.uIntN.value = n;
  for (let i = 0; i < n; i++) updateLamp(i, lamps[i]);
}
const _c = new THREE.Color();
export function updateLamp(i, L) {
  uniforms.uIntP.value[i].set(L.x, L.y, L.z, L.range);
  _c.set(L.color).multiplyScalar(L.power);
  uniforms.uIntC.value[i].set(_c.r, _c.g, _c.b);
  const s = uniforms.uIntS.value[i];
  if (L.dir) { const l = Math.hypot(L.dir[0], L.dir[1], L.dir[2]) || 1; s.set(L.dir[0] / l, L.dir[1] / l, L.dir[2] / l, Math.cos(L.cone || 0.5)); }
  else s.set(0, -1, 0, -2);
}
export function clearLamps() { uniforms.uIntN.value = 0; }
