// Builds the whole world and exposes per-frame updates.
import { Environment } from './env.js';
import { installCityLighting } from './citylight.js';
import { buildTerrain } from './terrainMesh.js';
import { buildWater } from './water.js';
import { buildRoads } from './roadMesh.js';
import { buildCity } from './city.js';
import { buildLandmarks } from './landmarks.js';
import { buildNature } from './nature.js';
import { buildProps } from './props.js';
import { updateBreakables } from './breakables.js';
import { cullChunks } from './geom.js';

export async function buildWorld(scene, renderer, quality, progress) {
  const step = async (label, frac, fn) => {
    progress(label, frac);
    await new Promise((r) => setTimeout(r, 0));
    return fn();
  };
  installCityLighting();
  const env = new Environment(scene, renderer);
  const terrain = await step('Surveying the coastline', 0.05, () => buildTerrain(scene));
  const water = await step('Filling the bayou', 0.28, () => buildWater(scene));
  env.waterUniforms = water.uniforms;
  const roads = await step('Paving Sonnet City', 0.36, () => buildRoads(scene));
  const city = await step('Raising glass towers', 0.46, () => buildCity(scene, env));
  const landmarks = await step('Wiring up data centres', 0.62, () => buildLandmarks(scene, env));
  const nature = await step('Growing the Glowwood', 0.7, () => buildNature(scene, env, quality));
  const props = await step('Switching on the street lights', 0.88, () => buildProps(scene, env, quality));
  env.apply(0);
  env.refreshEnvMap();
  let cullTimer = 0;
  const drawScale = { low: 0.6, medium: 0.85, high: 1 };
  return {
    env, city, nature, water, props, roads, landmarks, terrain,
    quality,
    update(dt, t, focus) {
      cullTimer -= dt;
      if (cullTimer <= 0) {
        cullTimer = 0.3;
        cullChunks(focus.x, focus.z, drawScale[this.quality] || 1);
        terrain.update(focus.x, focus.z);
      }
      env.update(dt, focus);
      city.update(dt, t);
      landmarks.update(dt, t);
      nature.update(dt, t, focus);
      props.update(dt, t);
      updateBreakables(dt);
    },
  };
}
