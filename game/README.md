# Syfon v1.4

A small first-person shooter built for the **Godot Engine** (not a browser/HTML game — it runs as a real desktop application). A 50x50 arena with pillars, cover walls and crates, real-time lighting and shadows, physics-based movement, a scoped weapon with reload/aim/recoil animation, a player health system, and enemy robots that patrol, chase, and shoot back.

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
  - **Left Click** — shoot (with recoil kick)
  - **Right Click (hold)** — aim down the scope (zooms FOV, centers the gun)
  - **R** — reload (magazine drops out and slides back in, ~1.6s, can't fire mid-reload)
  - **Esc** — release the mouse cursor

Shoot the red cylinder targets for points. The robots (red-eyed, patrolling near their spawn point) will chase you down and shoot back once they spot you — killing one also scores a point, and both targets and robots respawn after a delay. Getting shot costs health (shown top-left, with a red screen flash); at 0 you respawn after a couple of seconds.

## Project structure

```
game/
  project.godot          # engine/project settings, autoloads
  scenes/
    main.tscn             # the arena: lighting/sky, walls, pillars, cover walls, crates, targets, bots, HUD
    player.tscn            # FPS controller: capsule body, camera, kitbashed scoped gun, hit-scan raycast
    target.tscn             # shootable static target
    bot.tscn                 # robotic enemy: kitbashed body + AI script
  scripts/
    player.gd               # movement, mouse-look, shooting, health/death
    target.gd                # hit/respawn logic
    bot.gd                    # patrol/chase/attack AI state machine, hitscan weapon, health/respawn
    game_state.gd             # autoload singleton tracking score + player health
    hud.gd                     # crosshair/score/health UI binding, damage flash
```

## How the bot AI works

Each bot (`bot.gd`) is a state machine — `PATROL` → `CHASE` → `ATTACK` — driven purely by distance and line-of-sight checks against the player each physics frame (no navmesh baking, since that requires the editor's bake step; bots move in straight lines toward their target and rely on `CharacterBody3D`'s built-in wall-sliding, so they're fine in this obstacle layout but can occasionally snag on tight concave corners).
- **Patrol**: wanders to random points within `patrol_radius` of its spawn.
- **Chase**: sprints straight at the player once it's within `detection_radius` and has clear line of sight.
- **Attack**: stops and fires a hitscan shot at the player every `fire_cooldown` seconds once within `attack_range`, with a little aim spread.
- Getting shot enough times (`max_health` on the bot) kills it; it respawns at its spawn point after `respawn_time`.

All of those are `@export` vars on the Bot node, so you can tune difficulty per-instance in the editor's Inspector without touching code.

## Extending it

Natural next steps:
- Swap the `MeshInstance3D` blockout meshes for real 3D models (Godot imports `.glb`/`.fbx` directly).
- Give bots a navmesh (`NavigationRegion3D` + `NavigationAgent3D`, baked in the editor) for proper pathfinding around obstacles instead of straight-line chasing.
- Add sound effects (gunshots, bot detection "alert" sting, footsteps) and a muzzle-flash light (`OmniLight3D`).
- Multiple levels: duplicate `main.tscn`, build a new layout, and swap `run/main_scene` in `project.godot` or add a level-select menu.
- A proper game-over screen instead of the current auto-respawn-after-death.

Ask and I can build any of these out next.

## Versioning

The project name (and this file's title) carries a version suffix, tracked in `VERSION`, bumped on every update you ask for.
