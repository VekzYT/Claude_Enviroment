# Cubeworks

An original first-person voxel sandbox built with **Godot 4.3** and GDScript.
Chunked infinite terrain, block breaking and placing, a hotbar and backpack,
crafting, a day/night cycle, night creatures, health and fall damage, and a
save system that survives quitting.

Everything here is original: the code, the block names, the interface, and the
artwork — every texture is painted procedurally in `texture_baker.gd` at
startup, so the project ships with no image files at all.

---

## Running it

1. Install Godot **4.3** or newer (standard build, not .NET) from godotengine.org.
2. Open the Godot project manager, click **Import**, and pick
   `cubeworks/project.godot`.
3. Press **F5** (Run Project). The title screen appears; choose a seed and
   click **Shape the world**.

There is nothing to assemble by hand — the scenes are complete. The
"How the scenes are put together" section below explains the node trees anyway,
so you can rebuild or extend them.

### Controls

| Input | Action |
| --- | --- |
| `W A S D` | Walk |
| `Space` | Jump / swim up |
| `Shift` | Sprint (forward only) |
| `Ctrl` | Sneak (slower, and you will not walk off a ledge) |
| Mouse | Look |
| Left mouse | Hold to break the targeted block / hit a creature |
| Right mouse | Place the selected block |
| `1` – `9` | Pick a hotbar slot |
| Mouse wheel | Cycle hotbar slots |
| `E` | Open and close the backpack (with crafting) |
| `Q` | Drop one block (`Shift + Q` drops the stack) |
| `Esc` | Pause menu (settings, save, quit) |
| `F3` | Debug readout |
| `F11` | Fullscreen |

---

## File tree

```
cubeworks/
├── project.godot                     Engine config, autoloads, window, rendering
├── icon.svg                          Project icon
├── README.md                         This file
│
├── scenes/
│   ├── main_menu.tscn                Title screen (new world / continue)
│   ├── game.tscn                     The playable scene
│   └── player.tscn                   First-person character
│
├── scripts/
│   ├── game.gd                       Wires everything together; pause, save, respawn
│   │
│   ├── autoload/
│   │   ├── game_state.gd             Settings, seed, input map, scene switching
│   │   ├── block_db.gd               The block registry and shared materials
│   │   └── save_manager.gd           Sparse edit table, save/load to disk
│   │
│   ├── blocks/
│   │   ├── texture_baker.gd          Paints the 256x256 texture atlas in code
│   │   └── block_mesh.gd             Single textured cube (held item, previews)
│   │
│   ├── world/
│   │   ├── world.gd                  Chunk streaming, worker threads, raycasting
│   │   ├── chunk.gd                  One 16x128x16 column: data + 4 nodes
│   │   ├── chunk_mesher.gd           Voxels -> surfaces, face culling + AO
│   │   ├── terrain_generator.gd      Noise, biomes, caves, ores, trees
│   │   └── day_night.gd              Sun, moon, sky colours, ambient light
│   │
│   ├── player/
│   │   ├── player.gd                 Movement, camera, breaking, placing, damage
│   │   └── inventory.gd              36 slots, stacking, quick move, persistence
│   │
│   ├── entities/
│   │   ├── mob.gd                    "Gloomkin" night creature
│   │   └── mob_spawner.gd            Population control around the player
│   │
│   └── ui/
│       ├── ui_theme.gd               Colours, panels, buttons in one place
│       ├── crosshair.gd              The reticle
│       ├── slot_widget.gd            One inventory square
│       ├── hotbar.gd                 The nine belt slots
│       ├── hud.gd                    Crosshair, health, status, debug, death
│       ├── inventory_ui.gd           Backpack screen and crafting
│       ├── pause_menu.gd             Pause and settings
│       └── main_menu.gd              Title screen
│
├── assets/                           (empty by design - art is generated in code)
└── saves/                            (placeholder - real saves live in user://saves)
```

Saved worlds are written to Godot's user directory, not into the project:

* Linux: `~/.local/share/godot/app_userdata/Cubeworks/saves/`
* Windows: `%APPDATA%\Godot\app_userdata\Cubeworks\saves\`
* macOS: `~/Library/Application Support/Godot/app_userdata/Cubeworks/saves/`

---

## How the scenes are put together

If you ever need to rebuild these by hand, this is the exact structure.

### `scenes/player.tscn`

```
Player            CharacterBody3D     script: scripts/player/player.gd
├── Body          CollisionShape3D    CapsuleShape3D, radius 0.3, height 1.8,
│                                     positioned at y = 0.9 so the origin is at
│                                     the feet
└── Head          Node3D              at y = 1.62 (eye height)
    └── Camera    Camera3D            current = true, near 0.05
        └── HeldItem  MeshInstance3D  the block in your hand; shadows off
