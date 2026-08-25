'use strict'
// Natural-language understanding.
//
// Works with whichever provider you have. Set one key and it is picked up:
//   GROQ_API_KEY        Groq        free, no card
//   OPENROUTER_API_KEY  OpenRouter  free models, no card
//   GEMINI_API_KEY      Gemini      free tier
//   ANTHROPIC_API_KEY   Claude      paid
//   OPENAI_API_KEY      ChatGPT     paid
//   XAI_API_KEY         Grok        paid (sign-up credits)
// Or run a model on this PC with no key at all: MC_AI_PROVIDER=ollama
// With none of them the bot still runs, but only answers exact commands.

const builder = require('./builder')

// Everything except Anthropic speaks the OpenAI protocol, so one client library
// covers them all - only the base URL and the default model differ.
const PROVIDERS = {
  anthropic: {
    env: ['ANTHROPIC_API_KEY'], model: 'claude-opus-5', free: false, label: 'Claude'
  },
  groq: {
    env: ['GROQ_API_KEY'], base: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile', free: true, label: 'Groq'
  },
  openrouter: {
    env: ['OPENROUTER_API_KEY'], base: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free', free: true, label: 'OpenRouter'
  },
  gemini: {
    env: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    base: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.0-flash', free: true, label: 'Gemini'
  },
  xai: {
    env: ['XAI_API_KEY', 'GROK_API_KEY'], base: 'https://api.x.ai/v1',
    model: 'grok-3-mini', free: false, label: 'Grok'
  },
  openai: {
    env: ['OPENAI_API_KEY'], model: 'gpt-4o-mini', free: false, label: 'ChatGPT'
  },
  // Runs on this PC. No key, no account, no limits - needs ollama installed.
  ollama: {
    env: [], base: process.env.OLLAMA_URL || 'http://127.0.0.1:11434/v1',
    model: 'llama3.2', free: true, local: true, label: 'Ollama (on this PC)'
  }
}

const ORDER = ['anthropic', 'groq', 'openrouter', 'gemini', 'xai', 'openai']

const keyFor = name => {
  for (const e of PROVIDERS[name].env) if (process.env[e]) return process.env[e]
  return null
}

function detect () {
  const forced = (process.env.MC_AI_PROVIDER || '').toLowerCase()
  if (forced && PROVIDERS[forced]) return forced
  for (const name of ORDER) if (keyFor(name)) return name
  return null
}

const modelFor = name => process.env.MC_AI_MODEL || PROVIDERS[name].model

let cached = null
function getClient () {
  if (cached) return cached
  const name = detect()
  if (!name) return null
  try {
    if (name === 'anthropic') {
      const Anthropic = require('@anthropic-ai/sdk')
      cached = { provider: name, client: new Anthropic() }
    } else {
      const OpenAI = require('openai')
      cached = {
        provider: name,
        client: new OpenAI({ apiKey: keyFor(name) || 'local', baseURL: PROVIDERS[name].base })
      }
    }
  } catch { return null }
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

/** Smaller models fence their JSON or pad it with a sentence; dig it out anyway. */
function coerce (raw) {
  if (!raw) return null
  let text = String(raw).trim()
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) text = fenced[1].trim()
  const brace = text.indexOf('{')
  if (brace > 0) text = text.slice(brace)
  const close = text.lastIndexOf('}')
  if (close > 0) text = text.slice(0, close + 1)
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
  const model = modelFor(provider)
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
    const req = {
      model,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        ...history.slice(-6),
        { role: 'user', content: turn }
      ]
    }
    // Local models are often served without JSON mode; the parser copes either way.
    if (!PROVIDERS[provider].local) req.response_format = { type: 'json_object' }
    const res = await client.chat.completions.create(req)
    raw = res.choices?.[0]?.message?.content
  }

  const plan = coerce(raw)
  if (!plan) return { error: 'unparsed' }

  history.push({ role: 'user', content: turn })
  history.push({ role: 'assistant', content: JSON.stringify(plan) })
  while (history.length > 12) history.shift()
  return plan
}

/** Turn a provider's error into something a player can act on. */
function explain (err) {
  const status = err && err.status
  const msg = String((err && err.message) || err)
  const provider = detect()
  if (/ECONNREFUSED|fetch failed/i.test(msg) && PROVIDERS[provider || '']?.local) {
    return 'ollama is not running on this PC - start it and try again'
  }
  if (status === 401 || status === 403) return 'my API key was rejected - check it in run-bot.bat'
  if (status === 429 && /credit|quota|billing|insufficient/i.test(msg)) {
    return provider === 'openai'
      ? 'no credits on the OpenAI account - add some, or use a free provider instead'
      : 'that account is out of credit - try a free provider instead'
  }
  if (status === 429) return 'hitting the rate limit - give it a few seconds'
  if (status === 404 && /model/i.test(msg)) return 'that model is not on this account - set MC_AI_MODEL to one that is'
  if (status >= 500) return 'the AI service is having trouble - try again shortly'
  return msg.slice(0, 70)
}

const enabled = () => Boolean(getClient())
const providerName = () => {
  const g = getClient()
  return g ? `${PROVIDERS[g.provider].label} (${modelFor(g.provider)})` : 'none'
}

module.exports = { think, enabled, providerName, detect, explain, PROVIDERS }
