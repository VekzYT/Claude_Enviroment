// Flying instruments (altitude, vertical speed, a heading tape, rotor speed and warnings), the phone
// controls for a helicopter (UP / DOWN buttons, the stick pitching and yawing) and the controls help.
import { G } from '../state.js';
import { addTouchButtons, setTouchContext } from '../touch.js';
import { addControls } from '../ui/menus.js';

// phones: 'h' is the context while flying; the stick keeps both axes (pitch and yaw)
addTouchButtons([
  { id: 'hup', icon: 'gas', cap: 'UP', key: 'Space', on: 'h' },
  { id: 'hdown', icon: 'brake', cap: 'DOWN', key: 'ShiftLeft', on: 'h' },
  { id: 'hexit', icon: 'exit', cap: 'GET OUT', key: 'KeyF', on: 'h' },
  { id: 'hradio', icon: 'radio', cap: 'RADIO', key: 'KeyR', on: 'h' },
]);
setTouchContext((pl) => (pl && pl.vehicle ? (pl.vehicle.cls === 'heli' ? 'h' : 'c') : 'f'));
addControls(
  [['Space / Shift', 'Helicopter: climb / descend'], ['W S · A D', 'Helicopter: nose down to fly on, up to back off · turn'], ['F in the air', 'Bail out (the parachute opens above 25 m; A / D steer it)']],
  [['gas', 'Helicopter: climb'], ['brake', 'Helicopter: descend (the stick pitches and turns)']],
);

const CSS = `
#heli { position: absolute; right: 26px; bottom: 262px; width: 250px; opacity: 0; transform: translateY(8px); transition: opacity .25s, transform .25s; pointer-events: none; font-variant-numeric: tabular-nums; }
#heli.on { opacity: 1; transform: none; }
#heli .hl-row { display: flex; justify-content: flex-end; gap: 16px; align-items: flex-end; }
#heli .hl-k { text-align: right; }
#heli .hl-k b { display: block; font-size: 30px; font-weight: 900; font-style: italic; color: var(--ivory); line-height: 1; }
#heli .hl-k b small { font-size: 12px; font-style: normal; margin-left: 3px; color: rgba(240,232,216,.7); }
#heli .hl-k span { font-size: 9px; letter-spacing: .28em; font-weight: 700; color: rgba(240,232,216,.6); }
#heli .hl-vs b { color: #bfe3ee; }
#heli .hl-tape { position: relative; height: 22px; margin-top: 8px; overflow: hidden; border-radius: 3px; background: rgba(16,15,13,.55); border: 1px solid rgba(240,232,216,.18);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent); mask-image: linear-gradient(90deg, transparent, #000 22%, #000 78%, transparent); }
#heli .hl-tape i { position: absolute; top: 0; bottom: 0; left: 50%; display: flex; align-items: center; white-space: nowrap; font-style: normal; font-size: 11px; font-weight: 700; color: rgba(240,232,216,.8); }
#heli .hl-tape i span { display: inline-block; width: 30px; text-align: center; }
#heli .hl-tape i span.c { color: var(--amber); font-weight: 900; }
#heli .hl-tape:after { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: var(--terracotta); }
#heli .hl-rotor { position: relative; height: 6px; margin-top: 7px; background: rgba(16,15,13,.72); border-radius: 2px; overflow: hidden; }
#heli .hl-rotor i { position: absolute; inset: 0; transform-origin: 0 0; background: linear-gradient(90deg, #8fb7c9, var(--ivory)); }
#heli .hl-msg { margin-top: 6px; text-align: right; font-size: 12px; letter-spacing: .2em; font-weight: 900; color: var(--amber); min-height: 15px; }
#heli .hl-msg.bad { color: var(--red); }
body.in-heli .hud-br .bar.nitro { visibility: hidden; }
body.touch #heli { right: auto; left: 50%; bottom: auto; top: 18px; margin-left: -125px; }
/* phone buttons while flying: climb and descend in the corner, the rest round them */
#t-hup { width: 82px; height: 82px; right: calc(16px + var(--sr)); bottom: calc(96px + var(--sb)); background: rgba(120,200,120,.3); border-color: rgba(250,246,238,.6); }
#t-hup svg, #t-hdown svg { width: 34px; height: 34px; }
#t-hdown { width: 74px; height: 74px; right: calc(20px + var(--sr)); bottom: calc(14px + var(--sb)); background: rgba(143,183,201,.3); }
#t-hexit { width: 52px; height: 52px; right: calc(112px + var(--sr)); bottom: calc(16px + var(--sb)); border-color: var(--cyan); }
#t-hradio { width: 44px; height: 44px; top: 154px; left: calc(12px + var(--sl)); }
#t-hradio svg { width: 20px; height: 20px; }
#t-hradio small { font-size: 6px; }
`;

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const STEP = 30;   // px per 45 degrees on the tape

