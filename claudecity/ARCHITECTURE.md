# Sonnet Coast — architecture

Sonnet Coast is an original open-world action-adventure game. The map is a large futuristic coastal
region: a dense neon city (Claude City) surrounded by wilderness — tropical wetlands and bayou
channels, palm-lined beaches, forest that glows at night, dirt trails. The player is a rogue-leaning
Anthropic field operative who handles off-the-books problems in the city and the bayous: stealing
prototype vehicles for swamp chop shops, hijacking police cruisers, smuggling restricted GPU
hardware along back trails and waterways, street and dirt races. Take any vehicle (pull the driver
out, or break in), drive, drift, boost, ride boats; cause trouble and your **Safety Flag level**
(1 to 5 flags) rises, bringing Anthropic Police cruisers, off-road units, Constitutional AI drones
and containment trucks.

It is a TypeScript + Three.js web game bundled into one script. It must play well on **an iPhone
held sideways (touch)** and on **a PC (keyboard + mouse, or a gamepad)** from the same build,
installed as a Home Screen web app or opened in a desktop browser. Nothing is loaded at runtime: no
CDNs, no fonts, no model, texture or sound files. Everything is made in code.

## It must be its own game

The genre is familiar and the player asked for that feel, but nothing may be copied from an existing
game: no names (places, people, vehicles, radio stations, missions), no map layout, no characters, no
HUD artwork or wording, no real brands or real people. Specifics:

* The wanted display is a row of up to five small **flags** in our own style (it is the Safety Flag
  level), not stars. Nobody is "wasted" or "busted" on screen: write our own words.
* The minimap, gadget wheel, bars and money counter are standard genre tools: draw them in our own
  visual language (`src/theme.css`), not as a copy of anyone's.
* Rival companies and executives are invented. Anthropic and Claude appear as the fictional setting of
  a fan game: the title screen says it is an unofficial fan game, not made or endorsed by Anthropic.
  Use our own emblem (a simple radial spark of our own drawing), never a real logo.
* Action is slapstick and non-lethal: gadgets stun and disable, people who get bumped or pulled out
  of a car fall over, complain and get up, police arrest rather than kill, nothing bleeds.

## Look and tone

The city: towering glass and ceramic skyscrapers, holographic billboards, AI data centres, in warm
terracotta (`THEME.clay` `#d97757` is the signature colour), cream and slate, lit at night by teal,
violet and coral neon. The wilderness: bright greens and blues by day, bioluminescent glow in the
forest and the bayou after dark, fireflies, mist on the water. The contrast between the two is the
point. Signs use abstract glyphs and shapes, never real words or logos. People are chunky, blocky
figures; service robots walk among them. Wildlife (gators, herons, deer) lives in the wild.

Districts (`core/defs.ts DISTRICTS`): in the city **Opus Core**, **Stanza Strip**, **Haiku Heights**,
**Fable Harbor**, **Mythos Campus** (data centres), **Tokenside**; in the wild **Latent Bayou**,
**Gradient Woods**, **Sonnet Shore**. Vehicles (`VEHICLES`): Pebble, Sonnet, Stanza (sports), Opus GT
(prototype hypercar), Courier van, Ballad 4x4 (lifted truck), Limerick (buggy), Atlas hauler, Haiku
(hover-bike: the only thing that hovers), Riptide (speedboat), and the police Sentinel, Warden and
Bulwark. Cars and trucks have wheels. Money is **Tokens**.

## Layout and commands

```
claudecity/
  src/core/          shared contracts (FROZEN: architect only)
  src/world/         map generation (city + wilderness) and routing   owner: world
  src/sim/           player, vehicles, boats, collisions, gadgets     owner: sim
  src/ai/            traffic, people, wildlife, police, flag level     owner: ai        (wave 2)
  src/missions/      jobs, dialogue, economy, saves                   owner: missions  (wave 2)
  src/input/         keyboard+mouse, touch controls, gamepad          owner: controls
  src/camera/        third-person camera                              owner: controls
  src/render/        renderer, sky, lighting, moving things, effects  owner: scene-render
  src/render/city/   roads, hard ground, buildings, built props       owner: city-render
  src/render/terrain/ soft ground, water, vegetation                  owner: terrain
  src/render/models/ vehicles, characters, wildlife, props, landmarks owner: models
  src/ui/            HUD, minimap, gadget wheel, menus, dialogue      owner: ui        (wave 2)
  src/audio/, src/platform/  sound and radio; saves, settings, haptics owner: audio    (wave 2)
  src/main.ts, src/index.html, src/boot.css, tools/                  owner: integrator
  tests/             node:test unit tests, named <owner>-*.test.ts
  src/dev/, tools/dev/   dev harnesses and scripts, named <owner>-*
  .cache/            scratch output (git-ignored): screenshots, harness builds
```

