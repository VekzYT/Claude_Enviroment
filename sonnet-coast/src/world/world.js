// Builds the whole world and exposes per-frame updates.
import { Environment } from './env.js';
import { buildTerrain } from './terrainMesh.js';
import { buildWater } from './water.js';
import { buildRoads } from './roadMesh.js';
import { buildCity } from './city.js';
import { buildLandmarks } from './landmarks.js';
import { buildNature } from './nature.js';
import { buildProps } from './props.js';
import { updateBreakables } from './breakables.js';

export async function buildWorld(scene, quality, progress) {
  const step = async (label, frac, fn) => {
    progress(label, frac);
    await new Promise((r) => setTimeout(r, 0));
    return fn();
  };
  const env = new Environment(scene);
  await step('Surveying the coastline', 0.05, () => buildTerrain(scene));
  const water = await step('Filling the bayou', 0.3, () => buildWater(scene));
  env.waterUniforms = water.uniforms;
  await step('Paving Sonnet City', 0.4, () => buildRoads(scene));
  const city = await step('Raising glass towers', 0.5, () => buildCity(scene, env));
  await step('Wiring up data centres', 0.62, () => buildLandmarks(scene, env));
  const nature = await step('Growing the Glowwood', 0.7, () => buildNature(scene, env, quality));
  await step('Switching on the street lights', 0.9, () => buildProps(scene, env));
  env.apply(0);
  return {
    env, city, nature, water,
    update(dt, t, focus) {
      env.update(dt, focus);
      city.update(dt, t);
      nature.update(dt, t, focus);
      updateBreakables(dt);
    },
  };
}
