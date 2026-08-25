'use strict'
// Natural-language understanding.
//
// Without an API key the bot only answers exact commands ("claude build house 9").
// With one, anything it does not recognise is handed to Claude along with what the
// bot can currently see, and comes back as something to say plus commands to run.

const { z } = require('zod')
const builder = require('./builder')

let client = null
let sdkError = null
function getClient () {
  if (client || sdkError) return client
  try {
    const Anthropic = require('@anthropic-ai/sdk')
    client = new Anthropic()          // reads ANTHROPIC_API_KEY from the environment
  } catch (e) { sdkError = e }
  return client
}

const Plan = z.object({
  say: z.string().describe('What to say in chat. One short sentence, plain and friendly.'),
  commands: z.array(z.string()).describe(
    'Commands to run, in order. Empty if the player only wants conversation.')
})

/** A compact description of everything the bot can do, built from the real command table. */
function commandReference (commands) {
  const lines = Object.entries(commands).map(([name, c]) => `${name} - ${c.desc}`)
  return lines.join('\n')
}

/** What the bot can see right now, so answers are about this world and not a generic one. */
function worldContext (bot, swarm, self) {
  const p = bot.entity.position
  const under = bot.blockAt(p.offset(0, -1, 0))
  const players = Object.keys(bot.players).filter(n => n !== bot.username)
  const mobs = Object.values(bot.entities)
    .filter(e => e !== bot.entity && e.type === 'mob' && e.position.distanceTo(p) < 24)
    .map(e => e.name)
  const inv = bot.inventory.items().map(i => `${i.name} x${i.count}`)
  const t = bot.time.timeOfDay
  return [
    `You are "${self.name}".`,
    swarm.members.length > 1 ? `Crew here: ${swarm.names().join(', ')}.` : 'You are the only one here.',
    `Position ${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)} in ${under ? bot.registry.biomes[under.biome.id]?.name : 'unknown'}.`,
    `Game mode ${bot.game.gameMode}. Health ${bot.health.toFixed(0)}/20, food ${bot.food}/20.`,
    `It is ${t < 12000 ? 'daytime' : 'night'}.`,
    `Players nearby: ${players.length ? players.join(', ') : 'none'}.`,
    `Mobs within 24 blocks: ${mobs.length ? [...new Set(mobs)].slice(0, 8).join(', ') : 'none'}.`,
    `Carrying: ${inv.length ? inv.slice(0, 12).join(', ') : 'nothing'}.`
  ].join('\n')
}

function systemPrompt (commands, bot, swarm, self) {
  return `You control a bot inside a Minecraft world. A player is talking to you in chat.

Work out what they want and answer with two things: a short line to say, and the
commands to carry it out.

These are the only commands that exist. Anything else will fail:

${commandReference(commands)}

"build" accepts: ${builder.blueprints.join(', ')}
Sizes are numbers, e.g. "build house 9 9", "build tower 15", "build pyramid 11".

A command may be addressed to one bot or to everyone by putting a name first:
"${self.name} come", "all build tower 8". Without a name it runs on you.
To bring more bots use "spawn <n>"; to send them away, "dismiss all".

Rules:
- Only use commands from the list. Never invent one.
- If they ask for something impossible here, say so plainly instead of pretending.
- If they are just chatting, reply and return no commands.
- Keep what you say under about 20 words - it goes into Minecraft chat.
- Break bigger requests into several commands. For "build me a village" that might
  be several build commands with the crew split across them.

Right now:
${worldContext(bot, swarm, self)}`
}

/**
 * Turn a player's sentence into a plan.
 * Returns { say, commands } or { error } when the API is unavailable.
 */
async function think ({ message, sender, bot, swarm, self, commands, history }) {
  const c = getClient()
  if (!c) return { error: 'no-sdk' }

  const messages = [
    ...history.slice(-6),
    { role: 'user', content: `${sender} says: ${message}` }
  ]

  const res = await c.messages.parse({
    model: process.env.MC_AI_MODEL || 'claude-opus-5',
    max_tokens: 2000,
    system: systemPrompt(commands, bot, swarm, self),
    messages,
    // Turning a sentence into a couple of commands is simple work; low effort
    // keeps the reply quick enough to feel like talking to someone in game.
    output_config: {
      effort: process.env.MC_AI_EFFORT || 'low',
      format: require('@anthropic-ai/sdk/helpers/zod').zodOutputFormat(Plan)
    }
  })

  const plan = res.parsed_output
  if (!plan) return { error: 'unparsed' }

  history.push({ role: 'user', content: `${sender} says: ${message}` })
  history.push({ role: 'assistant', content: JSON.stringify(plan) })
  while (history.length > 12) history.shift()

  return plan
}

const enabled = () => Boolean(process.env.ANTHROPIC_API_KEY) && Boolean(getClient())

module.exports = { think, enabled }
