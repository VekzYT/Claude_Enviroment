'use strict'
// Every command receives one context object:
//   { bot, state, args, sender, reply, swarm, self, cfg }

const { goals } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const builder = require('./builder')

const ALIASES = {
  wood: 'log', logs: 'log', tree: 'log', trees: 'log',
  cobble: 'cobblestone', stone: 'stone',
  iron: 'iron_ore', gold: 'gold_ore', diamond: 'diamond_ore',
  coal: 'coal_ore', copper: 'copper_ore', redstone: 'redstone_ore',
  dirt: 'dirt', sand: 'sand', gravel: 'gravel'
}

function resolveBlocks (bot, word) {
  const w = (ALIASES[word] || word).toLowerCase()
  if (bot.registry.blocksByName[w]) return [bot.registry.blocksByName[w].id]
  const ids = []
  for (const name of Object.keys(bot.registry.blocksByName)) {
    if (name.endsWith('_' + w) || name.startsWith(w + '_') || name.includes(w)) {
      ids.push(bot.registry.blocksByName[name].id)
    }
  }
  return ids
}

const findItem = (bot, word) => {
  const w = String(word).toLowerCase()
  return bot.inventory.items().find(i => i.name === w) ||
         bot.inventory.items().find(i => i.name.includes(w))
}

function clearTasks (bot, state) {
  state.following = null
  state.guarding = false
  state.building = false
  try { bot.pvp.stop() } catch {}
  try { bot.pathfinder.stop() } catch {}
  bot.pathfinder.setGoal(null)
  try { bot.stopDigging() } catch {}
}

const playerPos = (bot, sender) => bot.players[sender]?.entity?.position || null

// ------------------------------------------------------------------ commands

