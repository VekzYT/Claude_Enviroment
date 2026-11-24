// OWNER: integrator. PLACEHOLDER boot: shows the test city with the placeholder modules.
import './theme.css';
import './boot.css';
import { MAX_STEPS_PER_FRAME, SIM_DT } from './core/config';
import { stepAI } from './ai';
import { createCameraRig } from './camera';
import { createControls } from './input';
import { stepMissions } from './missions';
import { createGameRenderer } from './render';
import { createGame, stepGame } from './sim';
import { generateCity } from './world';

const canvas = document.getElementById('world') as HTMLCanvasElement;
const overlay = document.getElementById('ui') as HTMLElement;
const map = generateCity(1);
const game = createGame(map, 1);
const view = createGameRenderer(canvas, map, 'high');
const input = createControls(canvas, overlay);
const rig = createCameraRig();

function resize(): void {
  view.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}
window.addEventListener('resize', resize);
resize();

let last = performance.now();
let acc = 0;
let booted = false;
function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  input.update(dt);
  input.controls.camYaw = rig.yaw;
  acc += dt;
  let steps = 0;
  while (acc >= SIM_DT && steps < MAX_STEPS_PER_FRAME) {
    stepAI(game, map, SIM_DT);
    stepGame(game, map, input.controls, SIM_DT);
    stepMissions(game, map, SIM_DT);
    acc -= SIM_DT;
    steps++;
  }
  if (acc > SIM_DT) acc = 0;
  rig.update(dt, game, map, input.controls);
  rig.apply(view.camera);
  view.update(dt, game);
  view.render();
  if (!booted) {
    booted = true;
    console.log('SONNETCOAST_BOOT_OK');
  }
}
requestAnimationFrame(frame);
