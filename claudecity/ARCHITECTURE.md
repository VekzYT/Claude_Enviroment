# Claude City — architecture

Claude City is an original open-world game: a warm, futuristic island city you explore on foot and in
hover vehicles, with jobs handed out by Claude, the friendly AI that helps run the place. It is a
TypeScript + Three.js web game bundled into one script. It must play well on **an iPhone held
sideways (touch)** and on **a PC (keyboard + mouse, or a gamepad)** from the same build, installed
as a Home Screen web app or opened in a desktop browser. Nothing is loaded at runtime: no CDNs, no
fonts, no model, texture or sound files. Everything is made in code.

**It must be its own game.** The genre is familiar (free-roam city, take any vehicle, jobs, security
that chases you when you cause trouble), but do not copy any existing game's name, characters, map,
missions, HUD layout, wording, radio, or signature look. No real brands. In particular the "heat"
display is a clay-coloured meter, not a row of stars, and nobody is "wasted" or "busted" on screen:
write our own words. Violence is slapstick and non-lethal: the player's gadget is a *pulse* that
stuns machines, people who get bumped fall over and get up again, and nothing bleeds.

## Look and tone

Optimistic future, not rainy dystopia. Cream ceramic and glass towers with clay-orange accents
(`THEME.clay` `#d97757` is the signature colour), terraces full of plants, soft holograms, every
vehicle hovering on a glow instead of wheels. Days are bright and warm; sunsets go gold and coral;
nights are deep ink-blue lit by teal, violet and coral light, lit windows and glowing street lines.
Signs use abstract glyphs and shapes, never real words or logos. The city emblem is a simple radial
"spark" of our own drawing. People are chunky, blocky figures; service robots walk among them.
Districts (see `core/defs.ts DISTRICTS`): **Opus Core** (downtown towers around the Spire),
**Sonnet Strip** (arcades and holograms), **Haiku Heights** (quiet terraces), **Fable Harbor**
(docks and cranes), **Mythos Park** (lawns, lake, research domes), **Tokenside** (old market).
Vehicles (`VEHICLES`): Pebble pod, Sonnet sedan, Stanza coupe, Opus GT, Courier van, Atlas hauler,
Haiku hover bike, Sentinel interceptor.

## Layout and commands

```
claudecity/
  src/core/        shared contracts (FROZEN: architect only)
  src/world/       city generation and routing                     owner: world
  src/sim/         player, vehicles, collisions, pulse, pickups    owner: sim
  src/ai/          traffic, people, security, heat                 owner: ai        (wave 2)
  src/missions/    jobs, dialogue, economy, saves                  owner: missions  (wave 2)
  src/input/       keyboard+mouse, touch controls, gamepad         owner: controls
  src/camera/      third-person camera                             owner: controls
  src/render/      renderer, sky, lighting, moving things, effects owner: scene-render
  src/render/city/ ground, roads, water, buildings, props          owner: city-render
  src/render/models/ vehicles, characters, props, landmarks, icon  owner: models
  src/ui/          HUD, menus, map, dialogue                       owner: ui        (wave 2)
  src/audio/, src/platform/  sound; saves, settings, haptics       owner: audio     (wave 2)
  src/main.ts, src/index.html, src/boot.css, tools/               owner: integrator
  tests/           node:test unit tests, named <owner>-*.test.ts
  src/dev/, tools/dev/   dev harnesses and scripts, named <owner>-*
  .cache/          scratch output (git-ignored): screenshots, harness builds
```

* `npx tsc --noEmit` must pass with zero errors. `npm test` runs `tests/*.test.ts` (Node test runner via tsx).
* `node tools/build.mjs` builds `www/`. **Several agents work in this tree at once, so never build
  into `www/` yourself.** Build your own copy: `GAME_OUT=.cache/<owner>/www node tools/build.mjs`,
  and for a dev harness add `GAME_ENTRY=src/dev/<owner>-harness.ts`. Serve it with
  `GAME_OUT=.cache/<owner>/www node tools/serve.mjs <port>` (pick a port nobody else uses:
  world 5301, sim 5302, controls 5303, models 5304, city-render 5305, scene-render 5306, integrator 5310).
