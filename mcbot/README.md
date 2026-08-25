# mcbot — a Minecraft bot for Minecraft 26.2 (a.k.a. "1.26.2")

A [mineflayer](https://github.com/PrismarineJS/mineflayer) bot that can join a
modern Minecraft: Java Edition server, take orders in chat, and play alongside you.

## The version problem, and how this solves it

Mojang dropped the `1.` prefix, so what people call "1.26.2" is really **`26.2`**
(protocol 776). That matters because the bot libraries have not caught up:

| layer | newest version it speaks |
|---|---|
| `mineflayer` (world model, pathfinding, inventory) | **1.21.11** |
| `node-minecraft-protocol` (raw packets) | 26.1 |
| a real 26.2 server | **26.2** |

So mineflayer cannot talk to a 26.2 server at all. This project puts
[ViaProxy](https://github.com/ViaVersion/ViaProxy) in the middle:

```
mineflayer ──1.21.11──> ViaProxy (localhost) ──26.2──> your server
```

`index.js` starts and supervises ViaProxy for you; you do not run it by hand.

If the machine running this bot blocks raw outbound TCP but allows an HTTP
proxy, set `MC_BACKEND_PROXY` and ViaProxy will tunnel the server connection
through it via `CONNECT`. It defaults to `HTTPS_PROXY`.

## Running it

```bash
npm install
MC_HOST=your.server.address MC_PORT=25565 node index.js
```

The first run downloads ViaProxy (~47MB) into `vendor/`.

### Settings (all environment variables)

| variable | default | meaning |
|---|---|---|
| `MC_HOST` / `MC_PORT` | `127.0.0.1` / `25565` | the server to join |
| `MC_VERSION` | `26.2` | the version your server actually runs |
| `MC_USERNAME` | `Claude` | the bot's name |
| `MC_AUTH` | `offline` | `offline`, or `microsoft` for a real account |
| `MC_PREFIX` | `claude` | the word the bot answers to in chat |
| `MC_BACKEND_PROXY` | `$HTTPS_PROXY` | HTTP proxy for the outbound hop |
| `MC_DIRECT` | unset | set to `1` to skip ViaProxy entirely |
| `MC_CONTROL_PORT` | `25599` | local operator console |

### Server requirements

* If the server runs `online-mode=true` (the default), the bot needs its own
  paid Minecraft account — set `MC_AUTH=microsoft` and complete the device-code
  login it prints. It cannot share the account you are playing on.
* With `online-mode=false`, the bot joins with just a username and needs no account.

## Talking to it

In game, prefix a message with the bot's name:

```
claude come
claude mine wood 10
claude follow
claude stop
```

| command | what it does |
|---|---|
| `help` | list commands |
| `come` | pathfind to you |
| `follow [player]` | follow until told to stop |
| `stop` | abandon the current task |
| `where` / `look` / `inv` | position and biome / nearby entities / inventory |
| `mine <block> [n]` | find, dig and collect blocks (`wood`, `iron`, `stone`…) |
| `dig` | dig the block it is looking at |
| `place <block>` | place a block underneath itself |
| `tower <n>` | pillar straight up |
| `give <item> [n]` | toss you an item |
| `equip <item>` | hold an item |
| `eat` | eat from inventory |
| `attack <mob>` | attack the nearest match |
| `guard` | fight hostiles that come within 16 blocks |
| `sleep` | find a bed and use it |
| `craft <item> [n]` | craft (needs a crafting table within 6 blocks) |
| `say <text>` | speak in chat |

### Operator console

The bot also listens on `127.0.0.1:25599` for the same commands, one per line,
so it can be driven without being in the game:

```bash
echo "mine wood 5" | nc 127.0.0.1 25599
```
