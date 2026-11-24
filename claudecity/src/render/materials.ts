// OWNER: scene-render. The shared material for models (vehicles, people, props, landmarks).
// city-render uses it too, so both halves of the world light up the same way at night.
//
// It understands the model geometry convention (see models/index.ts):
//   color   vertex colour (linear)
//   aGlow   0..1: emissive at night, scaled by the night amount set with setModelNight()
//   aPaint  0..1: where the per-instance colour (InstancedMesh.setColorAt) replaces the vertex colour
import * as THREE from 'three';

export interface ModelMaterialOptions {
  /** Glow stays on by day too (hover pads, light strips, holograms). Default false: night only. */
  alwaysGlow?: boolean;
}

/** A lit, flat-shaded, vertex-coloured material for instanced or plain meshes. PLACEHOLDER: no glow, no paint. */
export function createModelMaterial(options: ModelMaterialOptions = {}): THREE.Material {
  void options;
  return new THREE.MeshLambertMaterial({ vertexColors: true });
}

/** Tell every model material how dark it is (0 day .. 1 night). Call once per frame. PLACEHOLDER. */
export function setModelNight(night: number): void {
  void night;
}
