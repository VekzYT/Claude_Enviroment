'use strict'
// Structure building.
//
// Blueprints are pure functions returning a list of {x,y,z,block} offsets from an
// origin. The placement engine sorts them bottom-up so every block has something
// underneath to place against, fetches materials (free in creative) and works
// through the list, moving the bot into reach as it goes.

const { Vec3 } = require('vec3')
const { goals } = require('mineflayer-pathfinder')

const FACES = [[0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]

// ---------------------------------------------------------------- blueprints

const B = {
  platform: (a) => {
    const w = clamp(a[0], 3, 32), l = clamp(a[1] || a[0], 3, 32), m = a.mat || 'oak_planks'
    const out = []
    for (let x = 0; x < w; x++) for (let z = 0; z < l; z++) out.push({ x, y: 0, z, block: m })
    return out
  },

  wall: (a) => {
    const len = clamp(a[0], 2, 48), h = clamp(a[1] || 4, 1, 16), m = a.mat || 'cobblestone'
    const out = []
    for (let x = 0; x < len; x++) for (let y = 0; y < h; y++) out.push({ x, y, z: 0, block: m })
    return out
  },

  box: (a) => {
    const w = clamp(a[0], 3, 24), h = clamp(a[1] || a[0], 3, 24), l = clamp(a[2] || a[0], 3, 24)
    const m = a.mat || 'stone_bricks'
    const out = []
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < l; z++) {
      const edge = x === 0 || x === w - 1 || y === 0 || y === h - 1 || z === 0 || z === l - 1
      if (edge) out.push({ x, y, z, block: m })
    }
    return out
  },

  pyramid: (a) => {
    const n = clamp(a[0] || 9, 3, 24), m = a.mat || 'sandstone'
    const out = []
    for (let y = 0; y < Math.ceil(n / 2); y++) {
      const lo = y, hi = n - 1 - y
      if (hi < lo) break
      for (let x = lo; x <= hi; x++) for (let z = lo; z <= hi; z++) {
        if (x === lo || x === hi || z === lo || z === hi || y === Math.ceil(n / 2) - 1) {
          out.push({ x, y, z, block: m })
        }
      }
    }
    return out
  },

  tower: (a) => {
    const h = clamp(a[0] || 12, 4, 40), r = clamp(a[1] || 3, 2, 8)
    const m = a.mat || 'stone_bricks'
    const out = []
    const d = r * 2 + 1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < d; x++) for (let z = 0; z < d; z++) {
        const dx = x - r, dz = z - r
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > r - 0.5 && dist <= r + 0.5) {
          // Leave window slits every few courses.
          if (y > 1 && y % 4 === 0 && (dx === 0 || dz === 0)) continue
          out.push({ x, y, z, block: m })
        }
      }
    }
    // Battlements on top.
    for (let x = 0; x < d; x++) for (let z = 0; z < d; z++) {
      const dx = x - r, dz = z - r
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > r - 0.5 && dist <= r + 0.5 && (x + z) % 2 === 0) {
        out.push({ x, y: h, z, block: m })
      }
    }
    return out
  },

  house: (a) => {
    const w = clamp(a[0] || 9, 5, 24), l = clamp(a[1] || w, 5, 24)
    const h = clamp(a[2] || 5, 4, 8)
    const wallM = a.mat || 'oak_planks'
    const out = []
    const door = Math.floor(w / 2)

    for (let x = 0; x < w; x++) for (let z = 0; z < l; z++) out.push({ x, y: 0, z, block: 'stone_bricks' })

    for (let y = 1; y < h; y++) {
      for (let x = 0; x < w; x++) for (let z = 0; z < l; z++) {
        if (!(x === 0 || x === w - 1 || z === 0 || z === l - 1)) continue
        if (z === 0 && x === door && y < 3) continue // doorway
        const midHeight = y === 2
        const windowSpot = midHeight && ((x % 3 === 1 && (z === 0 || z === l - 1)) ||
                                         (z % 3 === 1 && (x === 0 || x === w - 1)))
        out.push({ x, y, z, block: windowSpot ? 'glass_pane' : wallM })
      }
    }

    // Pitched roof, stepping inwards each course.
    let step = 0
    for (let y = h; step * 2 < Math.min(w, l); y++, step++) {
      for (let x = step; x < w - step; x++) for (let z = step; z < l - step; z++) {
        const edge = x === step || x === w - step - 1 || z === step || z === l - step - 1
        if (edge) out.push({ x, y, z, block: 'oak_stairs' })
      }
    }
    out.push({ x: door, y: 1, z: 0, block: 'oak_door', optional: true })
    out.push({ x: 1, y: 3, z: 1, block: 'torch', optional: true })
    out.push({ x: w - 2, y: 3, z: l - 2, block: 'torch', optional: true })
    return out
  },

  bridge: (a) => {
    const len = clamp(a[0] || 16, 3, 64), wide = clamp(a[1] || 3, 1, 8)
    const m = a.mat || 'oak_planks'
    const out = []
    for (let z = 0; z < len; z++) {
      for (let x = 0; x < wide; x++) out.push({ x, y: 0, z, block: m })
      out.push({ x: -1, y: 1, z, block: 'oak_fence' })
      out.push({ x: wide, y: 1, z, block: 'oak_fence' })
    }
    return out
  },

  stairs: (a) => {
    const h = clamp(a[0] || 8, 2, 32), wide = clamp(a[1] || 2, 1, 6)
    const m = a.mat || 'stone_bricks'
    const out = []
    for (let i = 0; i < h; i++) for (let x = 0; x < wide; x++) {
      out.push({ x, y: i, z: i, block: m })
      if (i > 0) out.push({ x, y: i - 1, z: i, block: m })
    }
    return out
  },

  road: (a) => {
    const len = clamp(a[0] || 20, 3, 64), wide = clamp(a[1] || 3, 1, 8)
    const out = []
    for (let z = 0; z < len; z++) for (let x = 0; x < wide; x++) {
      out.push({ x, y: 0, z, block: x === 0 || x === wide - 1 ? 'cobblestone' : 'gravel' })
    }
    return out
  },

  pool: (a) => {
    const w = clamp(a[0] || 7, 3, 20), l = clamp(a[1] || w, 3, 20)
    const out = []
    for (let x = 0; x < w; x++) for (let z = 0; z < l; z++) {
      const edge = x === 0 || x === w - 1 || z === 0 || z === l - 1
      out.push({ x, y: 0, z, block: edge ? 'stone_bricks' : 'water' })
      if (edge) out.push({ x, y: 1, z, block: 'stone_bricks' })
    }
    return out
  },

  farm: (a) => {
    const n = clamp(a[0] || 9, 3, 24)
    const out = []
    const mid = Math.floor(n / 2)
    for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) {
      if (x === mid && z === mid) { out.push({ x, y: 0, z, block: 'water' }); continue }
      out.push({ x, y: 0, z, block: 'farmland' })
    }
    for (let x = -1; x <= n; x++) {
      out.push({ x, y: 1, z: -1, block: 'oak_fence' })
      out.push({ x, y: 1, z: n, block: 'oak_fence' })
    }
    for (let z = 0; z < n; z++) {
      out.push({ x: -1, y: 1, z, block: 'oak_fence' })
      out.push({ x: n, y: 1, z, block: 'oak_fence' })
    }
    return out
  }
}

