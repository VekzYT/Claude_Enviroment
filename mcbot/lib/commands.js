'use strict'
// Chat-driven abilities. Every command gets ({ bot, args, sender, reply, state }).

const { goals, Movements } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')

// Loose names people actually type -> concrete block families.
const ALIASES = {
  wood: 'log', logs: 'log', tree: 'log', trees: 'log',
  stone: 'stone', cobble: 'cobblestone',
  iron: 'iron_ore', gold: 'gold_ore', diamond: 'diamond_ore',
  coal: 'coal_ore', copper: 'copper_ore',
  dirt: 'dirt', sand: 'sand', gravel: 'gravel'
}

/** Resolve a typed word into a list of matching block ids. */
function resolveBlocks (bot, word) {
  const w = (ALIASES[word] || word).toLowerCase()
  const ids = []
  for (const name of Object.keys(bot.registry.blocksByName)) {
    if (name === w || name.endsWith('_' + w) || name.startsWith(w + '_') || name.includes(w)) {
      ids.push(bot.registry.blocksByName[name].id)
    }
  }
  // Exact match wins outright if there is one.
  if (bot.registry.blocksByName[w]) return [bot.registry.blocksByName[w].id]
  return ids
}

function findItem (bot, word) {
  const w = word.toLowerCase()
  return bot.inventory.items().find(i => i.name === w) ||
         bot.inventory.items().find(i => i.name.includes(w))
}

function clearTasks (bot, state) {
  state.following = null
  state.guarding = false
  try { bot.pvp.stop() } catch {}
  try { bot.pathfinder.stop() } catch {}
  bot.pathfinder.setGoal(null)
  try { bot.stopDigging() } catch {}
}

