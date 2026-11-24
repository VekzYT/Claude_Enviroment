# Cubopolis — architecture

Cubopolis is an original voxel city builder for iPhone (built and tested against an iPhone 15 Pro,
held in landscape). It is a TypeScript + Three.js web game bundled into one script and wrapped in a
native iOS app by Capacitor 7. Nothing is loaded from the network at runtime: no CDNs, no fonts, no
sound files. Every model, texture and sound is generated in code.

## How it ships

```
city/
  src/            game source (TypeScript)
  www/            build output (index.html, game.js, game.css) — made by tools/build.mjs
  ios/App/        the Xcode project. ios/App/App/public/ is a committed copy of www/,
                  so the Mac that builds the app needs only Xcode, never Node.
  tests/          node:test unit tests (run with `npm test`)
  tools/          build, serve, smoke-test and asset scripts
```

* `npm run build` → `www/`. `node tools/build.mjs --ios` also copies `www/` into the Xcode project.
* `npx tsc --noEmit` must pass with zero errors.
* `npm test` runs `tests/*.test.ts` with Node's test runner through `tsx`.
* `node tools/serve.mjs` serves `www/` on http://localhost:5173 for browser testing.
* `.github/workflows/cubopolis-ios.yml` builds the Xcode project on a Mac runner and boots the app in
  the iOS simulator. The game must `console.log('CUBOPOLIS_BOOT_OK')` once its first frame is drawn.

The iOS side (`ios/App/App/GameViewController.swift`) hides the status bar and home indicator, defers
edge swipes, and exposes one script message handler, `window.webkit.messageHandlers.cubopolis`,
whose `postMessage({...})` returns a Promise:

| message | reply |
|---|---|
| `{op:'haptic', style}` (style: light, medium, heavy, selection, success, warning, error) | `true` |
| `{op:'save', slot, data}` (slot: letters/digits/-/_; data: string) | `true` |
| `{op:'load', slot}` | the string, or `null` if there is none |
| `{op:'delete', slot}` | `true` |

`src/platform/native.ts` wraps it and falls back to `localStorage` / no haptics in a normal browser.

## Target device and performance

* iPhone 15 Pro, landscape: the CSS viewport is **852 × 393** at devicePixelRatio 3. Safe-area insets
  in landscape are about **59 px left and right** (Dynamic Island / rounded corners) and **21 px at the
  bottom** (home indicator). Use `env(safe-area-inset-*)`. Nothing tappable may sit inside them.
* Touch targets at least 44 × 44 CSS px. Text at least 12 px; numbers people read often at least 14 px.
* 60 fps on the device with a full 64×64 city. Budget: ≤ 150 draw calls, ≤ 400k triangles on screen,
  no per-frame allocation in hot paths, no work proportional to the map size every frame (only on change).
* WebKit (Safari 15+ features only). No `structuredClone`-only paths, no top-level await, no WebGPU.

## Testing in a browser here (Linux, Chromium)

Playwright and Chromium are pre-installed. From an ES module use
`const { chromium } = createRequire(import.meta.url)('playwright')`. Do **not** run `playwright install`.
Emulate the phone with a context of `{ viewport: { width: 852, height: 393 }, deviceScaleFactor: 2,
isMobile: true, hasTouch: true }`. Chromium does not emulate safe-area insets, so the page accepts
`?safe=59,59,21` (left, right, bottom in CSS px) which main.ts turns into CSS variables
`--safe-left/--safe-right/--safe-bottom` on `<html>`; all CSS reads insets through those variables,
which default to `env(safe-area-inset-*)`. Headless WebGL runs on SwiftShader (software), so it is
slow: judge looks from screenshots, not frame rate.

Scratch output (screenshots, harness builds) goes in `city/.cache/` (git-ignored). A module may add
its own dev harness as `src/dev/<module>-*.ts` and scripts as `tools/dev/<module>-*.mjs`.

## Modules and who owns what

