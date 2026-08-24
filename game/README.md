# Syfon v2.9.0 — Elmswood

A first-person survival-horror explorer built for the **Godot Engine** (not a browser/HTML game — it runs as a real desktop application). The setting is a zombie apocalypse, and this release gives it a clock and a reason to hurry.

You wake outside a log cabin in a forest of rolling hills and four mountain massifs. Your inventory is empty; you have nothing but your own two hands. An axe stands buried in the chopping block on the porch. Take it, and the forest becomes a resource — but not a free one: felling a tree gets you a **log**, and a log has to be carried home on your shoulder and split on the block before any of it is firewood.

There is a map on the cabin table showing the whole valley, including the three places where people are still living and still trading. The sun rises and sets, the days count up, and **on day 10 they come**.

**Zombies are not in yet** — the countdown is real, the horde is not there to meet it. Everything else is built around its arrival.

## What's new in v2.9.0

**There is a village now.** Elmswood sits west along the road, behind a log palisade with a gated approach and lit braziers. Eight houses with pitched gable roofs, a stone well, a row of market stalls under cloth awnings, and **Maren**, who runs the middle stall and is the only person in the valley who will trade with you.

It is generated rather than hand-placed, like the forest. Every post, wall and crate asks the terrain how high it is and sits on that, so nothing floats or sinks when the ground changes.

**Trading, and a bow.** Maren buys wood, raw meat, cooked meat and apples, and sells a hunting bow and arrows. Coins replaced the supply-cache counter on the HUD.

| | |
|---|---|
| Wood | 3 coins |
| Raw meat | 6 coins |
| Cooked meat | 11 coins |
| Apples | 2 coins |
| **Hunting bow** | **70 coins** |
| **Arrows ×6** | **14 coins** |

The bow is item slot **4**. Arrows are a real projectile: they arc under gravity, stick in whatever they miss, and are raycast along each frame's travel rather than moved as a physics body — at 62 m/s a body would jump a metre per frame and tunnel straight through a hare.

**Crouch, on CTRL.** It does not change your collision shape, only how fast you move, how low you look from, and how far off you are noticed. That last one is the point:

| | Deer notices you at |
|---|---|
| Sprinting | 23.2 m |
| Walking | 16.0 m |
| Standing still | 12.8 m |
| **Crouched, still** | **6.7 m** |

**Two new animals, and one of them you cannot catch.** A hare runs at **13.5 m/s** against your 9.5 m/s sprint, and is the jumpiest thing in the forest — it spots you at nearly twice a deer's range. It exists to make the bow worth buying. Elk are new too: bigger, slower to spook, and worth four meat.

| | Run speed | Wariness |
|---|---|---|
| Boar | 6.4 m/s | 0.78 |
| Deer | 8.6 m/s | 1.00 |
| Elk | 9.8 m/s | 0.92 |
| Hare | 13.5 m/s | 1.65 |

**The supply caches are gone.** All eight orbs, the scene, the script, the HUD counter and the pack slot.

Two bugs found and fixed while building the village:

- **Every roof was a sheared, floating parallelogram.** A `Basis` holds rotation and scale as one matrix, so rotating a node that has already been scaled non-uniformly multiplies the rotation onto the right of `R*S` and shears it instead. Roof panels are composed as `R * scaled(S)` now.
- **Maren could only be reached from 12 of 36 stances, and pressing E did nothing.** The interaction cone measured both the angle and the range to an interactable's *origin* — which for a person is the point between her boots, not where anyone looks. Interactables can now name their own aim point, and she was standing partly inside the stall counter besides. Re-tested: **36 of 36 stances**, and E opens the stall.

## What's new in v2.8.0

**The trees are rebuilt from leaf cards.** Canopies used to be smooth deformed spheres and cones — green blobs on sticks — and the wind shader slid each whole blob sideways. Every canopy is now a mesh of individual leaf sprays, each carrying its own random phase, so leaves shiver independently on top of the crown's slower lean. There are **five conifer canopies** (tight fir, broad spruce, sparse windblown pine, dense young, ragged old-growth), **five broadleaf crowns** (oak, poplar, maple, willow, elm), **two half-dead crowns** that still hold brown leaf, and **three trunk profiles** that taper differently and flare where they meet the ground.