const commands = {
  help: {
    desc: 'list what I can do',
    run: ({ reply }) => {
      const names = Object.entries(commands).map(([n, c]) => `${n} - ${c.desc}`)
      reply('commands: ' + Object.keys(commands).join(', '))
      for (const line of names.slice(0, 6)) reply('  ' + line)
    }
  },

  come: {
    desc: 'walk to you',
    run: async ({ bot, sender, reply, state }) => {
      const p = bot.players[sender]?.entity
      if (!p) return reply("can't see you - come into view first")
      clearTasks(bot, state)
      reply('on my way')
      await bot.pathfinder.goto(new goals.GoalNear(p.position.x, p.position.y, p.position.z, 2))
      reply('here')
    }
  },

  follow: {
    desc: 'follow you until told to stop',
    run: ({ bot, args, sender, reply, state }) => {
      const target = args[0] || sender
      const p = bot.players[target]?.entity
      if (!p) return reply(`can't see ${target}`)
      clearTasks(bot, state)
      state.following = target
      bot.pathfinder.setGoal(new goals.GoalFollow(p, 2), true)
      reply(`following ${target}`)
    }
  },

  stop: {
    desc: 'drop whatever I am doing',
    run: ({ bot, reply, state }) => { clearTasks(bot, state); reply('stopped') }
  },

  where: {
    desc: 'report position and surroundings',
    run: ({ bot, reply }) => {
      const p = bot.entity.position
      const under = bot.blockAt(p.offset(0, -1, 0))
      const biome = under ? bot.registry.biomes[under.biome.id]?.name : '?'
      reply(`${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)} in ${biome} | hp ${bot.health.toFixed(0)} food ${bot.food}`)
    }
  },

  look: {
    desc: 'describe what is around me',
    run: ({ bot, reply }) => {
      const mobs = Object.values(bot.entities)
        .filter(e => e !== bot.entity && e.position.distanceTo(bot.entity.position) < 24 && (e.type === 'mob' || e.type === 'player' || e.type === 'hostile'))
        .map(e => `${e.username || e.name} (${e.position.distanceTo(bot.entity.position).toFixed(0)}m)`)
      reply(mobs.length ? 'nearby: ' + mobs.slice(0, 6).join(', ') : 'nothing nearby')
    }
  },

  inv: {
    desc: 'list my inventory',
    run: ({ bot, reply }) => {
      const items = bot.inventory.items()
      reply(items.length ? items.map(i => `${i.name} x${i.count}`).slice(0, 10).join(', ') : 'empty')
    }
  },

  mine: {
    desc: 'mine <block> [count] - gather blocks',
    run: async ({ bot, args, reply, state }) => {
      if (!args[0]) return reply('mine what?')
      const count = parseInt(args[1], 10) || 1
      const ids = resolveBlocks(bot, args[0])
      if (!ids.length) return reply(`don't know a block called ${args[0]}`)
      const found = bot.findBlocks({ matching: ids, maxDistance: 48, count })
      if (!found.length) return reply(`no ${args[0]} within 48 blocks`)
      clearTasks(bot, state)
      reply(`mining ${found.length} ${args[0]}`)
      const blocks = found.map(v => bot.blockAt(v)).filter(Boolean)
      try {
        await bot.collectBlock.collect(blocks, { ignoreNoPath: true })
        reply(`got ${args[0]}`)
      } catch (e) { reply('mining stopped: ' + e.message.slice(0, 60)) }
    }
  },

  dig: {
    desc: 'dig the block I am looking at',
    run: async ({ bot, reply }) => {
      const b = bot.blockAtCursor(6) || bot.blockAt(bot.entity.position.offset(0, -1, 0))
      if (!b || !bot.canDigBlock(b)) return reply('nothing I can dig there')
      try { await bot.tool.equipForBlock(b) } catch {}
      await bot.dig(b)
      reply(`dug ${b.name}`)
    }
  },

  place: {
    desc: 'place <block> under me',
    run: async ({ bot, args, reply }) => {
      if (!args[0]) return reply('place what?')
      const item = findItem(bot, args[0])
      if (!item) return reply(`no ${args[0]} in my inventory`)
      const ref = bot.blockAt(bot.entity.position.offset(0, -1, 0))
      await bot.equip(item, 'hand')
      try {
        await bot.placeBlock(ref, new Vec3(0, 1, 0))
        reply(`placed ${item.name}`)
      } catch (e) { reply('could not place: ' + e.message.slice(0, 60)) }
    }
  },

  tower: {
    desc: 'tower <n> - pillar up n blocks',
    run: async ({ bot, args, reply }) => {
      const n = Math.min(parseInt(args[0], 10) || 5, 40)
      const item = bot.inventory.items().find(i => bot.registry.blocksByName[i.name])
      if (!item) return reply('no placeable blocks on me')
      await bot.equip(item, 'hand')
      for (let i = 0; i < n; i++) {
        const ref = bot.blockAt(bot.entity.position.offset(0, -1, 0))
        if (!ref || ref.name === 'air') { reply('lost my footing'); break }
        bot.setControlState('jump', true)
        await new Promise(r => setTimeout(r, 380))
        try { await bot.placeBlock(ref, new Vec3(0, 1, 0)) } catch {}
        bot.setControlState('jump', false)
      }
      reply(`towered up ${n}`)
    }
  },

  give: {
    desc: 'give <item> [count] - toss you an item',
    run: async ({ bot, args, sender, reply }) => {
      if (!args[0]) return reply('give what?')
      const item = findItem(bot, args[0])
      if (!item) return reply(`no ${args[0]} on me`)
      const p = bot.players[sender]?.entity
      if (p) await bot.lookAt(p.position.offset(0, 1, 0))
      const n = parseInt(args[1], 10) || item.count
      await bot.toss(item.type, null, Math.min(n, item.count))
      reply(`tossed ${n} ${item.name}`)
    }
  },

  equip: {
    desc: 'equip <item>',
    run: async ({ bot, args, reply }) => {
      const item = findItem(bot, args[0] || '')
      if (!item) return reply('do not have that')
      await bot.equip(item, 'hand')
      reply('holding ' + item.name)
    }
  },

  eat: {
    desc: 'eat something',
    run: async ({ bot, reply }) => {
      const food = bot.inventory.items().find(i => bot.registry.foodsByName[i.name])
      if (!food) return reply('no food on me')
      await bot.equip(food, 'hand')
      try { await bot.consume(); reply('ate ' + food.name) } catch (e) { reply('could not eat') }
    }
  },

  attack: {
    desc: 'attack <mob> - hit the nearest one',
    run: ({ bot, args, reply, state }) => {
      const want = (args[0] || '').toLowerCase()
      const target = bot.nearestEntity(e =>
        e !== bot.entity && (!want || (e.name || '').includes(want) || (e.username || '').toLowerCase() === want))
      if (!target) return reply('nothing to attack')
      clearTasks(bot, state)
      bot.pvp.attack(target)
      reply('attacking ' + (target.username || target.name))
    }
  },

  guard: {
    desc: 'fight off hostile mobs near me',
    run: ({ bot, reply, state }) => {
      clearTasks(bot, state)
      state.guarding = true
      reply('guarding')
    }
  },

  sleep: {
    desc: 'get in a nearby bed',
    run: async ({ bot, reply }) => {
      const bed = bot.findBlock({ matching: b => bot.isABed(b), maxDistance: 16 })
      if (!bed) return reply('no bed nearby')
      await bot.pathfinder.goto(new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 2))
      try { await bot.sleep(bed); reply('goodnight') } catch (e) { reply('cannot sleep: ' + e.message.slice(0, 60)) }
    }
  },

  craft: {
    desc: 'craft <item> [n]',
    run: async ({ bot, args, reply }) => {
      if (!args[0]) return reply('craft what?')
      const def = bot.registry.itemsByName[args[0].toLowerCase()]
      if (!def) return reply(`no item called ${args[0]}`)
      const table = bot.findBlock({ matching: bot.registry.blocksByName.crafting_table?.id, maxDistance: 6 })
      const recipes = bot.recipesFor(def.id, null, 1, table)
      if (!recipes.length) return reply(table ? 'no recipe I can make' : 'need a crafting table nearby')
      try {
        await bot.craft(recipes[0], parseInt(args[1], 10) || 1, table)
        reply('crafted ' + def.name)
      } catch (e) { reply('craft failed: ' + e.message.slice(0, 60)) }
    }
  },

  say: {
    desc: 'say <text>',
    run: ({ bot, args }) => bot.chat(args.join(' '))
  }
}

module.exports = { commands, clearTasks, resolveBlocks }
