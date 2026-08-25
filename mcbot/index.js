'use strict'
const net = require('net')

const cfg = require('./config')
const viaproxy = require('./lib/viaproxy')
const { Swarm } = require('./lib/swarm')
const { commands } = require('./lib/commands')

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a)

// Words that address the whole crew rather than one bot.
const ALL_WORDS = ['all', 'everyone', 'claudes', 'team', 'both']
// Commands about the crew itself - run once, on the leader.
const SWARM_ONLY = new Set(['spawn', 'dismiss', 'crew'])

const swarm = new Swarm(cfg, log)
let via = null

function run (member, name, args, sender, announce) {
  const cmd = commands[name]
  if (!cmd) return announce(`I don't know "${name}" - try help`)
  const reply = text => {
    const line = announce === null ? text : text
    try { member.bot.chat(swarm.members.length > 1 ? `[${member.name}] ${line}` : line) } catch {}
  }
  Promise.resolve()
    .then(() => cmd.run({
      bot: member.bot, state: member.state, args, sender, reply,
      swarm, self: member, cfg
    }))
    .catch(e => reply('error: ' + String(e.message).slice(0, 70)))
}

/** Work out who a message is for, then hand it to them. */
function dispatch (message, sender) {
  const parts = String(message).trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) {
    // "claude" on its own - treat as help.
    if (parts.length === 1 && swarm.find(parts[0])) parts.push('help')
    else return
  }
  const head = parts[0].toLowerCase()

  let targets
  if (ALL_WORDS.includes(head)) targets = swarm.members.slice()
  else {
    const m = swarm.find(head)
    if (m) targets = [m]
  }
  if (!targets || !targets.length) return

  const name = parts[1].toLowerCase()
  const args = parts.slice(2)

  if (SWARM_ONLY.has(name)) {
    const leader = swarm.leader()
    if (leader) run(leader, name, args, sender)
    return
  }
  for (const t of targets) run(t, name, args, sender)
}

swarm.onChat = (username, message) => {
  const first = String(message).trim().split(/\s+/)[0]?.toLowerCase()
  if (!first) return
  if (!ALL_WORDS.includes(first) && !swarm.find(first)) return
  log(`<${username}> ${message}`)
  dispatch(message, username)
}

// Local console: same syntax, so "claude2 come" works from a terminal too.
function controlServer () {
  const port = parseInt(process.env.MC_CONTROL_PORT, 10) || 25599
  net.createServer(sock => {
    sock.on('data', d => {
      for (const line of d.toString().split('\n')) {
        const t = line.trim()
        if (!t) continue
        if (!swarm.members.length) { sock.write('no bots connected\n'); continue }
        const first = t.split(/\s+/)[0].toLowerCase()
        // Let the console omit the name: bare commands go to the leader.
        const full = (ALL_WORDS.includes(first) || swarm.find(first)) ? t : `${swarm.leader().name} ${t}`
        sock.write('> ' + full + '\n')
        dispatch(full, cfg.owner || 'console')
      }
    })
    sock.on('error', () => {})
  }).listen(port, '127.0.0.1', () => log(`control console on 127.0.0.1:${port}`))
}

async function main () {
  if (!cfg.direct) {
    try { via = await viaproxy.start(cfg, log) } catch (e) {
      log('ViaProxy failed:', e.message)
      process.exit(1)
    }
  }
  controlServer()

  try {
    const leader = await swarm.add(cfg.username)
    const p = leader.bot.entity.position
    log(`ready at ${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)} (${leader.bot.game.gameMode})`)
    leader.bot.chat(`ready - say "${cfg.prefix} help", or "${cfg.prefix} spawn 3" for company`)
  } catch (e) {
    log('could not join:', e.message)
    process.exit(1)
  }
}

const shutdown = () => {
  swarm.quitAll()
  try { via?.kill() } catch {}
  setTimeout(() => process.exit(0), 600)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