Three real bugs came out of the old canopies along the way:

- **Sway was multiplied by instance scale.** Displacement was applied in model space, so a canopy instanced six metres wide swayed six times as far as a small one — big trees whipped, small ones barely twitched. The scale is divided back out now, so every tree moves the same distance in the world.
- **Canopies sat off their trunks.** Each part was placed at the trunk's position and left to rotate about its own origin, so on a leaning tree the crown slid sideways by up to half a metre. Both parts are now placed by rotating their offset from the tree's base through the same lean, and a tilted tree leans as one piece.
- **Non-uniform scaling stretched the leaf cards.** The first rebuild scaled conifer canopies ~2 m wide and ~12 m tall, which turned every leaf card into a vertical shard and the forest into a field of spikes. Canopies are authored at real proportions and instanced with a single uniform scale.

Felling still works exactly as before, and the leaf burst now keys off a flag set when the canopy is built — a dead tree's bare branches no longer throw a shower of green leaves.

**The pond is a real pond.** It was a 46 m *square* sheet of water floating 16 cm above a perfectly flat pad, with a 5 cm wave height and a normal rebuilt from a finite difference two metres wide — which averaged every wave away and shaded it as a flat plate. Now:

- The terrain has an actual **basin** dug into it, 2.6 m at the deepest, shelving gently so you can wade in. Its rim is pushed around by noise, so the waterline falls where the bed rises past it and the shore is a shape the terrain decides — measured between **9.25 m and 13.5 m** from the centre depending on which way you walk.
- Waves are four directional layers with **exact analytic slopes** instead of a smeared finite difference, normalised so the wave height is honestly in metres and a crest can never climb the bank.
- Depth drives everything: the bed shows through at the shore and is swallowed as it deepens, and foam sits in a narrow wet band where the water runs out.

That depth is **baked off the terrain when the level loads** rather than read back from the depth buffer, because the reconstruction differs between renderers — Vulkan hands you a `[0,1]` depth and OpenGL a `[-1,1]` one, and getting it wrong turns the entire pond into a sheet of white foam. Baking it is exact, picks up the noisy shoreline for free, and behaves identically everywhere.

**The pack shows your stuff.** It has drawn item icons instead of colour swatches, gear rows marking what is in your hands versus stowed, and a slot grid for everything you can carry. **Raw and cooked meat were missing entirely** — they were added last release and never made it into the pack. Empty slots stay visible and dim, so a thing you have not found yet still reads as a thing that exists.

**Fixed: `M` would not close the map, and `Tab`/`I` would not close the pack.** This one was mine, introduced in v2.7.2. Opening consumed the keypress so the overlay's own handler could not see it — but `open_map_screen()` returned early when the map was already open, so the key was eaten and nothing closed. `M`, `Tab` and `I` are now true toggles owned by the player, the overlays keep only `ESC`, and `E` backs out of an open panel instead of reaching through it at whatever the crosshair was last pointing at.

**Fixed: `ESC` over an open panel paused the game behind it.** The pause menu sits last in the scene, so it was offered the keypress before the map and the pack ever saw it. It now backs out of an open panel instead.

Verified by pushing real key events through the running game: `M` four times gives open, closed, open, closed; the same for `Tab` and `I`; `ESC` and `E` both close without pausing; and opening either panel shuts the other.

## What's new in v2.7.2

**Fixed: the map, the pack and eating had no keys bound.** `M`, `Tab`, `I` and `F` were never actually wired into the input handler — an earlier batch edit failed to match and the failure went unnoticed because other edits in the same script succeeded. `open_map_screen()` existed and worked when called; nothing called it. All four keys are bound now, and opening an overlay consumes the keypress so the overlay's own handler cannot see the same press and close it again.

**Fixed: a log on the chopping block could not be split.** The melee raycast never enabled `collide_with_areas`, and the chopping block is an `Area3D` — so the axe swing passed straight through it and no swing could ever land. The swing now includes areas, and steps over pickups (which are also areas) rather than letting them absorb the blow. Load a log, swing four times, get 12 wood.

