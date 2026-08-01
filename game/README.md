# Syfon v1.6

A small first-person shooter built for the **Godot Engine** (not a browser/HTML game — it runs as a real desktop application). A 50x50 arena with textured, trimmed walls and floor, pillars, cover walls and crates, real-time lighting and shadows, physics-based movement, three switchable weapons with their own animations, a bottom-of-screen health bar, and detailed robotic enemies that patrol, chase, and shoot back with their own tracers.

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
  - **WASD** — move (adds walk bob/sway to the camera and weapon)
  - **Mouse** — look around
  - **Shift** — sprint
  - **Space** — jump
  - **Left Click** — fire (guns) or slash (knife), with a visible tracer on gunfire
  - **Right Click (hold)** — aim (guns only) — the sniper's aim covers the screen with a real scope overlay
  - **R** — reload (guns only; magazine drops out and slides back in)
  - **Mouse Wheel / 1, 2, 3** — switch weapons, with a draw/holster dip animation
  - **E** — toggle the weapon list panel (top-right), highlighting your current weapon
  - **Esc** — release the mouse cursor

Shoot or slash the red cylinder targets and robots for points — the robots (patrolling near their spawn point) will chase you down and shoot back once they spot you, firing their own red tracers. Getting shot costs health, shown as a bar at the bottom of the screen with a red flash; at 0 you respawn after a couple of seconds.

## The three weapons

1. **Sniper** — highest damage (one-shots a robot), slowest fire rate and reload. Aiming brings up a genuine full-screen scope: heavy zoom, the weapon model hides, and a black circular vignette with a crosshair reticle covers the screen exactly like looking through an optic — not just an FOV zoom.
2. **Handgun** — the all-rounder: moderate damage, fast fire rate, quick reload, normal FOV-zoom aim (no screen overlay).
3. **Knife** — melee only, no reload, no aim. Left-click plays a fast swipe animation (arcs the blade across your view) with a short-range hit-check timed to the swing, dealing solid damage for the risk of getting close.

## Project structure

```
game/
  project.godot          # engine/project settings, autoloads
  scenes/
    main.tscn             # the arena: lighting/sky, textured walls/floor, trim, pillars, cover walls, crates, targets, bots, HUD
    player.tscn            # FPS controller: capsule body, camera, three kitbashed weapons (sniper/handgun/knife), hit-scan raycast
    target.tscn             # shootable static target
    bot.tscn                 # robotic enemy: detailed kitbashed body + AI script
  scripts/
    player.gd               # movement, mouse-look, weapon switching/aim/reload/melee, health/death
    target.gd                # hit/respawn logic
    bot.gd                    # patrol/chase/attack AI state machine (obstacle avoidance + combat strafing), hitscan weapon, health/respawn
    game_state.gd             # autoload singleton: score, player health, active weapon, weapon-panel/scope UI state
    hud.gd                     # crosshair/score/health-bar/weapon-panel/scope-overlay UI binding, damage flash
    effects.gd                 # autoload: spawns the tracer line for every gunshot fired
```

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
- Add sound effects (gunshots, knife swipes, bot detection "alert" sting, footsteps) and a muzzle-flash light (`OmniLight3D`).
- Ammo counts and a reload-when-empty requirement instead of unlimited ammo.
- Multiple levels: duplicate `main.tscn`, build a new layout, and swap `run/main_scene` in `project.godot` or add a level-select menu.
- A proper game-over screen instead of the current auto-respawn-after-death.

Ask and I can build any of these out next.

## Versioning

The project name (and this file's title) carries a version suffix, tracked in `VERSION`, bumped on every update you ask for.
