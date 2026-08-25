'use strict'
// Runs a crew of bots against one server through a single ViaProxy.
// Every bot is an independent mineflayer client; only the leader listens to chat,
// and it routes each order to whichever crew members it is addressed to.

const mineflayer = require('mineflayer')
const { pathfinder, Movements } = require('mineflayer-pathfinder')
const { plugin: collectBlock } = require('mineflayer-collectblock')
const { plugin: pvp } = require('mineflayer-pvp')
const toolPlugin = require('mineflayer-tool').plugin

class Swarm {
  constructor (cfg, log) {
    this.cfg = cfg
    this.log = log
    this.members = []       // [{ name, bot, state }]
    this.stopping = false
    this.onChat = null      // set by index.js
  }

  names () { return this.members.map(m => m.name) }
  leader () { return this.members[0] || null }
  find (name) {
    const n = String(name).toLowerCase()
    return this.members.find(m => m.name.toLowerCase() === n) || null
  }

  /** Spawn one bot and resolve once it is in the world. */
  add (name) {
    return new Promise((resolve, reject) => {
      if (this.find(name)) return reject(new Error(`${name} is already here`))
      if (this.members.length >= this.cfg.maxBots) {
        return reject(new Error(`that is the limit (${this.cfg.maxBots}) - dismiss one first`))
      }

      const target = this.cfg.direct
        ? { host: this.cfg.host, port: this.cfg.port, version: this.cfg.serverVersion }
        : { host: '127.0.0.1', port: this.cfg.localPort, version: this.cfg.botVersion }

      const bot = mineflayer.createBot({
        ...target,
        username: name,
        auth: this.cfg.direct && this.cfg.auth === 'microsoft' ? 'microsoft' : 'offline',
        checkTimeoutInterval: 60000,
        hideErrors: true
      })

      bot.loadPlugin(pathfinder)
      bot.loadPlugin(collectBlock)
      bot.loadPlugin(pvp)
      bot.loadPlugin(toolPlugin)

      const member = { name, bot, state: { following: null, guarding: false, building: false } }

      let settled = false
      const fail = e => {
        if (settled) return
        settled = true
        try { bot.quit() } catch {}
        reject(e instanceof Error ? e : new Error(String(e)))
      }

      bot.once('spawn', () => {
        if (settled) return
        settled = true
        const moves = new Movements(bot)
        moves.allowSprinting = true
        moves.canDig = true
        // Don't let one bot tear down another's scaffolding.
        moves.allow1by1towers = false
        bot.pathfinder.setMovements(moves)

        this.members.push(member)
        this.attach(member)
        this.log(`${name} joined (${this.members.length} in the crew)`)
        resolve(member)
      })

      bot.on('error', err => fail(err))
      bot.on('kicked', reason => fail(new Error(String(reason).slice(0, 120))))
      setTimeout(() => fail(new Error('timed out joining')), 45000)
    })
  }

  attach (member) {
    const { bot, name, state } = member

    // Only the leader takes orders from chat; it dispatches to everyone.
    if (this.members[0] === member) {
      bot.on('chat', (username, message) => {
        if (this.names().some(n => n.toLowerCase() === username.toLowerCase())) return
        if (this.onChat) this.onChat(username, message)
      })
    }

    let tick = 0
    bot.on('physicsTick', () => {
      if (++tick % 10) return
      if (state.following) {
        const e = bot.players[state.following]?.entity
        if (e) {
          const { goals } = require('mineflayer-pathfinder')
          bot.pathfinder.setGoal(new goals.GoalFollow(e, state.followRange || 2), true)
        }
      }
      if (state.guarding && !bot.pvp.target) {
        const hostile = bot.nearestEntity(e =>
          e !== bot.entity && (e.kind === 'Hostile mobs' || e.type === 'hostile') &&
          e.position.distanceTo(bot.entity.position) < 16)
        if (hostile) bot.pvp.attack(hostile)
      }
    })

    bot.on('death', () => this.log(`${name} died`))
    bot.on('end', reason => {
      const i = this.members.indexOf(member)
      if (i >= 0) this.members.splice(i, 1)
      this.log(`${name} left (${reason})`)
      // The leader is our ears - bring it back if the crew is meant to be alive.
      if (!this.stopping && member.wasLeader !== false && this.members.length === 0) {
        setTimeout(() => this.add(name).catch(e => this.log('rejoin failed: ' + e.message)), 5000)
      }
    })
  }

  remove (name) {
    const m = this.find(name)
    if (!m) return false
    const i = this.members.indexOf(m)
    if (i >= 0) this.members.splice(i, 1)
    m.wasLeader = false
    try { m.bot.quit() } catch {}
    return true
  }

  quitAll () {
    this.stopping = true
    for (const m of this.members) { try { m.bot.quit() } catch {} }
    this.members = []
  }

  /** Next free name in the Claude, Claude2, Claude3 ... sequence. */
  nextName () {
    const base = this.cfg.username
    if (!this.find(base)) return base
    for (let i = 2; i < 100; i++) if (!this.find(base + i)) return base + i
    return base + Date.now() % 1000
  }
}

module.exports = { Swarm }