**Fixed: animals moonwalked.** A Godot node faces its own −Z, so pointing it along a direction needs `atan2(-x, -z)`; the code used `atan2(x, z)`, which is exactly 180° out. Every animal walked backwards with its legs cycling forwards. On top of the sign fix they now **turn before they go** — speed is gated on how well the body is aligned with the direction of travel, so there is no window where the velocity has snapped to a new heading the body has not reached. Measured over 1,228 samples of moving animals: mean alignment **0.97**, worst **0.28**, no negatives.

**Animals are spread out and behave better.** Minimum spawn separation is 46 m (the tightest pair was 9.9 m; it is 48.7 m now). They have a new **alert** state — they notice you at 24 m and stand watching with their heads up before bolting at 16 m — they steer around trees with a short forward feeler instead of grinding into trunks, they will not set off toward a slope they cannot climb, and their legs stop swinging when they stop.

## What's new in v2.7.1

**Fixed: the campfire could not be cooked on.** Two faults stacked on top of each other, and the feature was unusable because of them:

- The fire had **no collision shape at all** — it was a plain `Node3D`, so the interaction ray had nothing to strike and passed straight through it. It is an `Area3D` with a real volume now.
- Range was judged on straight-line distance from the camera. A fire pit sits at your feet, so standing a comfortable **2.5 m** away with the camera 2.2 m up measured as **3.3 m** and fell outside the 2.6 m reach. Height now counts for less than ground distance when deciding what is close, and the reach is 3.0 m.

Tested from six stances around the fire: five prompt, and the sixth is facing away from it, which is correct. The axe, the map, the chopping block and the cooking chain all still behave.

## What's new in v2.7

### Fixed: the map still could not be opened

The trigger fix in v2.6 was not enough. A raycast alone is unforgiving for something flat on a table: it only connects at one precise combination of distance and pitch, and every other stance sails over it into the floor. Tested across eight realistic stances, **all eight missed**.

Interaction now falls back to a **cone** when the ray finds nothing — the nearest interactable within 2.6 m and about 40° of where you are looking, preferring whatever is closest to straight ahead. Seven of those eight stances now work (the eighth is out of reach and aimed above the table). Logs, apples, the chopping block and the fire all became easier to grab as a side effect.

Pressing **M** without a map now tells you where one is instead of just refusing.

### A guide that walks you through it

Ten steps, in the order you would naturally do them, shown in a panel at the top right with the step number and a line of *how*:

1. Take the axe from the chopping block
2. Fell a tree
3. Shoulder the log it leaves
4. Carry it to your chopping block
5. Split the log for firewood
6. Read the map on the cabin table
7. Hunt an animal
8. Cook the meat on a campfire
9. Eat, and keep eating
10. Stock up before day 10

Each one completes on the real game condition rather than on a scripted trigger, banners "Done · …", and the panel fades away for good once the last is finished.

### Animals

**14 deer and 8 boar** wander the forest, placed with the same slope and clearing tests the trees use, so the herds are where the woodland is.

- They graze with their heads down, pick a new spot every few seconds and walk to it, turn to face where they are going, and swing their legs in diagonal pairs — which is what makes a four-legged walk read as a walk.
- They notice you at close range and bolt, and they bolt when hit.
- Deer carry antlers and a pale tail; boar are lower, darker, tusked and have a bristly ridge.
- Two or three axe blows kill one. It topples onto its side and leaves **2 meat** (deer) or **3** (boar) where it dropped. Nothing player-side had to change to make them killable — the melee code already damages anything with a `hit()` method.

### Cooking

The campfire is interactable. Walk up with raw meat and press **E**: a spit goes up over the coals with a cut on it for each piece, and over **14 seconds** the cuts darken and shrink so you can see them cooking from across the camp. Press **E** again to take them.

Food is now ranked, and **F** eats the best thing you have: cooked meat (42% of a full stomach), then an apple (22%), then raw meat as a last resort (8%, and it is not pleasant). A new **MEAT** chip on the HUD reads cooked over raw.

## What's new in v2.6

### Fixed: the felled tree left a ghost