```

The script replaces the capsule at runtime so it can shrink when you sneak.

### `scenes/game.tscn`

```
Game                       Node3D          script: scripts/game.gd
├── World                  Node3D          script: scripts/world/world.gd
├── Sky                    Node3D          script: scripts/world/day_night.gd
│   ├── Sun                DirectionalLight3D   shadows on, 3 shadow splits
│   ├── Moon               DirectionalLight3D   shadows off, cool blue
│   └── WorldEnvironment   WorldEnvironment     filled in from code
├── Player                 (instance of player.tscn)
├── MobSpawner             Node            script: scripts/entities/mob_spawner.gd
└── UI                     CanvasLayer
    ├── HUD                Control         script: scripts/ui/hud.gd
    ├── InventoryUI        Control         script: scripts/ui/inventory_ui.gd
    └── PauseMenu          Control         script: scripts/ui/pause_menu.gd
```

Chunks are **not** in the scene file. `world.gd` creates them at runtime and
adds them under `World`.

### `scenes/main_menu.tscn`

```
MainMenu   Control (full rect)   script: scripts/ui/main_menu.gd
```

Everything it shows is built in code, so there is nothing else to place.

### Autoloads

Set in `project.godot`, in this order:

| Name | Script |
| --- | --- |
| `GameState` | `res://scripts/autoload/game_state.gd` |
| `BlockDB` | `res://scripts/autoload/block_db.gd` |
| `SaveManager` | `res://scripts/autoload/save_manager.gd` |

`GameState` also builds the whole input map at startup, so there is no input
section to fill in by hand in Project Settings.

---

## How the world works

**Chunks.** A chunk is 16 x 128 x 16 blocks stored as one `PackedByteArray`
(32 KB), indexed `(y << 8) | (z << 4) | x`. A chunk is exactly four nodes: two
`MeshInstance3D`s (solid and see-through) and one `StaticBody3D` with a
`ConcavePolygonShape3D`. There is never a node per block.

**Threading.** Generation and meshing both run on `WorkerThreadPool` threads,
capped at six jobs at a time. Worker code only touches plain byte arrays, never
the scene tree. Finished work is parked behind a mutex and attached to the tree
a few chunks per frame, so the frame rate never falls off a cliff while the
world streams in.

**Meshing.** The chunk plus a one-block skirt of its four neighbours is copied
into a flat "padded" buffer first, so finding a neighbour is one addition
instead of a function call and four bounds checks. Only faces touching
something see-through are emitted, and each corner gets an ambient-occlusion
value that is written into the vertex colour. A chunk is only meshed once all
four neighbours have voxels, which is why there are never seams between chunks.

**Edits.** Breaking or placing a block writes one byte, bumps that chunk's
revision, and queues just that chunk (plus a neighbour, if you touched a seam).
Nothing else is rebuilt.

**Saving.** The save file stores the seed and a sparse table of only the blocks
you changed — `chunk -> {voxel index -> block id}` — plus your position, health
and inventory. Untouched terrain costs nothing because it is regenerated from
the seed. Autosave runs every 90 seconds, and the game also saves when you
close the window.

---

## Extending it

**Add a block.** Two steps:

1. In `texture_baker.gd`, add a `const T_MY_BLOCK := 24` slot and a `match`
   branch in `_paint()` that draws it.
2. In `block_db.gd`, add a `const MY_BLOCK := 20`, bump `BLOCK_COUNT`, and add
   one entry to `_DEFS` with its name, six face tiles, solidity, break time and
   drop.

The mesher, hotbar, inventory, icons and save format all pick it up
automatically. Ids are stored in save files, so append new ones — never
renumber existing ones.

**Add a recipe.** One line in `_make_recipes()` in `inventory_ui.gd`.

**Change the world shape.** `surface_height()` and `biome_at()` in
`terrain_generator.gd` are pure functions of a coordinate. Everything else
follows from them.

**Add a creature.** Copy `mob.gd`, and spawn it from `mob_spawner.gd`. Mobs sit
on collision layer 4; the player's attack ray looks for that layer and calls
`take_damage(amount, knockback)`.

---

## Performance notes

Measured on the development machine, single-threaded, for one full chunk:

* terrain generation: ~8 ms
* meshing (worst case, no neighbours loaded): ~27 ms
* a typical chunk produces roughly 5,000 triangles

