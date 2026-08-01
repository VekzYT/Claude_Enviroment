# Syfon v1.0

A small first-person shooter prototype built for the **Godot Engine** (not a browser/HTML game — it runs as a real desktop application). One arena, real-time lighting and shadows, physics-based movement, and shootable targets that respawn.

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
  - **WASD** — move
  - **Mouse** — look around
  - **Shift** — sprint
  - **Space** — jump
  - **Left Click** — shoot
  - **Esc** — release the mouse cursor

Shoot the red cylinder targets around the arena — they drop and respawn after ~1.4s, and your score ticks up top-left.

## Project structure

```
game/
  project.godot          # engine/project settings, input, autoloads
  scenes/
    main.tscn             # the arena: lighting/sky, floor, walls, cover crates, targets, HUD
    player.tscn            # FPS controller: capsule body, camera, kitbashed gun viewmodel, hit-scan raycast
    target.tscn             # shootable target
  scripts/
    player.gd               # movement, mouse-look, shooting
    target.gd                # hit/respawn logic
    game_state.gd             # autoload singleton tracking score
    hud.gd                     # crosshair/score UI binding
```

## Extending it

This is intentionally a small, playable slice — a shooting-range prototype, not a full campaign. Natural next steps:
- Swap the `MeshInstance3D` blockout meshes for real 3D models (Godot imports `.glb`/`.fbx` directly — drop files into the project and drag them into a scene).
- Add moving/shooting-back enemies (`CharacterBody3D` + a simple state machine) instead of static targets.
- Add a weapon HUD (ammo count, reload), sound effects, and a muzzle-flash light (`OmniLight3D`) for extra punch.
- Multiple levels: duplicate `main.tscn`, build a new layout, and swap `run/main_scene` in `project.godot` or add a level-select menu.

Ask and I can build any of these out next.

## Versioning

The project name (and this file's title) carries a version suffix, tracked in `VERSION`, bumped on every update you ask for.