Felling a tree left the whole fallen tree lying there *and* spawned a separate log a metre away — two copies of the same thing. The tree now **becomes** the log. When the trunk finishes hitting the ground:

- the canopy bursts into tumbling leaves and is taken away,
- the standing geometry is removed from the batch entirely,
- and a carryable log is left lying **exactly where the trunk came to rest**, along the line it fell, sized and tinted from the tree it came off.

### Fixed: you could not read the map

The map's interaction volume was a tall box floating from y 0.73 to **1.63** — well above the sheet it belonged to. Walking up to the table and looking down at the map sent the ray straight over the top of the box and into the table, so it only worked from a couple of metres back at exactly the right angle. The trigger now hugs the sheet on the table top. The sheet is bigger and lighter too, and **reading it once memorises it** — after that, **M** opens the map anywhere.

### Apples, and hunger

- Felling a **broadleaf** tree has a 55% chance of shaking one to three apples out of the canopy. They sit on the ground where they fell, bobbing, and go into your pack.
- **Hunger** runs down over about three days of ordinary walking, and more than twice as fast while sprinting. It has its own bar under stamina, going amber then red. Empty, it costs you 2 health every four seconds — a slow bleed with time to do something about it, not a death sentence.
- **F** eats an apple, from the world or from inside the pack. One apple is 22% of a full stomach.

### A pack, on Tab

**Tab** or **I** opens your pack: what is in your hands (or that both are full of log), your wood, apples and supply caches, and your hunger and health as bars. **F** eats from there too. It shares the map's visual language.

### The map shows the valley now

It was an empty dark panel with a few pips on it. It now renders **the actual terrain**, sampled from the same `TerrainGrid` the world is built on, so it cannot go stale:

- **Hillshaded relief** — the height field lit from the north-west, so ridges and valleys read as raised and sunken.
- **Height banding** from low green through scrub and bare rock to snow, with **contour lines every 8 m**.
- **Worn ground** — roads and cleared pads painted in from the same clearing test the forest uses to avoid them.
- **Blackwater Pond**, drawn where it actually is.
- A **50 m grid** and a **scale bar**, so distances mean something.
- All ten locations, traders in amber, your position and heading.

### The campfire

It was a 4.8-metre stone pancake with two 2.2 m logs lying flat on it and a glowing dinner plate in the middle. It is now about 1.3 m across: a ring of eleven individual stones (some soot-blackened), an ash bed, four logs leaning into a tepee with two burnt through and fallen across the front, a bed of embers with loose coals, real flame and smoke particles, and a light that flickers on two out-of-phase waves plus noise — because a single sine reads as a fault rather than a fire.

## What's new in v2.5

### The axe swings across, not down

The felling stroke was an overhead chop. It is now a horizontal right-to-left sweep: cocked back over the right shoulder through a decelerating wind-up, driven across the body on a quadratic (accelerating) arc so the head carries its weight into the cut, then a longer eased recovery back to guard. Yaw carries the arc, roll lays the bit over so the edge leads, and the arms travel sideways with it instead of punching forward.

### Wood is work now

Felling a tree used to hand you four wood on the spot. The loop is longer, and every step is a thing you do:

1. **Fell the tree** — five bites, same as before. It drops a **carryable log** where it came down, tinted to the species it came from.
2. **Shoulder it.** A log occupies both arms: the axe goes away, you cannot swing, you cannot sprint, and you move at 62% speed. Press **E** with nothing in front of you to set it down again.
3. **Carry it to your chopping block** and press **E** to drop it on top.
4. **Split it** — swing the axe at the loaded block. Each of four splits gives **3 wood** and takes a visible bite out of the round; the last one scatters the halves off the block. A whole log is **12 wood**, three times what felling used to pay, and you have to walk it home to get it.

### A map, and people to trade with

There is a chart weighted down on the cabin table. Press **E** to read it, **M** or **Esc** to put it down. It draws itself from the same coordinates the world is built from, so it cannot go stale: contour rings for the four mountains, the road network, and every location marked. Walking into a place fills in what you learn about it.

Three of them still have people in them, marked in amber:

