# Sonnet Coast

An open-world driving and action game that runs in a browser tab. You play Kestrel, an
off-the-books field operative, in a clean futuristic coastal city of glass towers, roof gardens
and monorails, ringed by beaches, a glowing forest and a bayou. Steal cars, outrun the Anthropic Police, run jobs for your handler, and find what is hidden
out in the wilds.

It is a fan-made parody. It is not affiliated with or endorsed by Anthropic, and everything in it
is fictional.

## Play

**On a computer:** open **`play.html`** in Chrome, Edge or Firefox. That one file is the whole
game: no install, no server, no network. Click **New Game**, then click the view once so the game
can capture your mouse.

**On a phone or tablet:** the same file, opened in the phone's browser, turned sideways. Touch
controls appear by themselves. A phone browser needs a web address rather than a file on disk, so
host `play.html` somewhere (GitHub Pages works: Settings → Pages → deploy from this branch, then
open `…/sonnet-coast/play.html`) or serve the folder from a computer on the same Wi-Fi
(`npx serve .` and open the address it prints).

Sound starts after your first click or tap. Progress saves to the browser automatically.

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

### Touch

Phones and tablets get on-screen controls with drawn icons. Only the buttons that do something
right now are shown.

| Control | On foot | In a vehicle |
| --- | --- | --- |
| Thumb stick (bottom left; it recentres under your thumb) | Move; push all the way to sprint | Steer |
| Drag anywhere else | Look | Look |
| Action button (bottom right) | Shows what is in your hand: punch, strike, fire, throw or hack. Drag while holding it to aim | Fire, when holding a pistol, EMP or hack tool |
| Aim | With the pistol or EMP; tap again to lower | — |
| Jump | Jump | — |
| Gas, brake | — | Accelerate, brake / reverse |
| Drift, nitro | — | Handbrake, nitro |
| Get in / get out | Appears when a vehicle is in reach | Get out |
| Use (amber, pulsing) | Appears when there is something to use | Same |
| Weapon | Next weapon | Next weapon |
| Radio, horn, behind, scan | — | Next station, horn or siren, look behind, police scanner |
| Camera, map, pause (top right) | Camera distance, map, pause. Tapping the minimap opens the map too | Same |

On the map, tap to set a waypoint, drag to pan and pinch to zoom. *Settings* has a button-size
option (S / M / L) and look sensitivity. Turning the phone upright pauses the game.

Add `?touch=1` to the address to force touch controls on, `?touch=0` to keep them off.

## What is in it

