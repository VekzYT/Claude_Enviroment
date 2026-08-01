# Syfon v1.5

A small first-person shooter built for the **Godot Engine** (not a browser/HTML game — it runs as a real desktop application). A 50x50 arena with textured, trimmed walls and floor, pillars, cover walls and crates, real-time lighting and shadows, physics-based movement, a scoped weapon with reload/aim/recoil animation and visible tracer fire, a bottom-of-screen health bar, and detailed robotic enemies that patrol, chase, and shoot back with their own tracers.

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

- Press **F5** (or the ▶ Play button, top-right) to run the game.
- Click into the game window to capture the mouse, then:
  - **WASD** — move (adds walk bob/sway to the camera and gun)
  - **Mouse** — look around
  - **Shift** — sprint
  - **Space** — jump
  - **Left Click** — shoot (with recoil kick and a visible tracer streak)
  - **Right Click (hold)** — aim down the scope (zooms FOV, centers the gun)
  - **R** — reload (magazine drops out and slides back in, ~1.6s, can't fire mid-reload)
  - **Esc** — release the mouse cursor

Shoot the red cylinder targets for points. The robots (red-eyed, patrolling near their spawn point) will chase you down and shoot back once they spot you, firing their own red tracers — killing one also scores a point, and both targets and robots respawn after a delay. Getting shot costs health, shown as a bar at the bottom of the screen with a red screen flash; at 0 you respawn after a couple of seconds.

## Project structure

```
game/
  project.godot          # engine/project settings, autoloads
  scenes/
    main.tscn             # the arena: lighting/sky, textured walls/floor, trim, pillars, cover walls, crates, targets, bots, HUD
    player.tscn            # FPS controller: capsule body, camera, kitbashed scoped gun, hit-scan raycast
    target.tscn             # shootable static target
    bot.tscn                 # robotic enemy: detailed kitbashed body + AI script
  scripts/
    player.gd               # movement, mouse-look, shooting, health/death
    target.gd                # hit/respawn logic
    bot.gd                    # patrol/chase/attack AI state machine (with obstacle avoidance + combat strafing), hitscan weapon, health/respawn
    game_state.gd             # autoload singleton tracking score + player health
    hud.gd                     # crosshair/score/health-bar UI binding, damage flash
    effects.gd                 # autoload: spawns the bright tracer line for every shot fired
```

## What's new in v1.5

- **Health bar**: replaced the old top-left health text with a proper bar centered at the bottom of the screen (color-shifts green→red as it drops), plus a numeric readout on top of it.
- **Visible bullets**: every shot (yours and the bots') now draws a short, bright tracer streak from the muzzle to wherever it hit — cyan for you, red for bots — via a new `Effects` autoload, so gunfire actually reads as gunfire.
- **Floor/wall detail**: both now use a procedural noise texture (Godot's built-in `FastNoiseLite`/`NoiseTexture2D`, no external image files needed) for real per-pixel albedo + normal-map variation instead of flat color, plus actual trim geometry — glowing floor border strips and a center marker, dark baseboards and light cap trim on every wall, amber warning rings on the pillars, and amber accent stripes on the cover walls.
- **Smarter bots**: they now steer around obstacles instead of just walking into them (a short forward raycast deflects their movement along whatever they'd hit), strafe side-to-side while attacking instead of standing still, and keep chasing for 1.5s after losing sight of you instead of snapping back to patrol immediately.
- **More detailed bot model**: knee joints, a hip connector (no more floating torso), shoulder pauldrons, a back-mounted power core to match the chest core, side indicator lights, and a visor-slit eye instead of a single dot.

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
- Add sound effects (gunshots, bot detection "alert" sting, footsteps) and a muzzle-flash light (`OmniLight3D`).
- Multiple levels: duplicate `main.tscn`, build a new layout, and swap `run/main_scene` in `project.godot` or add a level-select menu.
- A proper game-over screen instead of the current auto-respawn-after-death.

Ask and I can build any of these out next.

## Versioning

The project name (and this file's title) carries a version suffix, tracked in `VERSION`, bumped on every update you ask for.