| Place | Who's there |
|---|---|
| **Ranger Watchtower** | A ranger holding the tower. Rope and tools. |
| **Crashed Convoy** | Two survivors camped in the wrecks. Fuel and ammunition. |
| **Chapel Ruins** | A dozen people sheltering. Medicine, and news. |

*(The traders are marked and described; actually bartering with them is the next piece of work.)*

### Day and night, and a deadline

A single `WorldClock` node owns the whole cycle so the sun, the sky, the fog and the lamps can never disagree about what time it is. A day is **eight minutes**. Over it:

- The sun arcs from due east at sunrise to due west at sunset, climbing to 58° at noon, running through keyframed colour and intensity — deep blue at midnight, hard orange at dawn and dusk, pale and bright at midday.
- The sky's top and horizon colours are keyframed separately, so dawn goes orange at the horizon while the zenith is still night.
- Ambient light drops to a quarter after dark, the fill light turns cold blue, night fog thickens, and the sun stops casting shadows entirely rather than smearing them from below the horizon.
- **The cabin lamps and the porch lantern come up as the light goes** — which is most of what sells dusk.

The HUD gained a day chip: the day number, a dial that turns once per day, and the phase of the day. Inside the last three days the number turns amber, then red, and the caption starts counting down. Day 10 announces *"They are here."*

### Fixed

- **Chapel Ruins was in the wrong place.** Its landmark trigger sat at z −95 while its cleared pad is at z +95 — so it was pinned on top of the Rocky Lookout and could never be discovered where the map says it is.
- **Interaction volumes could swallow each other.** The chopping block's trigger reaches around the axe standing in it. Anything interactable with nothing to say is now transparent to the interaction ray, which carries on to whatever is behind it.

## What's new in v2.4

### A real interface

The HUD was a row of default-font labels on flat rectangles. It is now a designed thing, assembled in `scripts/hud.gd` against a single palette in `scripts/ui_theme.gd` so nothing can drift.

- **Real typography.** Oswald for display, Barlow Condensed for everything else — both OFL, bundled with their licences (`ui/fonts/CREDITS.md`).
- **A compass ribbon** instead of a text bearing: a 120° window with a tick every 15°, cardinals riding along it, and a fixed needle at dead ahead. It slides across north instead of jumping.
- **A condition panel** with a health bar that changes colour as it drops, a pale trailing bar that shows what you just lost before it drains away, and a stamina bar under it.
- **A dynamic crosshair** — four arms and a dot that spread as you move and kick wider mid-swing — plus a hit marker that punches outward on contact.
- **Radial vignettes** rather than full-screen colour washes: a permanent corner darkening, a red bloom at the edges when you take damage, and a low-health pulse that scales with how bad it is. None of them wash out the middle of the screen.
- **An item card** that pops when you swap, **key-capped interaction prompts**, **sliding toasts**, and a control hint line that fades out once you've had time to read it.
- **Menus to match.** The title screen paints its own dusk backdrop with a warm horizon band and two mist layers drifting at different speeds, and staggers its elements in on load. The pause menu drops in, and the settings panel picks up the same palette.

### Models with something in them

- **The cabin is a log cabin now.** Eight courses of stacked logs with alternating proud/recessed rounds and notched corner posts, 450 overlapping roof shingles laid in staggered rows, a chimney faced in 200 individual stones, a cross-mullioned window with a sill and open shutters, a plank door with iron battens and a ring handle, a railed porch with balusters and steps, a stacked woodpile, and an oil lantern hung off the porch post. All of it batches into four `MultiMesh` instances rather than ~700 nodes.
- **The hands have fingers.** Each arm is now a small rig (`scripts/hand_rig.gd`): tapered forearm, wrist, palm and heel, four three-jointed fingers and a two-jointed thumb. Picking up the axe *closes the fingers around the haft* — the curl is blended with the same weight that drives the reach, so the grip forms as the hands arrive.
- **The axe** gained a leather-wrapped grip, a bearded bit, a collar at the eye and a single-piece head with a bright edge, instead of reading as stacked flat plates.

### Feel and bug fixes