function clamp (v, lo, hi) {
  const n = parseInt(v, 10)
  return Math.max(lo, Math.min(hi, isNaN(n) ? lo : n))
}

// ------------------------------------------------------------- placing blocks

/** Never let one stubborn block stall an entire build. */
function withTimeout (p, ms, label) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout: ' + label)), ms))
  ])
}

function itemFor (bot, name) {
  return bot.registry.itemsByName[name] || bot.registry.itemsByName[name.replace('_pane', '')] || null
}

/** In creative we can conjure materials; in survival we use what we carry. */
async function ensureHolding (bot, name) {
  const held = bot.heldItem
  if (held && held.name === name) return true

  const carried = bot.inventory.items().find(i => i.name === name)
  if (carried) { await bot.equip(carried, 'hand'); return true }

  if (bot.game.gameMode !== 'creative') return false
  const def = itemFor(bot, name)
  if (!def) return false
  const Item = require('prismarine-item')(bot.registry)
  try {
    await withTimeout(bot.creative.setInventorySlot(36, new Item(def.id, 64)), 5000, 'give')
    const now = bot.inventory.slots[36]
    if (!now) return false
    await bot.equip(now, 'hand')
    return true
  } catch { return false }
}

/**
 * Creative flight in short hops.
 *
 * mineflayer's flyTo walks a straight line and gives up (or never resolves) over
 * long distances or through terrain, so we step towards the target a few blocks
 * at a time and bail out if a hop makes no progress.
 */
async function flyHops (bot, dest, maxHops = 20) {
  try { bot.creative.startFlying() } catch { return false }
  for (let i = 0; i < maxHops; i++) {
    const cur = bot.entity.position
    const dist = cur.distanceTo(dest)
    if (dist < 3.5) return true
    const dir = dest.minus(cur)
    const step = cur.plus(dir.scaled(Math.min(6, dist) / dist))
    try { await withTimeout(bot.creative.flyTo(step), 2500, 'hop') } catch {}
    if (bot.entity.position.distanceTo(cur) < 0.4) return false   // wedged
  }
  return bot.entity.position.distanceTo(dest) < 5
}