* Type errors in a file you do not own are probably another agent mid-edit: wait and re-run. Never
  edit outside your folders. `src/core/` is frozen: if you need something there, work around it
  locally and list the request in your final report.
* **Keep every exported signature in your module's `index.ts` exactly as it is** (you may add
  exports). The bodies are placeholders: replace them.
* The game logs `CLAUDECITY_BOOT_OK` once after its first frame.
* Do not commit, push or touch git: the architect does that.

### Testing in a browser here (Linux, headless Chromium)

Playwright and Chromium are pre-installed: `const { chromium } = createRequire(import.meta.url)('playwright')`
from an ES module. Do **not** run `playwright install`. Launch with
`args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']`.
Phone: context `{ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }`
(an iPhone 15 Pro sideways; safe-area insets there are about 59 px left and right and 21 px at the
bottom: the page accepts `?safe=59,59,21` to emulate them through the `--safe-*` CSS variables).
PC: `{ viewport: { width: 1600, height: 900 } }`. WebGL here is software (SwiftShader), a few frames
a second: judge looks from screenshots and correctness from state, never frame rate. Send real
touches through CDP `Input.dispatchTouchEvent` and give taps explicit `timestamp`s. **Look at your
screenshots** (Read the PNG) and iterate on what you see; a module is not done until it looks right.

## Performance budget (iPhone 15 Pro, WebKit, WebGL2 through three.js 0.186)

60 fps. On screen at once: **≤ 180 draw calls and ≤ 600k triangles** including any shadow pass, at
"high". No allocation per frame in hot paths (reuse vectors, arrays and objects), no work
proportional to the whole city per frame (cull by chunk, update only what is near the player).
Device pixel ratio is capped (low 1.25, medium 1.75, high 2.25). Safari 15+ features only: no
WebGPU, no top-level await in the bundle.

## Conventions (`core/types.ts`, `core/math.ts`)

Metres, seconds, radians. x east, y up, z south. The city is `[0, size] × [0, size]`; land and roads
are at y = 0; water surface at `WATER_Y`. Heading `yaw` is three.js `rotation.y`: forward =
`(sin yaw, 0, cos yaw)`, yaw 0 faces +z. Right = `(−cos yaw, 0, sin yaw)`. Traffic keeps right.
Vehicle orientation is `rotation.set(pitch, yaw, roll, 'YXZ')`. The simulation runs in fixed steps of
`SIM_DT` (1/60 s); rendering reads the latest state.

## The city: `CityMap` (generated once by `src/world`, read by everyone)

Roads are axis-aligned. `nodes` are junctions; `edges` join two nodes along x or z and have a class
(`ROADS` in `core/config.ts`: street 12 m roadway + 3 m sidewalks, avenue 20 m + 4 m, expressway
28 m, no sidewalks). `lanes` are directed driving lanes from junction square to junction square with
`out` links; `walks` are sidewalk segments with links at both ends. `blocks` are the land inside the
sidewalks. `buildings` are stacks of axis-aligned boxes (`parts`) with a facade `style`, a `seed`
and the side that faces the street; the six unique ones carry `landmark` and use the sizes in
`LANDMARKS`. `props` are street furniture and rooftop clutter (`PROPS` says which are solid, which
break, which carry their own size). `ramps` are stunt wedges. `pois` are named places: the
safehouse, garages, job contacts, parked special vehicles, sparks (collectibles), viewpoints.
`surface` is a raster (`SURF_CELL` = 2 m) of `Surface` values; `district` is a coarser raster.

`core/query.ts` works on any CityMap and never allocates: `surfaceAt`, `groundY` (0 on land and
bridges, ramp height on ramps, `WATER_FLOOR` under water), `districtAt`, `queryColliders` /
`queryProps` (grid candidates in a rectangle), `nearestLane`, `raycast` (against solid boxes; unit
direction), `lineOfSight`. `finalizeCity(draft)` derives `colliders` (one box per building part and
per solid prop) and the grids; worldgen must end with it.

