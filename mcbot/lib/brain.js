'use strict'
// Natural-language understanding.
//
// Works with whichever API key you have. Set exactly one of:
//   ANTHROPIC_API_KEY   - Claude
//   OPENAI_API_KEY      - ChatGPT
//   GEMINI_API_KEY      - Google Gemini
// With none of them the bot still runs, but only answers exact commands.

const builder = require('./builder')

// Gemini exposes an OpenAI-shaped endpoint, so one client library covers both.
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai/'

function detect () {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) return 'gemini'
  return null
}

const DEFAULT_MODEL = {
  anthropic: 'claude-opus-5',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash'
}

let cached = null
function getClient () {
  if (cached) return cached
  const provider = detect()
  if (!provider) return null
  try {
    if (provider === 'anthropic') {
      const Anthropic = require('@anthropic-ai/sdk')
      cached = { provider, client: new Anthropic() }
    } else {
      const OpenAI = require('openai')
      cached = {
        provider,
        client: new OpenAI(provider === 'gemini'
          ? { apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, baseURL: GEMINI_BASE }
          : { apiKey: process.env.OPENAI_API_KEY })
      }
    }
  } catch (e) { return null }
  return cached
}

const commandReference = commands =>
  Object.entries(commands).map(([name, c]) => `${name} - ${c.desc}`).join('\n')

/** What the bot can see right now, so answers are about this world, not a generic one. */
function worldContext (bot, swarm, self) {
  const p = bot.entity.position
  const under = bot.blockAt(p.offset(0, -1, 0))
  const players = Object.keys(bot.players).filter(n => n !== bot.username)
  const mobs = Object.values(bot.entities)
    .filter(e => e !== bot.entity && e.type === 'mob' && e.position.distanceTo(p) < 24)
    .map(e => e.name)
  const inv = bot.inventory.items().map(i => `${i.name} x${i.count}`)
  return [
    `You are "${self.name}".`,
    swarm.members.length > 1 ? `Crew here: ${swarm.names().join(', ')}.` : 'You are the only one here.',
    `Position ${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)} in ${under ? bot.registry.biomes[under.biome.id]?.name : 'unknown'}.`,
    `Game mode ${bot.game.gameMode}. Health ${bot.health.toFixed(0)}/20, food ${bot.food}/20.`,
    `It is ${bot.time.timeOfDay < 12000 ? 'daytime' : 'night'}.`,
    `Players nearby: ${players.length ? players.join(', ') : 'none'}.`,
    `Mobs within 24 blocks: ${mobs.length ? [...new Set(mobs)].slice(0, 8).join(', ') : 'none'}.`,
    `Carrying: ${inv.length ? inv.slice(0, 12).join(', ') : 'nothing'}.`
  ].join('\n')
}

function systemPrompt (commands, bot, swarm, self) {
  return `You control a bot inside a Minecraft world. A player is talking to you in chat.

Work out what they want, then answer with a short line to say and the commands to
carry it out.

These are the only commands that exist. Anything else will fail:

${commandReference(commands)}

"build" accepts: ${builder.blueprints.join(', ')}
Sizes are numbers, e.g. "build house 9 9", "build tower 15", "build pyramid 11".

A command may be addressed to one bot or to everyone by putting a name first:
"${self.name} come", "all build tower 8". Without a name it runs on you.
Use "spawn <n>" for more bots and "dismiss all" to send them away.

Rules:
- Only use commands from the list. Never invent one.
- If they ask for something impossible here, say so plainly rather than pretending.
- If they are only chatting, reply and give no commands.
- Keep what you say under about 20 words - it goes into Minecraft chat.
- Split bigger requests into several commands.

Right now:
${worldContext(bot, swarm, self)}

Reply with JSON only, in exactly this shape:
{"say": "<short line>", "commands": ["<command>", ...]}`
}

function coerce (raw) {
  if (!raw) return null
  let text = String(raw).trim()
  // Models sometimes wrap JSON in a code fence.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) text = fenced[1].trim()
  const brace = text.indexOf('{')
  if (brace > 0) text = text.slice(brace)
  try {
    const o = JSON.parse(text)
    return {
      say: typeof o.say === 'string' ? o.say : '',
      commands: Array.isArray(o.commands) ? o.commands.filter(c => typeof c === 'string') : []
    }
  } catch { return null }
}

/**
 * Turn a player's sentence into a plan.
 * Returns { say, commands } or { error } when no provider is configured.
 */
async function think ({ message, sender, bot, swarm, self, commands, history }) {
  const got = getClient()
  if (!got) return { error: 'no-provider' }
  const { provider, client } = got
  const model = process.env.MC_AI_MODEL || DEFAULT_MODEL[provider]
  const system = systemPrompt(commands, bot, swarm, self)
  const turn = `${sender} says: ${message}`

  let raw
  if (provider === 'anthropic') {
    const res = await client.messages.create({
      model,
      max_tokens: 2000,
      system,
      // Turning a sentence into a couple of commands is simple work; low effort
      // keeps the reply quick enough to feel like talking to someone in game.
      output_config: { effort: process.env.MC_AI_EFFORT || 'low' },
      messages: [...history.slice(-6), { role: 'user', content: turn }]
    })
    raw = res.content.filter(b => b.type === 'text').map(b => b.text).join('')
  } else {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        ...history.slice(-6),
        { role: 'user', content: turn }
      ]
    })
    raw = res.choices?.[0]?.message?.content
  }

  const plan = coerce(raw)
  if (!plan) return { error: 'unparsed' }

  history.push({ role: 'user', content: turn })
  history.push({ role: 'assistant', content: JSON.stringify(plan) })
  while (history.length > 12) history.shift()
  return plan
}

const enabled = () => Boolean(getClient())
const providerName = () => {
  const g = getClient()
  return g ? `${g.provider} (${process.env.MC_AI_MODEL || DEFAULT_MODEL[g.provider]})` : 'none'
}

module.exports = { think, enabled, providerName, detect }
