# Syfon — Roblox

Syfon, rebuilt for Roblox. The Godot game was single-player: you woke outside a
cabin, chopped wood, hunted, traded, and counted down to a horde that was never
implemented. This is the same valley and the same ten days, made multiplayer,
with the horde actually in it.

## This is a reimplementation, not a conversion

Nothing was mechanically translated, because nothing can be. GDScript and Luau
are different languages, `.tscn` scenes have no Roblox equivalent, and Godot's
nodes, physics, input and rendering all differ. What carried over is the design,
read out of the original source: `src/shared/Tuning.luau` holds Syfon's numbers
value for value, with the original noted in a comment wherever one had to change.

| Kept exactly | |
|---|---|
| The chain | 5 chops to fell, carry the log home, 4 splits, 12 wood |
| Prices | wood 3, raw meat 6, cooked 11, apples 2; bow 70, arrows ×6 14, lamp 45 |
| Building | wall 6/3, doorway 10/5, floor 5/2, ramp 7/3, torch post 4/2 |
| The body | health 100, stamina drain 0.28 / regen 0.20, hunger over three days |
| Food | apple 0.22, cooked 0.42, raw 0.08 |
| The clock | sunrise 0.24, sunset 0.79, start 0.30, horde on day 10 |
| The opening | all eleven objective steps, same text |

| Changed, and why | |
|---|---|
| Day length 480s → **180s** | 480 makes a run 80 minutes. Nobody sits on a Roblox server that long. |
| Metres → studs (×3.57) | So 6 m/s still *feels* like 6 m/s. |
| Single-player → **run-based co-op** | A server people join and leave cannot run one person's ten-day arc. |

## How a session goes

You spawn in a lobby with four pads: **SOLO**, **DUO**, **TRIO**, **SQUAD**.
Stand on one. Solo starts after a moment; the others start when the pad fills.
The party is dropped into its own copy of the valley and lives its own ten days.

Day 10, **at nightfall, they come**. Survive until sunrise and you win. If
everyone in the party goes down, the run ends and the arena is handed back.

## Running it

Open this folder in VS Code, start Rojo on `default.project.json`, connect in
Studio, press Play. The lobby and all four arenas build themselves — there is
nothing to place by hand.

## Two decisions worth knowing about

**Arenas, not reserved servers.** Parties get separate corners of one Workspace
rather than teleporting to reserved servers. Reserved servers are the eventual
right answer, but they only work in a *published* game, so nothing could be
tested in Studio. Swapping later touches `Arenas` and `Lobby` only.

**The sky is drawn per client.** Roblox has one global `Lighting`, which would
mean four arenas sharing one time of day. The server only reports each run's
clock; each client sets its own sky from it, so one party can be at noon while
another is at midnight. That is why `Hud.luau` owns `Lighting` and `Run.luau`
deliberately never touches it.

## In

Lobby and matchmaking · four arenas with cabin, forest, pond, rocks and flint ·
the ten-day clock with day/night · felling, carrying, splitting, wood · hunger,
stamina, starvation · the objective chain · **the day-10 horde**, waves that
never stop until dawn · melee against them · win and loss.

## Not in yet

Wildlife and hunting · the pedlar and trading · fire, flint-striking and cooking
· the bow · building · the lamp · the map screen. All of their numbers are
already in `Tuning.luau`, so each is a system to write rather than a design to
redo.

Audio and models are the other gap: Syfon's 81 sounds and its `.glb` models
cannot be referenced from here — Roblox assets have to be uploaded through the
Creator Dashboard and moderated before a script can use them. Everything you
see now is built from primitives.
