'use strict'
const net = require('net')

const cfg = require('./config')
const viaproxy = require('./lib/viaproxy')
const { Swarm } = require('./lib/swarm')
const { commands } = require('./lib/commands')
const brain = require('./lib/brain')

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a)

// Words that address the whole crew rather than one bot.
const ALL_WORDS = ['all', 'everyone', 'claudes', 'team', 'both']
// Commands about the crew itself - run once, on the leader.
const SWARM_ONLY = new Set(['spawn', 'dismiss', 'crew'])

const swarm = new Swarm(cfg, log)
let via = null

function run (member, name, args, sender) {
  const reply = text => {
    try { member.bot.chat(swarm.members.length > 1 ? `[${member.name}] ${text}` : text) } catch {}
  }
  const cmd = commands[name]
  if (!cmd) return reply(`I don't know "${name}" - try help`)
  Promise.resolve()
    .then(() => cmd.run({
      bot: member.bot, state: member.state, args, sender, reply,
      swarm, self: member, cfg
    }))
    .catch(e => reply('error: ' + String(e.message).slice(0, 70)))
}

// One running conversation per player, so follow-ups make sense.
const histories = new Map()
const historyFor = who => {
  if (!histories.has(who)) histories.set(who, [])
  return histories.get(who)
}

/** Hand a sentence we did not recognise to Claude, then run whatever it decides. */
async function askBrain (member, text, sender) {
  const reply = t => { try { member.bot.chat(t) } catch {} }
  try {
    const plan = await brain.think({
      message: text, sender, bot: member.bot, swarm, self: member,
      commands, history: historyFor(sender)
    })
    if (plan.error) return reply(`I only know set commands right now - try "${cfg.prefix} help"`)
    if (plan.say) reply(plan.say)
    for (const line of (plan.commands || []).slice(0, 8)) {
      const first = String(line).split(/\s+/)[0].toLowerCase()
      const addressed = ALL_WORDS.includes(first) || swarm.find(first)
      dispatch(addressed ? line : `${member.name} ${line}`, sender, false)
      await new Promise(r => setTimeout(r, 400))
    }
  } catch (e) {
    log('brain error:', e.message)
    reply('my head is not working: ' + String(e.message).slice(0, 50))
  }
}

/** Work out who a message is for, then hand it to them.
 *  `allowBrain` is false for commands the brain itself produced, so it cannot loop. */
function dispatch (message, sender, allowBrain = true) {
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

  // Not a command we know - if there is an API key, let Claude interpret it.
  if (!commands[name] && allowBrain && brain.enabled()) {
    askBrain(targets[0], parts.slice(1).join(' '), sender)
    return
  }

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
    if (brain.enabled()) {
      log('AI chat is on - the bots understand plain English')
      leader.bot.chat(`ready - just talk to me, e.g. "${cfg.prefix} build us a house"`)
    } else {
      leader.bot.chat(`ready - say "${cfg.prefix} help", or "${cfg.prefix} spawn 3" for company`)
    }
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
process.on('uncaughtException', err => log('caught:', err && err.message))
process.on('unhandledRejection', err => log('caught:', (err && err.message) || String(err)))

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
