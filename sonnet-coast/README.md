# Sonnet Coast

An open-world driving and action game that runs in a browser tab. You play Kestrel, an
off-the-books field operative, in a neon coastal city ringed by beaches, a glowing forest and a
bayou. Steal cars, outrun the Anthropic Police, run jobs for your handler, and find what is hidden
out in the wilds.

It is a fan-made parody. It is not affiliated with or endorsed by Anthropic, and everything in it
is fictional.

## Play

Open **`play.html`** in a desktop browser (Chrome, Edge or Firefox). That one file is the whole
game: no install, no server, no network. Click **New Game**, then click the view once so the game
can capture your mouse.

Sound starts after your first click. Progress saves to the browser automatically.

## Controls

| Key | On foot | In a vehicle |
| --- | --- | --- |
| `W A S D` | Move | Accelerate, brake/reverse, steer |
| Mouse | Look | Look (the camera swings back behind you) |
| `Shift` | Sprint | Nitro |
| `Space` | Jump | Handbrake — hold it into a corner to drift |
| `F` | Get in, break in, or pull the driver out | Get out (bail out if you are moving) |
| `E` | Interact with a marker (otherwise same as `F`) | Same |
| Left click | Punch / fire / use gadget | Fire the pistol, EMP or hack tool |
| Right click | Aim | — |
| `Tab` (hold) | Weapon wheel | Weapon wheel |
| `1`–`5`, mouse wheel | Switch weapon | Switch weapon |
| `R` / `Q` | Reload | Next radio station / previous or off |
| `H` | — | Horn, or siren in a police vehicle |
| `G` | — | Police scanner (during *Badge Swap*) |
| `C` / `V` | — / camera distance | Look behind / camera distance |
| `M` | Map — click to set a waypoint | Same |
| `Esc` or `P` | Pause, settings | Same |

## What is in it

**The map.** Sonnet City is a 143-block grid with eight districts — Downtown, Token Row, the
Oceanfront, Old Town, Docklands, Uptown Tech Park, Riverside and Midtown — plus Claude Tower, the
Token Dome and a pier with a big wheel. Around it: Token Beach, the Glowwood (a forest that lights
up at night), Opus Bayou with its channels and gators, Compute Ridge's data centres and the Port of
Sonnet. A highway loops the lot, with dirt trails through the forest and swamp.

**Vehicles.** Sports cars, sedans, hatchbacks, lifted trucks, buggies, vans, hover-bikes (which
cross water), speedboats, and the police fleet: interceptors, off-road rangers, skiffs and
containment trucks. Cars drift, take damage, catch fire and explode; they sink if you drive them
into the sea. Every one can be stolen.

**The Safety Flag.** Crimes raise a one-to-five-star wanted level. Cruisers chase you on the
roads, rangers follow you off them, skiffs follow you onto the water. From three stars a
Constitutional AI drone joins in; from four, containment trucks and roadblocks. Police vision
cones are drawn on the minimap — stay out of them long enough and the flag clears. A Re-Tune
garage will respray the car and wipe the flag if nobody is watching. Out in the forest and bayou
there is nobody to report the small stuff.

**Jobs.** Start them at the amber rings (stars on the map).

| Job | Where | What |
| --- | --- | --- |
| Off the Books | Safehouse | Short introduction |
| Grand Theft Prototype | Claude Tower | Steal the Vanta X-1, lose the police, deliver it to the chop shop in the bayou |
| Badge Swap | Claude Tower | Steal a police interceptor, use its scanner to find a data convoy, stop it and take the core |
| Bayou Run | Port of Sonnet | Smuggle GPUs by buggy along the trails and by boat up the river, round the checkpoints |
| Heat Check | Token Row | Take three stars on purpose, survive, then shake them |
| Neon Sprint | Sonnet Boulevard | Street race, two laps of downtown |
| Glowwood Rally | Glowwood Lookout | Dirt race, two laps of the forest loop |

After the prototype job, Gator Garage hands out repeatable chop-shop contracts. Twenty-four Lost
Weights are scattered around the wilds.

**Also:** a weapon wheel (fists, shock baton, pulse pistol, EMP charges, a hack tool), a wardrobe
at the safehouse, a gadget shop, five radio stations of generated music, a day-night cycle, and a
full map with GPS routing.

## Graphics settings

The game starts on **High** and steps down by itself if the frame rate is poor. You can pick a
preset in *Settings*; once you do, it stays where you put it.

| Preset | What changes |
| --- | --- |
| High | 4× anti-aliasing, 2048 shadow map, longest draw distance |
| Medium | 2× anti-aliasing, smaller shadow map, shorter draw distance |
| Low | No bloom, shadows or street-lamp lighting; lower resolution |

## How it is built

Plain ES modules in `src/`, bundled with three.js into `play.html` by esbuild.

```
npm install
npm run build      # writes play.html
npm run watch      # rebuild on change
```

| Folder | Contents |
| --- | --- |
| `src/world` | Terrain, road graph, city plan and meshes, vegetation, landmarks, sky, lighting |
| `src/entities` | Vehicles, player, pedestrians, traffic, police, weapons |
| `src/missions` | Jobs, races, markers, contracts, collectibles |
| `src/ui` | HUD, minimap and full map, menus, stylesheet |
| `src/audio` | Sound effects, engine, sirens, ambience, radio sequencer |
| `src/fx`, `src/ai`, `src/util` | Particles, AI driving, maths and noise helpers |

Everything is generated at load time: there are no model, texture or audio files.

Two things worth knowing if you read the code:

- **The world is a function.** Terrain height, biome and road surface are computed from `(x, z)`
  rather than read from meshes, so physics, AI and the map all ask the same source.
- **Street lighting is analytic.** A forward renderer cannot run thousands of lamps, but the city
  is a grid, so a shader patch (`src/world/citylight.js`) finds the nearest lamps and shopfronts to
  each pixel with arithmetic and lights it through the material's normal shading. Knock a lamp over
  and its light goes out.

## Limits

This was built and tested in a headless browser with software rendering. Game logic is covered by
scripted playthroughs of every job, but frame rate on real graphics hardware and how the music
actually sounds have not been checked by a person. Interiors, a story beyond the jobs above, and
gamepad or touch controls are not included.