With six worker threads, a draw distance of 7 chunks (225 chunks) streams in
within a few seconds and then costs nothing until you move.

Things this project deliberately does **not** do: one node per block, one mesh
per block, rebuilding chunks that did not change, or rebuilding anything on the
main thread.

The draw distance slider lives in the pause menu and in the title screen, and is
remembered in `user://settings.cfg`.

---

## Testing checklist

### Stage 1 — player, world, breaking and placing

- [ ] The project imports with no errors in the Godot output panel.
- [ ] The title screen appears; typing a seed and clicking **Shape the world**
      loads into the game.
- [ ] "Shaping the world" shows briefly, then disappears once terrain is ready.
- [ ] You start standing on solid ground, not falling and not inside a tree.
- [ ] `W A S D` moves relative to where you are looking; the mouse turns the
      camera and looking straight up or down stops at vertical.
- [ ] `Shift` while walking forward is visibly faster and nudges the field of view.
- [ ] `Ctrl` lowers the camera, slows you down, and stops you walking off a ledge.
- [ ] `Space` jumps roughly one block high; you cannot jump in mid-air.
- [ ] A thin dark frame appears around the block you are aiming at, and
      disappears when you look at the sky.
- [ ] Holding left mouse fills the small progress bar under the crosshair, then
      the block vanishes and appears in your hotbar.
- [ ] Stone takes noticeably longer to break than turf.
- [ ] Right mouse places the selected block against the face you are aiming at.
- [ ] You cannot place a block inside yourself — try aiming at your feet.
- [ ] Worldstone at the bottom of the world cannot be broken.

### Stage 2 — chunks, terrain, trees, water

- [ ] Walking in one direction keeps generating new land; the game does not
      freeze while it does.
- [ ] There are hills, flat plains, and taller mountains.
- [ ] Beaches are sand, and the sea is filled with water up to a constant level.
- [ ] Trees have trunks and canopies, and canopies that cross a chunk edge line
      up correctly (no half-trees).
- [ ] Water is see-through, sits slightly below a full block, and you can swim
      in it.
- [ ] There are no seams, holes, or black gaps between chunks.
- [ ] Digging down reaches stone, then ore, then Worldstone; you will run into
      caves on the way.
- [ ] Turning around does not cause visible flicker (back faces are culled
      correctly, so the world is never inside-out).

### Stage 3 — hotbar and inventory

- [ ] Keys `1`–`9` and the mouse wheel change the highlighted hotbar slot, and
      the block name fades in above it.
- [ ] The block you are holding appears in the bottom-right of the screen.
- [ ] Breaking the same block repeatedly stacks it, and the count is shown.
- [ ] A stack stops at 64 and the next one starts a new slot.
- [ ] `E` opens the backpack and frees the mouse; `E` or `Esc` closes it.
- [ ] Left-clicking a slot picks up the stack; clicking another slot drops it,
      merges it, or swaps it.
- [ ] Right-clicking splits a stack in half, and places one block at a time.
- [ ] Shift-clicking sends a stack between the belt and the backpack.
- [ ] Crafting buttons grey out when you lack the materials and work when you
      have them.
- [ ] Closing the backpack while holding a stack returns it to the inventory.

### Stage 4 — day/night, saving, performance

- [ ] The sun moves across the sky and the shadows move with it.
- [ ] The sky goes orange at dawn and dusk, and night is clearly darker.
- [ ] `F3` shows position, biome, chunk counts, the clock and the seed.
- [ ] **Esc → Save now** reports "World saved".
- [ ] **Esc → Save and return to menu**, then **Continue → your world**: you are
      back where you stood, with the same inventory, the same time of day, and
      every block you broke or placed still broken or placed.
- [ ] Closing the window and reopening the game preserves the world too.
- [ ] The same seed typed twice produces the same landscape.
- [ ] The draw distance slider changes how far you can see immediately.

### Stage 5 — creatures, health, damage

- [ ] Falling more than about four blocks costs health, and the screen flashes red.
- [ ] Falling into water from a height does not hurt.
- [ ] Health slowly refills after you have been unharmed for a while.
- [ ] After nightfall, Gloomkin appear away from you and walk toward you.
- [ ] They damage you on contact and knock you back when you hit them.
- [ ] Four hits kills one.
- [ ] They burn away under open sky at dawn, but survive in caves.
- [ ] Losing all health shows the blackout screen; **Wake up** puts you back
      near spawn with full health and your pack intact.