**The map.** Sonnet City is a 143-block grid with eight districts — Downtown, Token Row, the
Oceanfront, Old Town, Docklands, Uptown Tech Park, Riverside and Midtown — plus Claude Tower, the
Token Dome, glass conservatories, two monorail lines and a pier with a big wheel. Around it: Token Beach, the Glowwood (a forest that lights
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
| Tail Lights | Vantablack Labs | Follow a courier across the city without being noticed, then tag the stash |
| Signal Loss | Alignment Park | Bring down four survey drones before they finish mapping the district |
| Hot Pursuit | Sonnet Boulevard West | Run down a fleeing sports car and take the drive from it |
| Wake Up Call | Sonnet Pier | Boat chase down the coast; stop the smuggler and take the cargo back |
| The Weights Job | Claude Tower | The finale: pick up your safecracker, hold off security while she works, then get the hauler out through a three-star alarm. Opens after Grand Theft Prototype, Badge Swap, Bayou Run and Tail Lights |
| Neon Sprint | Sonnet Boulevard | Street race, two laps of downtown |
| Glowwood Rally | Glowwood Lookout | Dirt race, two laps of the forest loop |
| Courier Rush | Midtown | Six timed parcel drops; faster drops pay more |
| Glide Path | Sonnet Pier | Hover-bike time trial over the bay, with medal times |

After the prototype job, Gator Garage hands out repeatable chop-shop contracts. Twenty-four Lost
Weights are scattered around the wilds, and seven stunt ramps pay out the first time you land each
one.

**Depth.** Nothing in the city is a flat painted wall any more.

- *Shops.* Street-facing ground floors are real shopfronts near you: frames, glass doors and
  windows, and furnished interiors you can look into from the pavement: bookshop, boutique,
  florist, barber, mini-mart, arcade, café, bar, diner, tech store, gallery, gym and office
  lobbies, each with staff or customers inside. You cannot go in. Far away they fall back to the
  painted version with the same shop name.
- *Windows.* Behind every upper-floor pane the shader traces a room: back wall with a door and a
  picture, side walls, floor, ceiling lamp, a desk standing mid-room, blinds or curtains. Rooms
  shift with parallax as you move, and more of them are lit after dark.
- *Facades.* Piers on the bay lines, sunshades and ledges on the floor lines, cornices, quoins,
  and balconies on the apartment towers, lined up with the texture underneath.
- *Reflections.* A live probe renders the surroundings into a small cube, one face per frame, so
  car paint, shop glass and towers mirror the street they are on rather than just the sky.

**Also:** a weapon wheel (fists, shock baton, pulse pistol, EMP charges, a hack tool), a wardrobe
at the safehouse, a gadget shop, five radio stations of generated music, a day-night cycle, and a
full map with GPS routing.

## Graphics settings

The game starts on **High** (**Medium** on phones) and steps down by itself if the frame rate is
poor. You can pick a preset in *Settings*; once you do, it stays where you put it.

| Preset | What changes |
| --- | --- |
| High | Ambient occlusion, 4× anti-aliasing, 4096 shadow map, reflection probe refreshed about once a second, shop interiors to 115 m, longest draw distance |
| Medium | 2× anti-aliasing, 2048 shadow map, probe every couple of seconds, shop interiors to about 100 m, no ambient occlusion |
| Low | No bloom, shadows, probe or street-lamp lighting; shop interiors to about 60 m; far tree models only; lower resolution |

Every preset gets the same models and textures; the presets only change lighting effects, shadow
quality and how far the detail reaches.

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
| `src/missions` | Jobs, races, markers, contracts, collectibles, stunt jumps |
| `src/touch.js` | Touch controls (they press the same keys the keyboard does) |
| `src/ui` | HUD, minimap and full map, menus, stylesheet |
| `src/audio` | Sound effects, engine, sirens, ambience, radio sequencer |
| `src/fx`, `src/ai`, `src/util` | Particles, AI driving, maths and noise helpers |

Everything is generated at load time: there are no model, texture or audio files.

How things are modelled, since there are no asset files:

- **Vehicles** are lofted (`src/entities/vehicleMesh.js`): a cross-section ring is evaluated at
  stations along the car and skinned into one smooth surface with real wheel arches, then split
  into paint, glass, chrome and trim by region. Paint is a metallic base under a clear coat.
- **People** are built from shared parts (`src/entities/bodyGeo.js`): lofted torsos, tapered limbs
  with knees and elbows, heads with faces, hair, hands and shoes. Pedestrians draw the same parts
  through instancing.
- **Surfaces** are painted on canvases in four layers at once: colour, emissive, roughness/metal,
  and height. The height layer becomes a normal map, so windows sit back in their frames and
  paving joints catch the light.
- **Grain.** Vertex-coloured geometry (roofs, concrete, bark, foliage) opts into a world-space
  grain in the shader: fine bumps, roughness breakup and slow colour mottling, projected along the
  world axes so it needs no UVs.
- **Shopfronts** (`src/world/shops.js`) are instanced bays: one frame, one sheet of glass and
  one interior per shop type. The interiors are shaded once when they are built and then drawn
  unlit, so a shop looks lit from inside at any hour. The painted strip in front of each bay
  discards itself with a dither as the camera approaches.
- **Rooms** behind facade glass are a fragment-shader ray cast into a box per bay per floor
  (`ROOMS_GLSL` in `src/world/city.js`); the red channel of the roughness map marks the glass.
- **Trees** have a cheap far model that is always drawn and a detailed crown that is added near
  the camera and sits over it, so there is no visible switch.

Two more things worth knowing if you read the code:

- **The world is a function.** Terrain height, biome and road surface are computed from `(x, z)`
  rather than read from meshes, so physics, AI and the map all ask the same source.
- **Street lighting is analytic.** A forward renderer cannot run thousands of lamps, but the city
  is a grid, so a shader patch (`src/world/citylight.js`) finds the nearest lamps and shopfronts to
  each pixel with arithmetic and lights it through the material's normal shading. Knock a lamp over
  and its light goes out.

## Limits

This was built and tested in a headless browser with software rendering. Game logic is covered by
scripted playthroughs of every job, and the touch controls by an emulated phone, but nobody has
played it on a real phone or a real graphics card: frame rate, how the music sounds, how the
touch layout feels under actual thumbs, and whether the medal times and fights are fair are all
unchecked. The detailed models, shop interiors and facade relief put a city frame at roughly 1.8 to
2.2 million triangles on Medium with shadows included, so older laptops and phones are more likely
to step down a preset than before. It is all generated geometry, painted textures and shader
tricks: closer to a real street than it was, but still not a photograph. Round towers keep painted
ground floors, and shop interiors repeat (there are thirteen kinds). Interiors, a story beyond the jobs above, and gamepad support are not included.