* `npx tsc --noEmit` must pass with zero errors. `npm test` runs `tests/*.test.ts` (Node test runner via tsx).
* `node tools/build.mjs` builds `www/`. **Several agents work in this tree at once, so never build
  into `www/` yourself.** Build your own copy: `GAME_OUT=.cache/<owner>/www node tools/build.mjs`,
  and for a dev harness add `GAME_ENTRY=src/dev/<owner>-harness.ts`. Serve it with
  `GAME_OUT=.cache/<owner>/www node tools/serve.mjs <port>` (ports: world 5301, sim 5302, controls
  5303, models 5304, city-render 5305, scene-render 5306, terrain 5307, integrator 5310).
* Type errors in a file you do not own are probably another agent mid-edit: wait and re-run. Never
  edit outside your folders. `src/core/` is frozen: if you need something there, work around it
  locally and list the request in your final report.
* **Keep every exported signature in your module's `index.ts` exactly as it is** (you may add
  exports). The bodies are placeholders: replace them.
* The game logs `SONNETCOAST_BOOT_OK` once after its first frame.
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

60 fps. On screen at once: **≤ 200 draw calls and ≤ 650k triangles** including any shadow pass, at
"high". Shares: city about 90 draws / 300k triangles, terrain about 40 / 170k, moving things and
effects about 70 / 180k. No allocation per frame in hot paths (reuse vectors, arrays and objects), no
work proportional to the whole map per frame (cull by chunk, update only what is near the player).
Device pixel ratio is capped (low 1.25, medium 1.75, high 2.25). Safari 15+ features only: no WebGPU,
no top-level await in the bundle. The map is `MAP_SIZE` = 4096 m a side: plan memory and load time
for that (target: the whole game ready within about 4 s on the phone).

## Conventions (`core/types.ts`, `core/math.ts`)

Metres, seconds, radians. x east, y up, z south. The map is `[0, size] × [0, size]`. **The land is
flat**: ground, roads, bridges and boardwalks are at y = 0, the water surface is at `WATER_Y` (just
below) everywhere, the swamp bed at `SWAMP_FLOOR`, deep water bed at `WATER_FLOOR`. Stunt ramps are the
only slopes. Heading `yaw` is three.js `rotation.y`: forward = `(sin yaw, 0, cos yaw)`, yaw 0 faces
+z. Right = `(−cos yaw, 0, sin yaw)`. Traffic keeps right. Vehicle orientation is
`rotation.set(pitch, yaw, roll, 'YXZ')`. The simulation runs in fixed steps of `SIM_DT` (1/60 s).
(Type names say "City" for the whole map for historical reasons.)

## The map: `CityMap` (generated once by `src/world`, read by everyone)

**Roads** are axis-aligned. `nodes` are junctions; `edges` join two nodes along x or z and have a
class (`ROADS` in `core/config.ts`: street, avenue, expressway, and `rural`, a two-lane country road
with no sidewalk). `lanes` are directed driving lanes from junction square to junction square with
`out` links; `walks` are sidewalk segments linked at both ends. **Trails** (`trails`) are winding
polylines through the wilderness (dirt, or boardwalk over water): not part of the road graph, painted
into the surface raster, shown on the minimap, used for off-road races and patrols.

`blocks` are the land inside the sidewalks. `buildings` are stacks of axis-aligned boxes (`parts`)
with a facade `style` (including `datacenter` and the wilderness `shack`), a `seed` and the side
facing the street; the unique ones carry `landmark` and use the sizes in `LANDMARKS`. `props` are
street furniture, rooftop clutter and the big things that grow or lie in the wild (`PROPS` says which
are solid, which break, which carry their own size, and which are `nature`). Small vegetation (ferns,
reeds, grass, flowers) is NOT in `props`: the terrain renderer scatters it by rule from the surface
raster. `ramps` are stunt wedges. `pois` are named places: the safehouse, garages, hidden chop shops,
job contacts, parked vehicles (including boats at docks), police checkpoints, outposts, sparks
(collectibles), viewpoints, race starts. `surface` is a raster (`SURF_CELL` = 2 m) of `Surface`
values; `SURFACES` in `core/defs.ts` says how each behaves (grip, drag, shallow or deep water, walking
speed). `district` is a coarser raster of `DISTRICT_IDS` indices.

`core/query.ts` works on any CityMap and never allocates: `surfaceAt`, `groundY`, `districtAt`,
`queryColliders` / `queryProps` (grid candidates in a rectangle), `nearestLane`, `raycast` (against
solid boxes; unit direction), `lineOfSight`. `paintRect` / `paintPath` fill rasters. `finalizeCity(draft)`
derives `colliders` (one box per building part and per solid prop) and the grids; worldgen must end
with it.

`core/fixture.ts` `fixtureCity()` is a small (1024 m), plain map that obeys the whole contract: a
city grid with a canal and a bridge, and a strip of forest, swamp, beach and sea with a trail, a
boardwalk, a shack, a country road, and one of each interesting vehicle parked (car, sports car,
police cruiser, truck, buggy, hover-bike, boat). **Use it in your harness and tests**; do not depend
on the real generator's layout (it is being written at the same time as your module). Anything you
build must work for any `map.size` and any valid CityMap.