async function moveWithinReach (bot, pos) {
  if (bot.entity.position.distanceTo(pos) < 4) return true
  if (bot.game.gameMode === 'creative') {
    if (await flyHops(bot, pos.offset(0.5, 2, 0.5))) return true
  }
  try {
    await withTimeout(bot.pathfinder.goto(new goals.GoalNear(pos.x, pos.y, pos.z, 3)), 10000, 'walk')
  } catch {}
  return bot.entity.position.distanceTo(pos) < 5
}

const delay = ms => new Promise(r => setTimeout(r, ms))

/** First air block above the ground at (x,z), searching around startY. */
function groundLevel (bot, x, z, startY) {
  const from = Math.floor(startY) + 3
  for (let y = from; y > from - 24; y--) {
    const b = bot.blockAt(new Vec3(x, y, z))
    if (b && b.boundingBox === 'block' && !b.name.includes('leaves')) return y + 1
  }
  return Math.floor(startY)
}

/**
 * Place one block.
 *
 * mineflayer's placeBlock waits for a blockUpdate packet to confirm the change.
 * Through a version-translating proxy that confirmation often never arrives even
 * though the block really was placed, so waiting on the promise costs seconds per
 * block. We give it a moment, then judge by what the world actually shows.
 *
 * `cache` remembers what we are holding so a run of one material re-equips once.
 */
async function placeOne (bot, pos, blockName, cache = {}) {
  const current = bot.blockAt(pos)
  if (!current) return false
  if (current.name === blockName) return true

  if (!await moveWithinReach(bot, pos)) return false

  if (current.boundingBox === 'block') {
    try { await withTimeout(bot.dig(current), 1500, 'dig') } catch {}
    await delay(80)
    const after = bot.blockAt(pos)
    if (after && after.boundingBox === 'block') return false
  }

  // Nothing to place against means this block is unreachable - do not burn
  // several seconds discovering that one face at a time.
  const supported = FACES.some(f => {
    const r = bot.blockAt(pos.offset(f[0], f[1], f[2]))
    return r && r.boundingBox === 'block'
  })
  if (!supported) return false

  const want = blockName === 'water' ? 'water_bucket' : blockName
  if (cache.held !== want) {
    if (!await ensureHolding(bot, want)) return false
    cache.held = want
  }

  for (const f of FACES) {
    const ref = bot.blockAt(pos.offset(f[0], f[1], f[2]))
    if (!ref || ref.boundingBox !== 'block') continue
    try {
      await withTimeout(bot.placeBlock(ref, new Vec3(-f[0], -f[1], -f[2])), 700, 'place')
    } catch { /* the packet may still have landed - check below */ }
    await delay(100)
    const now = bot.blockAt(pos)
    if (now && now.name === blockName) {
      if (bot.game.gameMode !== 'creative') cache.held = null
      return true
    }
  }
  cache.held = null
  return false
}

/** Serpentine ordering within each layer keeps consecutive blocks adjacent. */
function buildOrder (plan) {
  return plan.slice().sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    if (a.x !== b.x) return a.x - b.x
    return a.x % 2 === 0 ? a.z - b.z : b.z - a.z
  })
}

/**
 * Build a named structure with its near corner at `origin`.
 * `state.building` is checked between blocks so `stop` cancels a job.
 */
async function build (bot, name, args, origin, reply, state) {
  const make = B[name]
  if (!make) return reply(`I do not know how to build "${name}". Try: ${Object.keys(B).join(', ')}`)

  const plan = buildOrder(make(args))
  // Sit the structure on the ground rather than wherever the bot happens to float.
  origin = origin.offset(0, 0, 0)
  origin.y = groundLevel(bot, origin.x, origin.z, origin.y)
  if (bot.game.gameMode === 'creative') { try { bot.creative.startFlying() } catch {} }
  state.building = true
  const started = Date.now()
  reply(`building a ${name} - ${plan.length} blocks`)

  const cache = {}
  let placed = 0, failed = 0, done = 0
  let cell = null
  for (const p of plan) {
    if (!state.building) { reply(`stopped after ${placed} blocks`); return }
    const pos = origin.offset(p.x, p.y, p.z)

    // Move once per 3x3x3 region, not once per block.
    const here = `${p.x >> 2}/${p.y >> 2}/${p.z >> 2}`
    if (here !== cell) {
      cell = here
      await moveWithinReach(bot, pos)
    }

    const ok = await placeOne(bot, pos, p.block, cache)
    if (ok) placed++
    else if (!p.optional) failed++
    if (++done % 30 === 0) reply(`${done}/${plan.length}...`)
  }
  state.building = false
  const secs = Math.round((Date.now() - started) / 1000)
  reply(`${name} done - ${placed} blocks in ${secs}s${failed ? `, ${failed} I could not reach` : ''}`)
}

module.exports = { build, blueprints: Object.keys(B), placeOne, ensureHolding, moveWithinReach }
