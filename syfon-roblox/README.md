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

## How it looks

The valley is **real Roblox terrain**, not a green slab: rolling hills sculpted
from two octaves of Perlin noise, four mountain massifs on the horizon, grass
giving way to rock as it climbs, sand at the waterline, and a pond dug into the
ground with terrain water in it.

Terrain is filled as a **crust rather than solid columns**. Filling from bedrock
to the mountain tops came to 4.7 million voxels across three arenas, all of it
below ground and none of it ever seen. The crust scales with the local gradient,
because a fixed depth shows daylight through the seam on a steep slope. Same
valley, 1.6 million voxels.

Trees come in three species — layered pines, broadleaves built from overlapping
spheres, and bare deadfall — each with a tapered two-segment trunk and a slight
random lean, so a forest does not read as one model copied a hundred times.
Ferns and grass tufts cover the ground between them.

The sky is drawn per client from that player's run clock: atmosphere, volumetric
clouds, bloom, sun rays, depth of field and colour grading, all moving through
dawn, noon, dusk and night. On night ten the grade changes — colour drains out,
the fog closes to 220 studs, the clouds thicken and everything goes slightly
red.

## How it feels

| | |
|---|---|
| **The axe is a real Tool** | It sits in your hand, and Roblox animates the swing for free |
| **Interaction is by prompt** | Walk up, the prompt names what E does; no guessing where you are aimed |
| **Every swing lands** | Wood chips, a pitched crack, and a tree that *tips over* away from you |
| **Getting hit** | The screen flashes red and the camera kicks |
| **The horde is audible first** | Groans carry 120 studs before you can see anything |
| **Fire** | Real flame, smoke, and a light that throws shadows across the clearing |

Sound is all Roblox's own built-in `rbxasset://` audio, pitched and levelled per
use — the same snap is a chop at 0.8 and a splitting log at 0.5. That needs no
upload and no moderation, which is the only way to have audio at all before the
real assets go up.

## Controls

| | |
|---|---|
| **E** | Whatever the prompt in front of you says |
| **Left click** | Swing |
| **R** | Loose an arrow |
| **B** | Build mode — scroll to change piece, R to turn, right click removes |
| **F** | Eat the best food you have |
| **L** | Oil lamp |
| **Shift** | Sprint |

## The ten days

**Days 1–2.** Take the axe off the block. Fell a tree, shoulder the log, carry it
home, split it. Twelve wood a log, and wood is the only currency that matters.

**Day 2.** Tomas arrives and walks a circuit past the cabin. He buys wood, meat
and apples; he sells the bow, arrows and the oil lamp. He is the only ranged
weapon in the valley.

**Days 2–9.** Hunt — deer, boar, hare and elk, which notice you at 16 metres and
bolt for seven seconds. A boar turns and charges instead. Light a fire with flint
and wood, cook on it, eat. And build: five pieces on a grid, paid for in the wood
you chopped.

**Day 10, nightfall.** They come. The screen drains of colour, the fog closes in,
and the horde walks in from every direction in waves that do not stop. **They go
through your walls, not around them** — every piece has health and they chew.
Survive until sunrise.

**Day 10 is also the day Tomas leaves.** His going is the last warning.

## In

Lobby with solo, duo, trio and squad pads · three sculpted arenas · the ten-day
clock · felling, carrying, splitting · flint, fire and cooking · hunting four
species · apples · the pedlar, buying and selling · the bow · the oil lamp ·
**building, with walls the horde has to break** · the day-10 horde · win and loss.

## Not in yet

The map screen, and the carried-log model on your shoulder.

Audio and models are the real gap: Syfon's 81 sounds and its `.glb` models
cannot be referenced from here — Roblox assets have to be uploaded through the
Creator Dashboard and moderated before a script may use them. Everything you
hear now is Roblox's own built-in `rbxasset://` audio, pitched and levelled per
use, and everything you see is built from primitives.