const commands = {

  // ---- crew management -------------------------------------------------
  spawn: {
    desc: 'spawn <n> - bring more of me',
    run: async ({ args, reply, swarm }) => {
      const n = Math.max(1, Math.min(parseInt(args[0], 10) || 1, swarm.cfg.maxBots))
      let made = 0
      for (let i = 0; i < n; i++) {
        try { await swarm.add(swarm.nextName()); made++ } catch (e) { reply(e.message); break }
      }
      if (made) reply(`${made} more of me - crew is now ${swarm.names().join(', ')}`)
    }
  },

  dismiss: {
    desc: 'dismiss <name|all> - send one home',
    run: ({ args, reply, swarm, self }) => {
      const who = (args[0] || '').toLowerCase()
      if (who === 'all') {
        const others = swarm.members.filter(m => m !== swarm.leader())
        others.forEach(m => swarm.remove(m.name))
        return reply(`dismissed ${others.length}`)
      }
      if (!who) return reply('dismiss who?')
      if (swarm.leader() && who === swarm.leader().name.toLowerCase()) return reply('I have to stay - dismiss the others')
      reply(swarm.remove(who) ? `${who} dismissed` : `no ${who} here`)
    }
  },

  crew: {
    desc: 'who is here',
    run: ({ reply, swarm }) => reply(`${swarm.members.length} of us: ${swarm.names().join(', ')}`)
  },

  // ---- building --------------------------------------------------------
  build: {
    desc: 'build <thing> [size] - see "build list"',
    run: async ({ bot, args, sender, reply, state }) => {
      const what = (args[0] || '').toLowerCase()
      if (!what || what === 'list') return reply('I can build: ' + builder.blueprints.join(', '))
      const p = playerPos(bot, sender) || bot.entity.position
      const nums = args.slice(1).filter(a => /^\d+$/.test(a))
      const mat = args.slice(1).find(a => /^[a-z_]+$/.test(a))
      nums.mat = mat && bot.registry.itemsByName[mat] ? mat : undefined
      const origin = p.floored().offset(2, 0, 2)
      await builder.build(bot, what, nums, origin, reply, state)
    }
  },

  // ---- movement --------------------------------------------------------
  come: {
    desc: 'walk to you',
    run: async ({ bot, sender, reply, state }) => {
      const p = playerPos(bot, sender)
      if (!p) return reply("can't see you")
      clearTasks(bot, state)
      reply('coming')
      try { await bot.pathfinder.goto(new goals.GoalNear(p.x, p.y, p.z, 2)); reply('here') } catch (e) { reply("couldn't get there") }
    }
  },

  follow: {
    desc: 'follow [player]',
    run: ({ bot, args, sender, reply, state }) => {
      const target = args[0] && isNaN(parseInt(args[0], 10)) ? args[0] : sender
      if (!bot.players[target]?.entity) return reply(`can't see ${target}`)
      clearTasks(bot, state)
      state.following = target
      state.followRange = parseInt(args[1], 10) || 2
      reply(`following ${target}`)
    }
  },

  goto: {
    desc: 'goto <x y z>',
    run: async ({ bot, args, reply, state }) => {
      const [x, y, z] = args.map(Number)
      if ([x, y, z].some(isNaN)) return reply('goto x y z')
      clearTasks(bot, state)
      reply(`heading to ${x} ${y} ${z}`)
      try { await bot.pathfinder.goto(new goals.GoalNear(x, y, z, 2)); reply('arrived') } catch { reply("couldn't reach it") }
    }
  },

  fly: {
    desc: 'fly <x y z> (creative)',
    run: async ({ bot, args, reply }) => {
      if (bot.game.gameMode !== 'creative') return reply('only in creative')
      const [x, y, z] = args.map(Number)
      if ([x, y, z].some(isNaN)) return reply('fly x y z')
      try {
        bot.creative.startFlying()   // flyTo never resolves unless flight is on
        await bot.creative.flyTo(new Vec3(x, y, z))
        reply('there')
      } catch { reply("couldn't fly there") }
    }
  },

  explore: {
    desc: 'explore [blocks] - wander off and look around',
    run: async ({ bot, args, reply, state }) => {
      const d = Math.min(parseInt(args[0], 10) || 40, 200)
      clearTasks(bot, state)
      const a = Math.random() * Math.PI * 2
      const p = bot.entity.position.offset(Math.cos(a) * d, 0, Math.sin(a) * d)
      reply(`exploring ${d} blocks out`)
      try { await bot.pathfinder.goto(new goals.GoalNear(p.x, p.y, p.z, 4)) } catch {}
      commands.look.run({ bot, reply })
    }
  },

  stop: {
    desc: 'stop everything',
    run: ({ bot, reply, state }) => { clearTasks(bot, state); reply('stopped') }
  },

  // ---- gathering -------------------------------------------------------
  mine: {
    desc: 'mine <block> [count]',
    run: async ({ bot, args, reply, state }) => {
      if (!args[0]) return reply('mine what?')
      const count = parseInt(args[1], 10) || 1
      const ids = resolveBlocks(bot, args[0])
      if (!ids.length) return reply(`no block called ${args[0]}`)
      const found = bot.findBlocks({ matching: ids, maxDistance: 64, count })
      if (!found.length) return reply(`no ${args[0]} within 64 blocks`)
      clearTasks(bot, state)
      reply(`mining ${found.length} ${args[0]}`)
      try {
        await bot.collectBlock.collect(found.map(v => bot.blockAt(v)).filter(Boolean), { ignoreNoPath: true })
        reply(`got the ${args[0]}`)
      } catch (e) { reply('stopped: ' + e.message.slice(0, 50)) }
    }
  },

  dig: {
    desc: 'dig [down|up] [n]',
    run: async ({ bot, args, reply }) => {
      const dir = (args[0] || '').toLowerCase()
      if (dir === 'down' || dir === 'up') {
        const n = Math.min(parseInt(args[1], 10) || 5, 64)
        for (let i = 0; i < n; i++) {
          const b = bot.blockAt(bot.entity.position.offset(0, dir === 'down' ? -1 : 2, 0))
          if (!b || b.name === 'air' || !bot.canDigBlock(b)) break
          try { await bot.tool.equipForBlock(b) } catch {}
          try { await bot.dig(b) } catch { break }
        }
        return reply(`dug ${dir}`)
      }
      const b = bot.blockAtCursor(6)
      if (!b) return reply('nothing in front of me')
      try { await bot.tool.equipForBlock(b) } catch {}
      await bot.dig(b)
      reply(`dug ${b.name}`)
    }
  },

  clear: {
    desc: 'clear <radius> - flatten everything around me',
    run: async ({ bot, args, reply, state }) => {
      const r = Math.min(parseInt(args[0], 10) || 4, 12)
      const base = bot.entity.position.floored()
      state.building = true
      let n = 0
      for (let y = 0; y < 5; y++) for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) {
        if (!state.building) return reply(`stopped after ${n}`)
        const b = bot.blockAt(base.offset(x, y, z))
        if (!b || b.name === 'air' || b.name === 'bedrock' || !bot.canDigBlock(b)) continue
        await builder.moveWithinReach(bot, b.position)
        try { await bot.dig(b); n++ } catch {}
      }
      state.building = false
      reply(`cleared ${n} blocks`)
    }
  },

  collect: {
    desc: 'pick up dropped items nearby',
    run: async ({ bot, reply, state }) => {
      const drops = Object.values(bot.entities).filter(e => e.name === 'item' &&
        e.position.distanceTo(bot.entity.position) < 32)
      if (!drops.length) return reply('nothing on the ground')
      clearTasks(bot, state)
      reply(`picking up ${drops.length}`)
      for (const d of drops.slice(0, 30)) {
        try { await bot.pathfinder.goto(new goals.GoalNear(d.position.x, d.position.y, d.position.z, 1)) } catch {}
      }
      reply('got them')
    }
  },

  harvest: {
    desc: 'harvest grown crops nearby',
    run: async ({ bot, reply }) => {
      const ids = ['wheat', 'carrots', 'potatoes', 'beetroots']
        .map(n => bot.registry.blocksByName[n]?.id).filter(Boolean)
      const found = bot.findBlocks({ matching: ids, maxDistance: 32, count: 64 })
      let n = 0
      for (const v of found) {
        const b = bot.blockAt(v)
        if (!b || (b.metadata !== undefined && b.metadata < 7)) continue
        await builder.moveWithinReach(bot, v)
        try { await bot.dig(b); n++ } catch {}
      }
      reply(n ? `harvested ${n}` : 'nothing ripe nearby')
    }
  },

  // ---- items -----------------------------------------------------------
  bring: {
    desc: 'bring <item> [n] - hand you an item (creative)',
    run: async ({ bot, args, sender, reply }) => {
      if (!args[0]) return reply('bring what?')
      const name = args[0].toLowerCase()
      const n = Math.min(parseInt(args[1], 10) || 64, 64)
      if (!bot.registry.itemsByName[name]) return reply(`no item called ${name}`)
      if (bot.game.gameMode !== 'creative' && !findItem(bot, name)) return reply(`I have no ${name} and we are not in creative`)
      if (!await builder.ensureHolding(bot, name)) return reply(`couldn't get ${name}`)
      const p = playerPos(bot, sender)
      if (p) {
        try { await bot.pathfinder.goto(new goals.GoalNear(p.x, p.y, p.z, 3)) } catch {}
        await bot.lookAt(p.offset(0, 1, 0))
      }
      const held = bot.heldItem
      if (!held) return reply('lost it somehow')
      await bot.toss(held.type, null, Math.min(n, held.count))
      reply(`there is your ${name}`)
    }
  },

  give: {
    desc: 'give <item> [n] - toss you something I carry',
    run: async ({ bot, args, sender, reply }) => {
      const item = findItem(bot, args[0] || '')
      if (!item) return reply(`no ${args[0]} on me`)
      const p = playerPos(bot, sender)
      if (p) await bot.lookAt(p.offset(0, 1, 0))
      await bot.toss(item.type, null, Math.min(parseInt(args[1], 10) || item.count, item.count))
      reply(`tossed you ${item.name}`)
    }
  },

  drop: {
    desc: 'drop all - empty my pockets',
    run: async ({ bot, args, reply }) => {
      if ((args[0] || '').toLowerCase() !== 'all') {
        const it = findItem(bot, args[0] || '')
        if (!it) return reply('drop what?')
        await bot.toss(it.type, null, it.count)
        return reply('dropped ' + it.name)
      }
      for (const it of bot.inventory.items()) { try { await bot.toss(it.type, null, it.count) } catch {} }
      reply('dropped everything')
    }
  },

  equip: {
    desc: 'equip <item>',
    run: async ({ bot, args, reply }) => {
      if (bot.game.gameMode === 'creative' && bot.registry.itemsByName[(args[0] || '').toLowerCase()]) {
        await builder.ensureHolding(bot, args[0].toLowerCase())
        return reply('holding ' + args[0])
      }
      const item = findItem(bot, args[0] || '')
      if (!item) return reply('do not have that')
      await bot.equip(item, 'hand')
      reply('holding ' + item.name)
    }
  },

  wear: {
    desc: 'wear <armour piece>',
    run: async ({ bot, args, reply }) => {
      const name = (args[0] || '').toLowerCase()
      if (!name) return reply('wear what?')
      const slot = name.includes('helmet') ? 'head' : name.includes('chestplate') ? 'torso'
        : name.includes('leggings') ? 'legs' : name.includes('boots') ? 'feet' : null
      if (!slot) return reply('that is not armour')
      if (bot.game.gameMode === 'creative') await builder.ensureHolding(bot, name)
      const item = findItem(bot, name)
      if (!item) return reply(`no ${name}`)
      await bot.equip(item, slot)
      reply(`wearing ${name}`)
    }
  },

  chest: {
    desc: 'put my things in a nearby chest',
    run: async ({ bot, reply }) => {
      const c = bot.findBlock({ matching: bot.registry.blocksByName.chest?.id, maxDistance: 16 })
      if (!c) return reply('no chest nearby')
      await builder.moveWithinReach(bot, c.position)
      try {
        const chest = await bot.openContainer(c)
        let n = 0
        for (const it of bot.inventory.items()) { try { await chest.deposit(it.type, null, it.count); n++ } catch {} }
        chest.close()
        reply(`stored ${n} stacks`)
      } catch (e) { reply('could not use the chest') }
    }
  },

  // ---- utility ---------------------------------------------------------
  place: {
    desc: 'place <block> under me',
    run: async ({ bot, args, reply }) => {
      if (!args[0]) return reply('place what?')
      const pos = bot.entity.position.floored().offset(1, 0, 0)
      reply(await builder.placeOne(bot, pos, args[0].toLowerCase()) ? `placed ${args[0]}` : 'could not place that')
    }
  },

  tower: {
    desc: 'tower <n> - pillar up',
    run: async ({ bot, args, reply }) => {
      const n = Math.min(parseInt(args[0], 10) || 5, 40)
      const mat = args[1] || (bot.game.gameMode === 'creative' ? 'cobblestone' : null)
      if (mat && !await builder.ensureHolding(bot, mat)) return reply('no blocks to build with')
      for (let i = 0; i < n; i++) {
        const ref = bot.blockAt(bot.entity.position.offset(0, -1, 0))
        if (!ref || ref.name === 'air') break
        bot.setControlState('jump', true)
        await new Promise(r => setTimeout(r, 350))
        try { await bot.placeBlock(ref, new Vec3(0, 1, 0)) } catch {}
        bot.setControlState('jump', false)
      }
      reply(`up ${n}`)
    }
  },

  light: {
    desc: 'light [n] - put torches around',
    run: async ({ bot, args, reply }) => {
      const n = Math.min(parseInt(args[0], 10) || 8, 32)
      let placed = 0
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        const p = bot.entity.position.floored().offset(Math.round(Math.cos(a) * 4), 0, Math.round(Math.sin(a) * 4))
        if (await builder.placeOne(bot, p, 'torch')) placed++
      }
      reply(`placed ${placed} torches`)
    }
  },

  // ---- combat ----------------------------------------------------------
  attack: {
    desc: 'attack <mob>',
    run: ({ bot, args, reply, state }) => {
      const want = (args[0] || '').toLowerCase()
      const t = bot.nearestEntity(e => e !== bot.entity &&
        (!want || (e.name || '').includes(want) || (e.username || '').toLowerCase() === want))
      if (!t) return reply('nothing to attack')
      clearTasks(bot, state)
      bot.pvp.attack(t)
      reply('attacking ' + (t.username || t.name))
    }
  },

  guard: {
    desc: 'fight hostiles near me',
    run: ({ bot, reply, state }) => { clearTasks(bot, state); state.guarding = true; reply('guarding') }
  },

  hunt: {
    desc: 'hunt <mob> - seek it out and kill it',
    run: async ({ bot, args, reply, state }) => {
      const want = (args[0] || '').toLowerCase()
      const t = bot.nearestEntity(e => e !== bot.entity && (e.name || '').includes(want))
      if (!t) return reply(`no ${want} in sight`)
      clearTasks(bot, state)
      reply(`hunting ${t.name}`)
      try { await bot.pathfinder.goto(new goals.GoalNear(t.position.x, t.position.y, t.position.z, 2)) } catch {}
      bot.pvp.attack(t)
    }
  },

  // ---- info ------------------------------------------------------------
  where: {
    desc: 'where I am',
    run: ({ bot, reply }) => {
      const p = bot.entity.position
      const u = bot.blockAt(p.offset(0, -1, 0))
      reply(`${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)} in ${u ? bot.registry.biomes[u.biome.id]?.name : '?'} | hp ${bot.health.toFixed(0)} food ${bot.food}`)
    }
  },

  look: {
    desc: 'what is around me',
    run: ({ bot, reply }) => {
      const near = Object.values(bot.entities)
        .filter(e => e !== bot.entity && e.position.distanceTo(bot.entity.position) < 24 &&
                     (e.type === 'mob' || e.type === 'player' || e.type === 'hostile'))
        .map(e => `${e.username || e.name} ${e.position.distanceTo(bot.entity.position).toFixed(0)}m`)
      reply(near.length ? near.slice(0, 6).join(', ') : 'nothing around')
    }
  },

  inv: {
    desc: 'what I am carrying',
    run: ({ bot, reply }) => {
      const it = bot.inventory.items()
      reply(it.length ? it.map(i => `${i.name} x${i.count}`).slice(0, 10).join(', ') : 'empty')
    }
  },

  eat: {
    desc: 'eat something',
    run: async ({ bot, reply }) => {
      let food = bot.inventory.items().find(i => bot.registry.foodsByName[i.name])
      if (!food && bot.game.gameMode === 'creative') {
        await builder.ensureHolding(bot, 'cooked_beef')
        food = bot.heldItem
      }
      if (!food) return reply('no food')
      await bot.equip(food, 'hand')
      try { await bot.consume(); reply('ate ' + food.name) } catch { reply('could not eat') }
    }
  },

  sleep: {
    desc: 'find a bed and sleep',
    run: async ({ bot, reply }) => {
      const bed = bot.findBlock({ matching: b => bot.isABed(b), maxDistance: 24 })
      if (!bed) return reply('no bed nearby')
      try { await bot.pathfinder.goto(new goals.GoalNear(bed.position.x, bed.position.y, bed.position.z, 2)) } catch {}
      try { await bot.sleep(bed); reply('goodnight') } catch (e) { reply('cannot sleep: ' + e.message.slice(0, 40)) }
    }
  },

  craft: {
    desc: 'craft <item> [n]',
    run: async ({ bot, args, reply }) => {
      const def = bot.registry.itemsByName[(args[0] || '').toLowerCase()]
      if (!def) return reply('craft what?')
      const table = bot.findBlock({ matching: bot.registry.blocksByName.crafting_table?.id, maxDistance: 6 })
      const r = bot.recipesFor(def.id, null, 1, table)
      if (!r.length) return reply(table ? 'cannot make that' : 'need a crafting table nearby')
      try { await bot.craft(r[0], parseInt(args[1], 10) || 1, table); reply('crafted ' + def.name) } catch (e) { reply('craft failed') }
    }
  },

  say: { desc: 'say <text>', run: ({ bot, args }) => bot.chat(args.join(' ')) },

  version: {
    desc: 'which version of me is running',
    run: ({ reply, swarm }) => reply(
      `v${require('../package.json').version}, ${swarm.members.length} of us running`)
  },

  dance: {
    desc: 'dance',
    run: async ({ bot, reply }) => {
      reply('watch this')
      for (let i = 0; i < 16; i++) {
        await bot.look(bot.entity.yaw + Math.PI / 4, (i % 4 === 0 ? -0.5 : 0.5))
        bot.setControlState('jump', i % 2 === 0)
        await new Promise(r => setTimeout(r, 180))
      }
      bot.setControlState('jump', false)
    }
  },

  help: {
    desc: 'list commands',
    run: ({ args, reply }) => {
      const topic = (args[0] || '').toLowerCase()
      if (topic && commands[topic]) return reply(`${topic}: ${commands[topic].desc}`)
      if (topic === 'build') return reply('build: ' + builder.blueprints.join(', '))
      reply('commands: ' + Object.keys(commands).join(' '))
      reply('say "claude help <command>" for one, or "claude build list"')
    }
  }
}

module.exports = { commands, clearTasks, resolveBlocks }