## The game: `GameState` (pools of plain objects, see `core/state.ts`)

`player` (on foot or in a vehicle; health, armor, the gadget in hand), `vehicles` (pool of
`MAX_VEHICLES`), `peds`, `drones`, `critters` (wildlife), `shots`, `pickups`, `propsDown` (which props
are knocked over), `heat` (the Safety Flag level), `mission` (what the HUD shows: objective, timer,
world markers), `progress` (what is saved: Tokens, finished jobs, sparks, owned vehicles, gadget
charges, outfit), `time`, `clock` (time of day). Entities are reused by flipping `active`; nothing is
allocated after `createGame`.

Per fixed step, main calls, in order: `stepAI(game, map, dt)` → `stepGame(game, map, controls, dt)`
→ `stepMissions(game, map, dt)`. Then once per frame: camera rig update, `renderer.update`, `render`.

* **sim** moves the player and every awake vehicle from their inputs (wheeled vehicles, the
  hover-bike, boats; surface effects from `SURFACES` and each vehicle's `offroad`), resolves
  collisions against the map and each other, handles getting in and out (including pulling a driver
  out and breaking into locked parked vehicles), gadgets, pickups, water, respawn, and emits events
  (`core/events.ts`): `crash`, `land`, `enter`, `exit`, `jack`, `crime`, `pulse`, `zap`, `gadget`,
  `pickup`, `splash`, `propBroken`, `pedHit`, `respawn`, `stunt`, `boost`, `horn`.
* **ai** (wave 2) owns everything with a mind: it spawns and removes traffic, boats, people, wildlife
  and police near the player, writes `throttle / steer / brake / handbrake / boost` on the vehicles
  it drives before sim runs, moves `peds`, `drones` and `critters`, turns `crime` events into the
  flag level and runs the chase. Until it exists there is no traffic: sim must still handle parked
  and abandoned vehicles, and vehicles with a `driverLook` (so jacking can be tested).
* **missions** (wave 2) owns `game.mission`, `game.progress`, dialogue, rewards and the save format.

`Controls` (`core/types.ts`) is what the player asks for this frame, the same on every device. The
edge flags (`enter`, `fire`, `gadgetNext`, `radio`, `interact`, `horn`, `camera`, `map`, `pause`) are
true for exactly one frame. `camYaw` is filled in by main from the camera rig so stick-forward means
away from the camera.

## Rendering contracts

* `src/render/index.ts` `createGameRenderer(canvas, map, quality)` owns the WebGLRenderer, scene,
  sky, sun / moon, fog, shadows and the `RenderEnv` for the frame; draws everything that moves by
  instancing models from `src/render/models`; draws mission markers, pickups, shots and effects; and
  adds `createCityView(...)` and `createTerrainView(...)` to the scene, calling their `update` every frame.
* `src/render/terrain/index.ts` `createTerrainView` draws the soft ground for the whole map from the
  surface raster (grass, park lawn, sand, dirt, forest floor, swamp, with soft blended edges), the
  water everywhere, the `nature` props and the scattered undergrowth. Under hard surfaces its ground
  sits a few centimetres below y = 0 so the city's geometry covers it without z-fighting.
* `src/render/city/index.ts` `createCityView` draws the hard, exact geometry at y = 0 and above:
  roads and junctions with markings, sidewalks and kerbs, plazas and lots (from `blocks`), bridges,
  boardwalks (from `trails`), ramps, buildings, landmarks, every prop that is not `nature`; and
  paints the minimap picture of the whole map.
* `src/render/models/index.ts` returns geometry with `position`, `normal`, `color`, `aGlow`,
  `aPaint` (see the file header). Vehicles get their paint and characters their outfit colour
  through the instance colour wherever `aPaint` is 1. `src/render/materials.ts` (scene-render's)
  is the shared material that understands `aGlow` / `aPaint`; city-render and terrain use it for props.
* Characters are six rigid parts (`CHAR_PARTS`) posed by `poseCharacter`. All people on screen are
  drawn with one instanced mesh per part per body type. Wheels are instanced per vehicle kind.

## Interface rules (for anything on screen)

`src/theme.css` holds the colours, panel style, font stack and the `--safe-*` insets: use those
variables. Glassy dark panels (`--panel`) over the 3D view, cream text, clay for the primary
action. Inline SVG icons in one consistent rounded style; no emoji, no icon fonts, no web fonts.
Touch targets ≥ 48 px; nothing interactive inside the safe-area insets; text ≥ 12 px. The `#ui`
element covers the screen with `pointer-events: none`: set `pointer-events: auto` on real controls
only, so everything else falls through to the canvas (camera drag, mouse look). Layouts must work
from 667 × 375 (small phone, landscape) up to 2560 × 1440, and must not assume a touch screen or a
keyboard: show the prompts for whichever `controls.scheme` is in use. The minimap goes bottom-left;
on touch screens the left stick area starts above and beside it.