export function buildHeliHud() {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'heli';
  // three turns of the compass so the tape never runs out while it slides
  const marks = [];
  for (let k = 0; k < 24; k++) marks.push(`<span class="${k % 2 ? '' : 'c'}">${DIRS[k % 8]}</span>`);
  el.innerHTML = `<div class="hl-row">
      <div class="hl-k hl-vs"><b id="hl-vs">0<small>m/s</small></b><span>CLIMB</span></div>
      <div class="hl-k"><b id="hl-alt">0<small>m</small></b><span>ALTITUDE</span></div>
    </div>
    <div class="hl-tape"><i id="hl-tape">${marks.join('')}</i></div>
    <div class="hl-rotor"><i id="hl-rpm"></i></div>
    <div class="hl-msg" id="hl-msg"></div>`;
  (document.getElementById('hud') || document.body).appendChild(el);
  const E = { alt: el.querySelector('#hl-alt'), vs: el.querySelector('#hl-vs'), tape: el.querySelector('#hl-tape'), rpm: el.querySelector('#hl-rpm'), msg: el.querySelector('#hl-msg') };
  const cache = {};
  const set = (k, v, fn) => { if (cache[k] !== v) { cache[k] = v; fn(v); } };
  G.heliHud = {
    update() {
      const v = G.player.vehicle, on = !!v && v.cls === 'heli' && G.mode !== 'title';
      set('on', on, (x) => { el.classList.toggle('on', x); document.body.classList.toggle('in-heli', x); });
      if (!on) return;
      set('alt', Math.round(v.agl), (x) => { E.alt.innerHTML = `${x}<small>m</small>`; });
      const vs = Math.round(v.vel.y * 2) / 2;
      set('vs', vs, (x) => { E.vs.innerHTML = `${x > 0 ? '+' : ''}${x.toFixed(1)}<small>m/s</small>`; });
      // compass bearing, clockwise from north (north is -z; a heading h faces (sin h, cos h))
      const brg = ((Math.atan2(Math.sin(v.heading), -Math.cos(v.heading)) * 180) / Math.PI + 360) % 360;
      set('brg', Math.round(brg), (x) => { E.tape.style.transform = `translateX(${-(8 * STEP + (x / 45) * STEP + STEP / 2)}px)`; });
      set('rpm', Math.round(v.spool * 100), (x) => { E.rpm.style.transform = `scaleX(${x / 100})`; });
      let msg = '', bad = false;
      if (v.downing) { msg = 'MAYDAY · BAIL OUT'; bad = true; }
      else if (v.disabled > 0 && !v.destroyed) { msg = 'ENGINE OUT'; bad = true; }
      else if (v.spool < 0.72 && !v.destroyed) msg = `SPOOLING UP ${Math.round(v.spool * 100)}%`;
      else if (v.vel.y < -7 && v.agl < 30) { msg = 'SINK RATE'; bad = true; }
      else if (v.healthFrac < 0.3) { msg = 'DAMAGE'; bad = true; }
      else if (v.pos.y > 380) msg = 'CEILING';
      set('msg', msg + bad, () => { E.msg.textContent = msg; E.msg.classList.toggle('bad', bad); });
    },
  };
}