| folder | owner | what it does |
|---|---|---|
| `src/core/` | architect (frozen) | shared types, balance numbers, building catalog, state helpers, event bus, rng |
| `src/sim/` | sim | map generation, simulation, tools/actions, undo, inspect text, save format |
| `src/render/` (except `models/`) | world | Three.js scene, terrain, water, roads, lots, instancing, cars, overlays, preview, picking, lighting |
| `src/render/models/` | models | voxel art: every building, tree and car as geometry; app icon and splash |
| `src/input/` | input | touch and mouse gestures, camera rig, turning drags into plans |
| `src/ui/` | ui | the HTML interface: HUD, toolbar, panels, title screen, tips, settings |
| `src/audio/`, `src/platform/` | audio | synthesised sound and music; the native bridge, saves and settings storage |
| `src/main.ts`, `src/index.html`, `tools/` | integrator | boot, frame loop, wiring, smoke tests |

Each module's `index.ts` already exports the functions and interfaces other modules call, with a
placeholder body. **Keep every exported signature exactly as it is** (you may add exports). Do not edit
files outside your folder. `src/core/` is frozen: if you need something there, define it locally and
list the request in your final report; the integrator decides.

## The data model (src/core)

* The map is `size × size` tiles (64). Tile `(x, z)`: x runs east, z runs south, index `z * size + x`.
  World units: 1 tile = 1 unit, tile `(x, z)` covers world `[x, x+1] × [z, z+1]`, ground at `y = 0`.
* `GameState.tiles` is struct-of-arrays (`TileLayers`). **Primary layers** (`terrain, trees, kind,
  zone, level, variant, bld, distress`) are changed only by sim (actions, growth). **Derived layers**
  (`power, water, roadDist, pollution, landValue, problems`, service coverage) are written only by
  sim's `recompute` and read by everyone.
* Whenever a primary layer of tile `i` changes, sim calls `markTile(state, i)`, which adds `i` to
  `state.dirty` and bumps `state.rev.tiles`. The renderer consumes and clears `state.dirty`.
  Adding/removing a building bumps `state.rev.buildings`. Recomputing derived layers bumps
  `state.rev.derived` (overlays and status icons refresh on that).
* `state.buildings[id]` holds service/utility buildings; every footprint tile has
  `kind = Building, bld = id`. Removed buildings leave `null`.
* Developed lots are 1×1: `kind = Zone`, `zone`, `level 1..3`, `variant` picks the design.
* `state.timeOfDay` (0..1) is cosmetic and advanced by main.ts; `nightAmount()` turns it into darkness.
* Events (`core/events.ts`): sim emits `toast`, `milestone`, `month`, `applied`, `denied`, `grew`,
  `undo`, `reset`; UI, audio and main listen.

## Rules of the city (implemented by sim, explained by ui)

* **Roads** cost $10 a tile. Zones only develop with a road within 3 tiles (`ROAD_REACH`).
* **Zones** (Homes green, Shops blue, Industry yellow) cost $5 a tile. A lot grows level 0 → 1 → 2 → 3:
  level 1 needs road + power; level 2 also water and some desirability; level 3 high desirability.
  Growth also needs positive demand for that zone. Lots without what they need for `DECLINE_DAYS`
  drop a level.
* **Power and water** come from buildings with a capacity and a reach (radius, measured from the
  footprint edge). Lots in reach are supplied nearest-first until capacity runs out; empty lots in
  reach count as connected but use nothing. No pipes or wires to draw.
* **Services** (police, fire, health, education, parks) cover a radius and raise land value and
  happiness. Service buildings work only with a road touching them and power.
* **Demand** (RCI, -1..1): homes are wanted when there are jobs, shops when there are residents,
  industry when there are workers. Taxes above 9% lower demand, below raise it.
* **Money**: monthly taxes minus upkeep. Can't spend below $0. Milestones (Hamlet 150 people …
  Metropolis 12,000) pay a reward and unlock buildings.

## Look and feel

A bright, toy-like voxel world: chunky cubes, flat-shaded, saturated but soft colours, a gentle
per-voxel brightness jitter so surfaces read as built from blocks. Sunlit days with soft shadows, warm
golden dusk, deep-blue nights where windows, street lamps and headlights glow. The interface is
rounded, chunky and friendly to match: cream/white panels with soft shadows, big bold numbers, zone
colours (`ZONE_COLORS`) as accents, inline SVG icons in one consistent style (no emoji, no icon fonts,
no web fonts: use `-apple-system, system-ui, sans-serif`).

It must not imitate any existing game's look, characters, names or UI. Cubopolis is its own thing.