- **Fixed: you stopped dead.** Ground friction was `move_toward(velocity, 0, speed)` — a per-call step, not a rate. You went from full speed to zero in a single frame, and *how* fast depended on the frame rate. It is a real deceleration now, with much lower friction in the air.
- **Fixed: holding space bounced you.** The jump read the key's state rather than its press, so keeping space down re-fired every time you touched the ground. It is edge-triggered now.
- **Fixed: bare hands did nothing.** Left-clicking with nothing equipped returned immediately — no animation, no sound, no feedback. Empty hands now swing, and hitting a tree with them tells you why nothing happened.
- **Sprinting costs stamina.** It drains in about four seconds, needs a beat before it starts coming back, and leaves you winded until there's enough in reserve to run on again — so a sprint has a shape instead of being a permanently-held key.
- **Removed the dead weapon panel.** `E` became the interact key in v2.3, which left the old weapon list unreachable — along with its `GameState` signal, its player-side toggle and its stale contents.
- **Right-sized props.** The camp drum was 1.6 m across (a real one is 0.58 m) and wore a tiling rust texture that read as a stack of coins; it is now barrel-sized with iron hoops and a lid.

## What's new in v2.3

**A starter cabin.** A proper log home at the edge of the woods — plank walls, a pitched shingle roof with a ridge beam and exposed rafters, a stone chimney, a covered porch on posts with a rail, a bunk and a table inside, and a warm lamp burning through the window. You spawn just outside its door.

**You can see your hands.** Both arms are on screen at all times, with forearm, palm, knuckles, three curled fingers and a thumb each. They breathe when you stand still, bob when you walk, drift with your mouse, and jolt when the axe bites.

**A starter axe, outside, in the chopping block.** It sits in the block on the porch, tilting gently, with a "Hold **E** — Axe" prompt when you look at it. **You start with nothing in your inventory** — the sniper, handgun and knife are all gone from the loadout. Bare hands is slot one and the axe is the first thing you'll own.

**The arms actually grip the axe.** When the axe is out, both hands leave their resting pose and reach for the haft — the right hand high near the head, the left low on the grip — solved every frame against wherever the swing animation has thrown the weapon. So the grip holds through the whole arc instead of the axe floating between two static hands.

**Chopping down trees.** Every one of the ~1,400 trees is registered against its own collision shape, so a raycast that hits a trunk resolves to *that* tree. Five bites of the axe fells one:
- Each non-lethal hit shakes the whole tree — trunk and every canopy tier together — and throws wood chips off the cut.
- The fifth drops it. The tree rotates rigidly about its base through a two-stage eased fall, over-swings slightly at the end and settles with a bounce, and a stump is revealed at the stump line from a pooled `MultiMesh`.
- Felling banks **4 wood** (1 per bite), tracked on a new HUD counter, and announces "Timber!".

**Swing animation.** The overhead chop winds back 62° over the shoulder, drives down through −74° with a quadratic (accelerating) fall so the head has weight, then eases back to guard over the longer half of the cycle. The arms drive forward through the strike and the whole thing shakes on contact.

**Fixed: 3D effects could crash during a scene change.** `Effects` parented particles to `get_tree().current_scene`, which is null mid-transition — the same latent bug already fixed in `Sound`. Both now fall back to the always-present autoload.

Verified by running the engine, not by reading the code: a headless Godot 4.3 build imports the project, drives the character into a tree and swings until it falls (`swings=8, wood 0 → 11, felled=true, stumps=1`), and renders the screenshots this release was tuned against.

## What's new in v2.2

**Fixed: could not move.** The terrain's triangles were wound the wrong way round. Godot builds a triangle's plane as `(p1-p3) x (p1-p2)`, and the opposite order points the surface normal *into* the ground — so the collider only existed from below and the mesh was backface-culled from above. The player dropped through the surface and jammed inside it. Verified fixed by driving the character 16.5 m in a headless run: `on_floor = true`, and the player's feet track the terrain height to within a millimetre.

**Fixed: 3D sounds threw an error and went silent.** `Sound.play_3d()` parents each new player to `get_tree().current_scene`, which is null during scene changes. It now falls back to the always-present autoload.

**Much less blocky.**

