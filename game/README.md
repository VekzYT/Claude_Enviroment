# Syfon v1.15

A small first-person shooter and island explorer built for the **Godot Engine** (not a browser/HTML game — it runs as a real desktop application). Starts at a real main menu with settings, then drops you onto a circular island ringed by a shader-animated ocean, with two raised hills to climb, real-texture grass and sand underfoot, wind-swaying grass blades and tree foliage, patches of pine and broadleaf forest, scattered rocks, snow-capped mountains on the distant horizon, and a small village of red-roofed houses — with a compass and a landmark-discovery system to guide exploration, glowing collectible relics to hunt down, a central combat clearing holding a watchtower, barrels, pillars, cover walls and crates, real recorded sound effects and music, real-time lighting, shadows, fog and anti-aliasing, physics-based movement, three switchable weapons (including a dashing one-hit-kill knife), blood-spray and hit-marker feedback, a fleshed-out HUD, and human soldier enemies — each with their own uniform and gear color scheme — that walk, flinch, collapse when killed, and shoot back with imperfect (not aimbot) accuracy.

## What's new in v1.15

- **Real photo textures**: downloaded CC0 PBR texture sets (albedo, normal map, roughness map) from [Poly Haven](https://polyhaven.com) for grass, sand, rock, and wood, and wired them into the ground, mountains, walls, watchtower, cover walls, hill ramps, and crates — replacing the earlier procedural noise-based materials with real photographed surface detail. Credits in `textures/CREDITS.md`.
- **Custom shaders**: three hand-written `.gdshader` files. `shaders/ocean.gdshader` animates the ocean surface with real vertex-displaced rolling waves (with matching recomputed normals), a fresnel-driven shallow/deep color blend, and a shimmer effect — replacing the old static water material. `shaders/grass_wind.gdshader` sways every one of the 4,000+ grass blades individually based on world position and time, so wind ripples naturally across the field instead of every blade moving in lockstep. `shaders/foliage_wind.gdshader` does the same for tree canopies, swaying the top of each foliage cluster while keeping trunks rigid.
- The ocean's mesh was switched from a flat disc to a properly subdivided plane so the new wave shader actually has enough geometry to displace smoothly instead of looking faceted.

## What's new in v1.14

- **Fixed a critical movement bug**: the entire island floor, the shoreline boundary, and the shooting-range targets were built on `CylinderShape3D` collision, which Godot's default physics engine (GodotPhysics3D) silently does not support — it's a Jolt-only shape. That meant the ground had zero real collision, so the player fell straight through the world on load. All of that collision has been rebuilt on `BoxShape3D`, which is universally supported. Movement is fixed.
- **Better rendering**: added atmospheric fog, screen-space indirect lighting (SSIL) on top of the existing SSAO, tuned bloom/glow, a secondary sky-fill light for softer shadows, and enabled MSAA + screen-space anti-aliasing project-wide.
- **Real terrain**: two climbable grass-topped hills (with ramps up) now break up the island's flat ground, each doubling as a discoverable lookout point.
- **Leaning into exploration**: added a compass to the HUD, a landmark-discovery system (walk near the watchtower, any of the four houses, or either hill for a "Discovered: ..." banner, inspired by the tower/shrine discovery pings in games like *Breath of the Wild*), and six glowing collectible relics scattered at hilltops, the watchtower platform, and quiet coastal corners, tracked by a new HUD counter.

## What's new in v1.13

- **Full island overhaul**: the old walled square arena is gone. The map is now a circular island (with four merged coastal peninsulas for an organic coastline) surrounded by open ocean, bounded by an invisible shoreline barrier so there's nowhere to fall off the world. Distant snow-capped mountains sit on the horizon beyond the water.
- **Real grass and forest**: a procedural scattering system (`scripts/nature_scatter.gd`) plants ~90 pine and broadleaf trees, ~22 rocks, and over 4,000 individual grass blades (rendered as a `MultiMesh` cross-quad field with per-blade color variation) across the island, automatically avoiding water, buildings, and the central battle clearing — deterministic every run via a fixed seed.
- **Humans instead of robots**: the enemy model was completely rebuilt from a robotic chassis (antenna, glowing eye, armor plates) into a low-poly human soldier — head, torso, arms, legs, boots, cap, vest, backpack, and a held rifle. Each of the 7 enemies now has its own uniform (shirt/pants/gear colors) and a couple even have distinct skin tones, via the same runtime material-variant system as before, just re-themed.
- **More detail everywhere**: crates got strap trim, barrels got banding rings, pillars got a base ring in addition to the existing cap ring, and all four houses (the two original CQB buildings plus two new small cabins) got chimneys and door lintels/frames on top of their pitched roofs.
- Gameplay layout (watchtower, cover walls, pillars, crates, barrels, houses, bots, targets) was redesigned to fit the new circular island instead of the old square footprint.

## What's new in v1.12

- **Iceland-themed map**: the sky, ground, and walls were recolored for a cold Icelandic look (pale sky, mossy-green ground, basalt-grey rock walls, frosted trim), and 8 snow-capped mountains now ring the map's horizon beyond the perimeter walls.
- **Houses**: the two CQB buildings were reskinned as proper houses — white walls, dark red pitched (gabled) roofs replacing the old flat rooftops — and two brand-new small decorative cabins were added out in Area B.
- **Bots got distinct looks**: each of the 7 bots now has its own paint scheme (arctic white, moss green, volcanic black, steel blue, desert tan, crimson, plus the original grey/red) instead of all sharing one identical appearance, via new exported color properties on the bot script.

## What's new in v1.11

- **Better floor/wall graphics**: the procedural surface textures went from 512px to 1024px, both floor and walls now get a roughness texture (so specular highlights vary across the surface instead of looking uniformly matte/flat) and stronger normal-map bump, and the floor got a subtle metallic hint for a sealed-concrete sheen. Added real geometric detail too: 16 vertical seam strips along the perimeter walls (breaking up the flat 50-unit runs) and 4 floor expansion-joint lines, all in the same dark trim material already used for baseboards.
- **Bots are no longer aimbots**: their shot spread is now distance-scaled (tight up close, noticeably worse at range — realistic falloff instead of pinpoint accuracy at any distance), they take a beat (`0.6s`) to react the first time they spot you before opening fire, and their fire rate dropped slightly (`1.1s` → `1.5s` between shots). All four values (`base_spread`, `spread_per_distance`, fire rate, reaction delay) are `@export` on the Bot node if you want to retune the difficulty further.

## What's new in v1.10

- **Main menu**: the game now opens on a proper title screen (Play / Settings / Quit) instead of dropping straight into the arena. `scenes/main_menu.tscn` is the new entry point (`run/main_scene` in `project.godot`).
- **Settings menu**: Master/Music/SFX volume sliders (routed through real Godot audio buses) and a mouse sensitivity slider, saved to `user://settings.cfg` so they persist between runs. Reachable from the main menu and from the new pause menu.
- **Pause menu**: press **Esc** during a match to pause (the game world actually freezes via `get_tree().paused`) and get Resume / Settings / Quit-to-Main-Menu — replacing the old "Esc just releases the mouse" behavior.
- **Knife dash + cooldown**: attacking with the knife now lunges you forward in a quick burst timed with the swing, and locks the knife for `1.1s` afterward (shown as a small readiness bar under the crosshair) — no more spamming it.
- **HUD overhaul**: hit markers (a flash at the crosshair when a shot or slash actually connects), the new knife-cooldown bar, a background panel behind the score (matching the health bar's style), and a pulsing low-health screen warning below 25 HP, on top of everything from before.

## What's new in v1.9

- **Real sound effects and music**: replaced last version's procedurally-synthesized placeholder audio with actual recorded/produced sounds, researched and downloaded from free-licensed asset libraries (Kenney.nl and OpenGameArt.org) — real gunshot recordings (CZ-52 pistol, Mosin Nagant rifle, SKS) trimmed to single shots, real reload/bolt-rack sounds, real sword swing/clash sounds for the knife, real footsteps/impacts/UI clicks, and a licensed background music loop. Every source and license is listed in `audio/CREDITS.md` — **the music track is CC-BY and requires attribution if you distribute this project**; everything else is CC0 (no attribution needed). See "Audio" below for full details.
- **Two enterable buildings**: small CQB structures (open doorway, a low "window" wall you can shoot/see over, a roof, and an interior light) placed at opposite corners of the main arena, giving the map actual buildings to fight through instead of only open cover — more in line with a Call of Duty-style multiplayer map.

## What's new in v1.7

- **Blood effects**: every hit that lands on a bot, a target, or the player now spawns a small red particle burst at the impact point, oriented off the surface normal.
- **Buffed weapon animations**: a subtle always-on idle sway when standing still; the sniper's bolt visibly cycles (lifts, slides back, slides forward, drops) during reload; the handgun's slide racks backward and snaps forward; the knife swing is now a proper three-phase windup → slash → recover arc instead of a simple symmetric wave.
- **Buffed bot animations**: legs now swing through a walk cycle while patrolling/chasing, bots flinch (a quick backward jolt) when hit, and dying now plays a toppling collapse instead of instantly vanishing.
- **Map upgrade**: added a watchtower (four legs, a railed platform, and a walkable ramp at a safe ~31° incline) for a sniping vantage point and some verticality, plus six barrel props scattered around for extra cover variety.

## Why Godot

Godot is free, open-source, and its projects are plain text files, which is what let this be built directly as code here. It has a modern renderer (Vulkan-based "Forward+") that gives real dynamic shadows, ambient occlusion, glow, and a physically-shaded sky out of the box.

## 1. Install Godot

1. Go to https://godotengine.org/download and download the **Godot 4.3** (or newer 4.x) build for your OS — get the *Standard* version (not .NET/C#, this project only uses GDScript).
2. It's a single executable — no installer, no admin rights needed. Unzip it and run it.

## 2. Open the project

1. Launch Godot. On the Project Manager screen, click **Import**.
2. Browse to this `game/` folder and select `project.godot`.
3. Click **Import & Edit**.

## 3. Run it

- Press **F5** (or the ▶ Play button, top-right) to run the game. It opens on the main menu — click **Play** to drop into the arena.
- Click into the game window to capture the mouse, then:
  - **WASD** — move (adds walk bob/sway to the camera and weapon)
  - **Mouse** — look around
  - **Shift** — sprint
  - **Space** — jump
  - **Left Click** — fire (guns) or dash-slash (knife), with a visible tracer on gunfire and a hit marker on a landed hit
  - **Right Click (hold)** — aim (guns only) — the sniper's aim covers the screen with a real scope overlay
  - **R** — reload (guns only; magazine drops out and slides back in)
  - **Mouse Wheel / 1, 2, 3** — switch weapons, with a draw/holster dip animation
  - **E** — toggle the weapon list panel (top-right), highlighting your current weapon
  - **Esc** — pause (freezes the game, opens Resume / Settings / Quit to Main Menu)

Shoot or slash the red cylinder targets and robots for points — the robots (patrolling near their spawn point) will chase you down and shoot back once they spot you, firing their own red tracers. Getting shot costs health, shown as a bar at the bottom of the screen with a red flash (and a pulsing screen warning under 25 HP); at 0 you respawn after a couple of seconds.

## The three weapons

1. **Sniper** — highest damage (one-shots a robot), slowest fire rate and reload. Aiming brings up a genuine full-screen scope: heavy zoom, the weapon model hides, and a black circular vignette with a crosshair reticle covers the screen exactly like looking through an optic — not just an FOV zoom.
2. **Handgun** — the all-rounder: moderate damage, fast fire rate, quick reload, normal FOV-zoom aim (no screen overlay).
3. **Knife** — melee only, no reload, no aim, **one-hit kill** on anything. Left-click dashes you forward in a quick burst while playing a three-phase windup/slash/recover swipe animation, with a short-range hit-check timed to land mid-slash. Locked out for `1.1s` after each use (shown as a small bar under the crosshair) — high risk (you have to close the distance and then wait) for a guaranteed kill.

## Project structure

```
game/
  project.godot          # engine/project settings, autoloads
  audio/
    sfx/                   # gunshots, reloads, knife, footsteps, impacts, UI clicks (see CREDITS.md)
    music/                  # background music loop (see CREDITS.md)
    CREDITS.md               # source + license for every audio file
  scenes/
    main_menu.tscn         # title screen: Play / Settings / Quit — this is run/main_scene
    main.tscn             # both areas: lighting/sky, textured walls/floor, trim, tunnel, buildings, pillars, cover walls, crates, barrels, targets, bots, HUD, pause menu
    player.tscn            # FPS controller: capsule body, camera, three kitbashed weapons (sniper/handgun/knife), hit-scan raycast
    target.tscn             # shootable static target
    bot.tscn                 # robotic enemy: detailed kitbashed body + AI script
    settings_panel.tscn       # reusable volume/sensitivity panel, instanced into both the main menu and the pause menu
  scripts/
    main_menu.gd             # main menu button wiring
    pause_menu.gd             # in-game pause menu (attached to main.tscn's PauseMenu node): freezes the tree, Resume/Settings/Quit
    settings_panel.gd          # slider <-> Settings autoload wiring, shared by both menus
    player.gd               # movement, mouse-look, weapon switching/aim/reload/melee (incl. knife dash+cooldown), health/death, sound triggers
    target.gd                # hit/respawn logic
    bot.gd                    # patrol/chase/attack AI state machine (obstacle avoidance + combat strafing), hitscan weapon, health/respawn, sound triggers
    game_state.gd             # autoload singleton: score, player health, active weapon, weapon-panel/scope/knife-cooldown UI state, hit-marker event, reset()
    settings.gd                # autoload singleton: master/music/sfx volume (via real audio buses) + mouse sensitivity, persisted to user://settings.cfg
    hud.gd                     # crosshair/hit-marker/score-panel/health-bar/knife-cooldown-bar/weapon-panel/scope-overlay/low-health-pulse UI binding
    effects.gd                 # autoload: spawns the tracer line and blood-spray particles for every hit
    sound.gd                   # autoload: loads every sound file from audio/, plays them positionally (play_3d) or flat (play_ui), routed to the Music/SFX buses
```

## Audio

Every sound in the game is a real audio file (not a placeholder tone) sourced from free asset libraries — see `audio/CREDITS.md` for the exact source and license of each file. Highlights:
- Gunshots are real recordings (CZ-52 pistol for the handgun, Mosin Nagant rifle for the sniper, SKS for bot fire), trimmed down from longer multi-shot recordings to a single isolated shot each.
- Knife swing/hit use real sword-on-sword recordings.
- Footsteps, reloads, impacts, and UI sounds are all real recordings/produced SFX, not synthesized.
- The music is a licensed loop (CC-BY, **requires attribution if you distribute this project** — see CREDITS.md).

`sound.gd` loads every file once at startup into a `Dictionary` and exposes `play_3d(name, position, volume_db, pitch_variance)` for positional world sounds (gunfire, footsteps, bot audio — these fall off with distance) and `play_ui(name, volume_db)` for flat mechanical/UI sounds. Footsteps randomly pick from 5 variations each step. Want to swap any sound for your own? Drop a file into `audio/sfx/` or `audio/music/` and point the matching `load()` call in `sound.gd` at it.

## What's new in v1.6

- **Three weapons**: Sniper, Handgun, and Knife, each with their own kitbashed model, stats, and behavior (see above). Switch with the scroll wheel or number keys 1/2/3; switching plays a dip-down/rise-up draw-and-holster animation and briefly locks out firing.
- **Weapon list panel**: press **E** to toggle a panel (top-right) listing all three weapons with the active one highlighted.
- **Real sniper scope**: aiming with the sniper doesn't just zoom the camera — it shows a full-screen circular vignette (generated procedurally at runtime, no image assets) with its own reticle, and hides the weapon model, like looking through genuine glass.
- **Knife melee**: a fast swipe animation with a short-range hit-check timed to land partway through the swing.
- **Toned-down visual style**: removed the glowing cyan/amber/red emissive accents from the gun, environment trim, and bot markers in favor of flat, grounded tactical colors (gunmetal, tan, matte red, painted hazard-stripe yellow) — less sci-fi, more military/industrial. Overall scene glow intensity was also reduced.
- Bot max health rebalanced (3 → 100) to match the new weapon damage scale: one sniper shot, two knife hits, or four handgun shots to kill.

## How the bot AI works

Each bot (`bot.gd`) is a state machine — `PATROL` → `CHASE` → `ATTACK` — driven by distance and line-of-sight checks against the player each physics frame (no navmesh baking, since that requires the editor's bake step; bots steer toward their target with a simple raycast-based obstacle deflection plus `CharacterBody3D`'s built-in wall-sliding, which handles this obstacle layout well but isn't true pathfinding).
- **Patrol**: wanders to random points within `patrol_radius` of its spawn.
- **Chase**: sprints straight at the player once it's within `detection_radius` and has clear line of sight.
- **Attack**: strafes side to side and fires a hitscan shot (with a visible tracer) at the player every `fire_cooldown` seconds once within `attack_range`, with a little aim spread. Keeps attacking for `1.5s` after losing line of sight before giving up and returning to patrol.
- Getting shot enough times (`max_health` on the bot) kills it; it respawns at its spawn point after `respawn_time`.

All of those are `@export` vars on the Bot node, so you can tune difficulty per-instance in the editor's Inspector without touching code.

## Extending it

Natural next steps:
- Swap the `MeshInstance3D` blockout meshes for real 3D models (Godot imports `.glb`/`.fbx` directly).
- Give bots a navmesh (`NavigationRegion3D` + `NavigationAgent3D`, baked in the editor) for proper pathfinding around obstacles instead of raycast-deflected straight-line chasing.
- A muzzle-flash light (`OmniLight3D`) synced to each shot for extra punch.
- More buildings/lanes for a fuller Call-of-Duty-style 3-lane layout, and a proper composed/looped score instead of the single licensed track.
- Ammo counts and a reload-when-empty requirement instead of unlimited ammo.
- Multiple levels: duplicate `main.tscn`, build a new layout, and swap `run/main_scene` in `project.godot` or add a level-select menu.
- A proper game-over screen instead of the current auto-respawn-after-death.

Ask and I can build any of these out next.

## Versioning

The project name (and this file's title) carries a version suffix, tracked in `VERSION`, bumped on every update you ask for.
