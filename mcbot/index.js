'use strict'
const net = require('net')
const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { plugin: collectBlock } = require('mineflayer-collectblock')
const { plugin: pvp } = require('mineflayer-pvp')
const toolPlugin = require('mineflayer-tool').plugin

const cfg = require('./config')
const viaproxy = require('./lib/viaproxy')
const { commands, clearTasks } = require('./lib/commands')

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a)
const state = { following: null, guarding: false }
let bot = null
let via = null
let stopping = false

function dispatch (line, sender, reply) {
  const parts = line.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return
  const name = parts[0].toLowerCase()
  const cmd = commands[name]
  if (!cmd) return reply(`unknown command "${name}" - try help`)
  Promise.resolve()
    .then(() => cmd.run({ bot, args: parts.slice(1), sender, reply, state }))
    .catch(e => reply('error: ' + String(e.message).slice(0, 80)))
}

function attach () {
  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(pvp)
  bot.loadPlugin(toolPlugin)

  bot.once('spawn', () => {
    const moves = new Movements(bot)
    moves.allowSprinting = true
    moves.canDig = true
    bot.pathfinder.setMovements(moves)
    const p = bot.entity.position
    log(`spawned as ${bot.username} at ${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)} (${bot.game.gameMode})`)
    bot.chat(`ready - say "${cfg.prefix} help"`)
  })

  // In-game chat: "claude come", "claude mine wood 5", ...
  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    const m = message.trim()
    if (!m.toLowerCase().startsWith(cfg.prefix)) return
    const rest = m.slice(cfg.prefix.length).trim()
    if (!rest) return
    log(`<${username}> ${m}`)
    dispatch(rest, username, text => bot.chat(text))
  })

  bot.on('whisper', (username, message) => {
    if (username === bot.username) return
    log(`whisper <${username}> ${message}`)
    dispatch(message, username, text => bot.whisper(username, text))
  })

  // Keep following a moving player, and fight back when guarding.
  let tick = 0
  bot.on('physicsTick', () => {
    if (++tick % 10) return
    if (state.following) {
      const e = bot.players[state.following]?.entity
      if (e) bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals.GoalFollow)(e, 2), true)
    }
    if (state.guarding && !bot.pvp.target) {
      const hostile = bot.nearestEntity(e =>
        e !== bot.entity && (e.kind === 'Hostile mobs' || e.type === 'hostile') &&
        e.position.distanceTo(bot.entity.position) < 16)
      if (hostile) bot.pvp.attack(hostile)
    }
  })

  bot.on('death', () => log('died'))
  bot.on('health', () => { if (bot.health < 6) log(`low health: ${bot.health}`) })
  bot.on('kicked', reason => log('kicked:', JSON.stringify(reason).slice(0, 200)))
  bot.on('error', err => log('error:', err.message))
  bot.on('end', reason => {
    log('disconnected:', reason)
    if (!stopping) setTimeout(connectBot, 5000)
  })
}

function connectBot () {
  const target = cfg.direct
    ? { host: cfg.host, port: cfg.port, version: cfg.serverVersion }
    : { host: '127.0.0.1', port: cfg.localPort, version: cfg.botVersion }
  log(`connecting as ${cfg.username} -> ${target.host}:${target.port} (speaking ${target.version})`)
  bot = mineflayer.createBot({
    ...target,
    username: cfg.username,
    auth: cfg.direct && cfg.auth === 'microsoft' ? 'microsoft' : 'offline',
    checkTimeoutInterval: 60000,
    hideErrors: true
  })
  attach()
}

// A tiny localhost console so the operator can drive the bot without in-game chat.
function controlServer () {
  const port = parseInt(process.env.MC_CONTROL_PORT, 10) || 25599
  net.createServer(sock => {
    sock.on('data', d => {
      for (const line of d.toString().split('\n')) {
        if (!line.trim()) continue
        if (!bot) { sock.write('bot not connected\n'); continue }
        dispatch(line, cfg.owner || 'console', text => {
          sock.write(text + '\n')
          bot.chat(text)
        })
      }
    })
    sock.on('error', () => {})
  }).listen(port, '127.0.0.1', () => log(`control console on 127.0.0.1:${port}`))
}

async function main () {
  if (!cfg.direct) {
    try {
      via = await viaproxy.start(cfg, log)
    } catch (e) {
      log('ViaProxy failed:', e.message)
      process.exit(1)
    }
  }
  controlServer()
  connectBot()
}

const shutdown = () => {
  stopping = true
  try { bot?.quit() } catch {}
  try { via?.kill() } catch {}
  setTimeout(() => process.exit(0), 500)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