- Roads and clearings were flat rectangular slabs laid on the ground — the single biggest offender. They are now painted into the terrain itself through a vertex-colour wear mask, with noise-warped edges, so a track wanders and follows the hills instead of reading as a ruled tan rectangle.
- The horizon ended in a hard black band where the height grid stopped. A skirt now carries the ground out to 1,500 m, seamlessly welded to the edge of the sheet.
- Distant peaks were flat grey cardboard; they now wear the same slope-blended terrain material as the ground, and their summits no longer pick up a noise notch.
- Camp tents were boxes with slab roofs. They are proper A-frames now, feet on the ground and meeting at a ridge.
- The palette was drab grey gravel throughout. The ground reads as forest floor again, the sky is overcast rather than black, and undergrowth is bright enough to look like grass instead of debris.

*Verified by actually running the engine this time* — a headless Godot 4.3 build renders the scene, drives the character, and reports zero script or shader errors.

## What's new in v2.1

- **Real terrain instead of a flat plane.** The ground is now a generated heightmap — 480×480 m of rolling hills at 4 m resolution, with smooth interpolated normals and an exact triangle-mesh collider, so the surface you see is the surface you walk on. `scripts/terrain.gd` owns the height field and every other system asks it where the ground is.
- **Four mountains.** Three are steep scenery with proper rock faces; the fourth is deliberately shaped under Godot's 45° walk limit so you can actually hike to its summit. Seven more peaks sit past the boundary as skyline. Fog was thinned so all of it is visible.
- **Nothing is flat-shaded or boxy any more.** Tree canopies and boulders are spheres and cones pushed around by 3D noise and re-normalled, so silhouettes are irregular. Boulders come in three distinct shapes; the old box rocks and the old box "hill" with its ramp are gone — that hill is a real terrain mesa now.
- **Four tree species.** Firs with four tight tiers, spruces with three broad ones, pale-trunked birches and dark oaks with three-blob irregular crowns, plus leaning deadfall with bare branches. Height, radius, lean, canopy width and colour are all randomised per tree.
- **Wildflowers** in six colours, clumped one species per patch the way real wildflowers grow, on open gently-sloping ground. A single mesh does stem and bloom; the shader picks which is which from vertex height and takes the bloom colour per instance.
- **Slope-aware ground.** A new terrain shader blends forest floor into rock by real surface slope, with a low-frequency mottle to hide tiling. It builds its tangent frame in the shader, so a 14,000-vertex mesh needs no tangent data.
- **Placement is terrain-aware.** Every tree, bush, fern, flower, boulder and blade samples the ground height and the slope, so nothing floats, nothing sinks, and nothing grows on a cliff.

## What's new in v2.0

- **Whole game re-themed to a zombie apocalypse.** The island is gone. The map is now a huge, flat, dense forest with a cold overcast sky, desaturated colour grading, heavy distance fog and volumetric mist. The menu reads *DEAD WOODS*.
- **The forest is real scale.** 400×400 m of walkable ground with ~950 pines/firs, ~210 dead leaning trunks with bare branches, 520 bushes, 2,500 ferns, 190 boulders and ~16,000 grass blades. Every trunk has collision, so you cannot walk through trees.
- **Built for performance, not just looks.** All of that is batched into 9 `MultiMesh` instances instead of ~25,000 separate nodes, and all 1,160 tree collisions live in a *single* `StaticBody3D` rather than one physics body per tree. Placement is seeded, so the forest is byte-identical every run.
- **New real textures**: forest floor, dirt, bark, dirty concrete and rusty metal (CC0, Poly Haven) on top of the existing grass/sand/rock/wood sets — see `textures/CREDITS.md`.
- **Real scanned models**: `dead_tree_trunk_02` and `tree_stump_01` glTF scans are placed sparsely as detail anchors. Poly Haven's full tree scans are ~900 MB of mesh data *each*, which is hopeless for a thousand-tree forest, so the bulk woodland is batched procedural geometry wearing real bark textures instead — the same trade real open-world games make.
- **New `bark.gdshader`**, plus rewritten wind shaders: gusts now roll across the forest as a travelling wave rather than every plant swaying in lockstep, and each instance carries its own colour tint so a thousand copies of one trunk mesh don't read as clones.
- **Eight locations to find**, each with a discovery banner: Survivor Camp, Ranger Watchtower, Abandoned Cabin, Crashed Convoy, Chapel Ruins, Radio Tower, The Graves, Blackwater Pond and Rocky Lookout.
- **Relics are now supply caches** (amber, 8 of them) and the old shooting-range targets and human bots have been removed.

