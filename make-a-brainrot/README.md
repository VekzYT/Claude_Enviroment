# Make a Brainrot

A Roblox crafting and collection game. Buy materials, craft brainrots, put them
on your plot, earn cash while they sit there, rebirth for more slots.

Built for **Roblox Studio** with **Rojo 7**. Every part of the game is code --
the map builds itself when the server starts, so there is nothing to model by
hand and nothing important lives in a binary file.

## Getting it running

1. Open this folder (`make-a-brainrot`) in VS Code.
2. Start the Rojo server: **Ctrl+Shift+P → `Rojo: Open Menu` → `default.project.json`**.
3. In Studio, open any place, then **Plugins → Rojo → Connect**.
4. Press **Play**.

The map appears on its own. You do not need the Baseplate template's baseplate --
the server deletes it and builds its own ground.

**For saving to work**, tick *File → Game Settings → Security → Enable Studio
Access to API Services*. Without it the game still runs perfectly; progress just
does not persist between sessions, and the output window says so once.

## Playing

| | |
|---|---|
| **Materials Shop** | Walk up, press **E**. Buy wood, rope, scales and so on. |
| **Crafting Machine** | Walk up, press **E**. Spend materials on a brainrot. |
| **Your Bag** | Press **Q**. Place what you have crafted, or pick it back up. |
| **Rebirth** | The purple plinth. Costs cash, grants **+2 slots** and **+20% income**. |

You start with **$1,000** -- exactly enough for a Tung Tung Sahur, which is
5 Wood and 1 Baseball Bat. It pays for itself in about 36 seconds.

## The economy

Nine brainrots across nine rarities. Income roughly triples each tier and
payback time climbs with it, so a higher tier is always better but never a
shortcut.

| Brainrot | Rarity | Cost | Income | Payback |
|---|---|--:|--:|--:|
| Tung Tung Sahur | Common | 725 | 20/s | 36s |
| Tralalero Tralala | Uncommon | 5,880 | 65/s | 90s |
| Brr Brr Patapim | Rare | 41,950 | 210/s | 200s |
| Bombardiro Crocodilo | Epic | 301,000 | 700/s | 430s |
| Lirili Larila | Legendary | 1,895,000 | 2,300/s | 824s |
| Chimpanzini Bananini | Mythic | 10,888,000 | 7,500/s | 1,452s |
| Bombombini Gusini | Divine | 57,775,000 | 25,000/s | 2,311s |
| Sahur Combinasion | Secret | 279,060,000 | 82,000/s | 3,403s |
| La Vacca Saturno Saturnita | Brainrot God | 1,295,100,000 | 270,000/s | 4,797s |

Rebirth costs **$250,000 × 5.5^n** and caps at rebirth 7, which is 20 slots and
a 2.4x multiplier.

**These numbers are simulated, not guessed.** `tools/balance.py` checks that no
tier is ever cheaper or faster-paying than the one below it, then plays a
greedy perfect player through the whole game. That player maxes out in about
4h30m, so a real one -- who wanders off, chats, and buys the wrong thing -- is
looking at considerably longer.

    python3 tools/balance.py

Change any number in `src/shared/Config.luau`, mirror it in the script, and
re-run it before shipping the change. Nothing else in the codebase hardcodes
economy data.

## Layout

    src/
      shared/     Config    every tunable number
                  Models    brainrot figures, built from parts
                  Net       the RemoteEvents both sides use
      server/     init      bootstrap
                  World     builds the map
                  Plots     assigns plots, renders what is on them
                  Data      DataStore load and save
                  Economy   buying, crafting, placing, rebirth, income
      client/     init      wiring
                  Interface all UI

**The server decides everything.** The client sends requests -- never prices,
never quantities it has already validated -- and the server checks affordability
and ownership itself before anything happens. A player editing their local copy
gets nothing out of it. Requests are also budgeted at 20/second each, so a
spammed remote cannot cost the server anything.

## Not in yet

Deliberately, and in rough priority order:

- **The 30-minute Brainrot God spawn** -- a top-tier brainrot appearing in the
  hub with a server-wide announcement, first to reach it keeps it. This is the
  event the whole design orbits and it is the next thing to build.
- **Stealing and 1v1 duels**, with rebirth driving weapon quality.
- **Robux purchases.** Held back on purpose until the loop is proven fun.