`core/fixture.ts` `fixtureCity()` is a small, plain city that obeys the whole contract. **Use it in
your harness and tests**; do not depend on the real generator's layout (it is being written at the
same time as your module). Anything you build must work for any `map.size` and any valid CityMap.

## The game: `GameState` (pools of plain objects, see `core/state.ts`)

`player` (on foot or in a vehicle), `vehicles` (pool of `MAX_VEHICLES`), `peds`, `drones`, `shots`,
`pickups`, `propsDown` (which props are knocked over), `heat`, `mission` (what the HUD shows:
objective, timer, world markers), `progress` (what is saved), `time`, `clock` (time of day).
Entities are reused by flipping `active`; nothing is allocated after `createGame`.

Per fixed step, main calls, in order: `stepAI(game, map, dt)` → `stepGame(game, map, controls, dt)`
→ `stepMissions(game, map, dt)`. Then once per frame: camera rig update, `renderer.update`, `render`.

* **sim** moves the player and every awake vehicle from their inputs, resolves collisions against
  the city and each other, handles getting in and out, the pulse, pickups, water, respawn, and
  emits events (`core/events.ts`): `crash`, `land`, `enter`, `exit`, `pulse`, `zap`, `pickup`,
  `splash`, `propBroken`, `pedHit`, `respawn`, `stunt`, `boost`.
* **ai** (wave 2) owns everything with a mind: it spawns and removes traffic, people and security
  near the player, writes `throttle / steer / brake / handbrake / boost` on the vehicles it drives
  before sim runs, moves `peds` and `drones`, and runs `heat`. Until it exists there is no traffic:
  sim must still handle parked and abandoned vehicles.
* **missions** (wave 2) owns `game.mission`, `game.progress`, dialogue, rewards and the save format.

`Controls` (`core/types.ts`) is what the player asks for this frame, the same on every device. The
edge flags (`enter`, `fire`, `interact`, `horn`, `camera`, `map`, `pause`) are true for exactly one
frame. `camYaw` is filled in by main from the camera rig so stick-forward means away from the camera.

## Rendering contracts

* `src/render/index.ts` `createGameRenderer(canvas, map, quality)` owns the WebGLRenderer, scene,
  sky, sun / moon, fog, shadows and the `RenderEnv` for the frame; draws everything that moves by
  instancing models from `src/render/models`; draws mission markers, pickups, shots and effects;
  and adds `createCityView(map, quality).object` to the scene, calling its `update` every frame.
* `src/render/city/index.ts` `createCityView` draws the static city from the CityMap in chunks,
  following `RenderEnv` (night windows, lamps, wet streets), and paints the minimap picture.
* `src/render/models/index.ts` returns geometry with `position`, `normal`, `color`, `aGlow`,
  `aPaint` (see the file header). Vehicles get their paint and characters their outfit colour
  through the instance colour wherever `aPaint` is 1. The shared material that understands
  `aGlow` / `aPaint` is scene-render's; city-render uses the same attribute meanings for props and
  landmarks.
* Characters are six rigid parts (`CHAR_PARTS`) posed by `poseCharacter`. All people on screen are
  drawn with one instanced mesh per part per body type.

## Interface rules (for anything on screen)

`src/theme.css` holds the colours, panel style, font stack and the `--safe-*` insets: use those
variables. Glassy dark panels (`--panel`) over the 3D view, cream text, clay for the primary
action. Inline SVG icons in one consistent rounded style; no emoji, no icon fonts, no web fonts.
Touch targets ≥ 48 px; nothing interactive inside the safe-area insets; text ≥ 12 px. The `#ui`
element covers the screen with `pointer-events: none`: set `pointer-events: auto` on real controls
only, so everything else falls through to the canvas (camera drag, mouse look). Layouts must work
from 667 × 375 (small phone, landscape) up to 2560 × 1440, and must not assume a touch screen or a
keyboard: show the prompts for whichever `controls.scheme` is in use.