### Notes for the zombie pass

- `player.gd` damages anything it hits via duck typing (`if target.has_method("hit")`), so a zombie only needs a `hit(damage)` method to be shootable and stabbable.
- `GameState.add_point()` is still wired to the HUD score and is currently unused — it is there for zombie kills.
- The old bot AI (patrol / chase / attack state machine, line-of-sight checks, spread-based aiming) was deleted in this commit but is recoverable from git history as a starting point.

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
  - **Shift** — sprint (costs stamina, shown under the health bar; run it dry and you're winded until it recovers)
  - **Mouse Wheel** — cycle through what you're actually carrying, with a draw/holster dip animation
  - **E** — interact with whatever is under the crosshair: pick up the axe, shoulder a felled log, drop it on the chopping block, read the map. With a log on your shoulder and nothing in front of you, **E** sets it down.
  - **M** — open the map anywhere, once you've read the one on the cabin table
  - **Tab** or **I** — open your pack
  - **F** — eat an apple
  - **Esc** — pause (freezes the game, opens Resume / Settings / Quit to Main Menu)

You start with an empty inventory. The axe on the chopping block outside the cabin is the first thing you can own — walk up to it, press **E**, then left-click to swing. Five bites drop a tree; each bite banks a wood.

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
    axe_pickup.tscn            # the starter axe in the chopping block: an interactable that tilts as it waits
    log_pickup.tscn             # a felled log on the ground, spawned wherever a tree comes down
  ui/
    fonts/                   # Oswald + Barlow Condensed (OFL) and their licences -- see CREDITS.md
  scripts/
    main_menu.gd             # main menu button wiring
    pause_menu.gd             # in-game pause menu (attached to main.tscn's PauseMenu node): freezes the tree, Resume/Settings/Quit
    settings_panel.gd          # slider <-> Settings autoload wiring, shared by both menus
    player.gd               # movement, stamina, mouse-look, inventory + pickups, hand/arm posing and axe grip solve, swinging and chopping, health/death, sound triggers
    ui_theme.gd              # the game's palette, fonts, styleboxes and vignette generator -- one source for HUD and menus alike
    hud.gd                    # builds and drives the whole HUD: compass ribbon, condition panel, crosshair, item card, prompts, toasts, vignettes
    hand_rig.gd                # one first-person arm: tapered forearm, palm, four three-jointed fingers and a thumb, with a grip curl
    cabin_detail.gd             # log courses, roof shingles, chimney stones, window, door, porch rail, woodpile and lantern for the starter cabin
    axe_pickup.gd            # the world axe: idle tilt, prompt, hands the item to the player and sinks away
    world_clock.gd            # the day/night cycle: sun arc and colour, sky, ambient, fog, lamps, and the day counter
    log_pickup.gd              # a felled trunk lying where it came down, waiting to be shouldered
    chopping_block.gd           # takes a carried log and turns axe swings into wood
    map_screen.gd                # the valley map: roads, contours, locations, traders and the horde countdown
    map_table.gd                  # the chart on the cabin table that opens it
    inventory_screen.gd            # the pack: what you carry, your materials, hunger and health
    apple_pickup.gd                 # fruit shaken out of a broadleaf canopy when it comes down
    campfire.gd                      # stone ring, tepee logs, embers, flame and smoke, a flickering light, and cooking
    objectives.gd                     # the ten-step opening guide, each step checked against real game state
    animal.gd                          # a grazing deer or boar: wander, graze, notice, flee, die and leave meat
    wildlife.gd                         # scatters the herds using the same slope and clearing tests as the trees
    meat_pickup.gd                       # a cut off a downed animal, raw or cooked
    forest_scatter.gd         # the forest itself, and the chop registry: every tree keyed by its own collision shape, fell animation, stump pool
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
