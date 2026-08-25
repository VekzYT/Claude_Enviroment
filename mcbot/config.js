'use strict'
// All settings come from the environment so the same build can point at any server.
const path = require('path')

const int = (v, d) => (v === undefined || v === '' ? d : parseInt(v, 10))

module.exports = {
  // --- the server we are joining (yours) ---
  host: process.env.MC_HOST || '127.0.0.1',
  port: int(process.env.MC_PORT, 25565),
  // The real version your server runs. Mojang dropped the "1." prefix: 1.26.2 is "26.2".
  serverVersion: process.env.MC_VERSION || '26.2',

  // --- who the bot logs in as ---
  username: process.env.MC_USERNAME || 'Claude',
  // 'offline' for online-mode=false servers, 'microsoft' for a real account.
  auth: process.env.MC_AUTH || 'offline',

  // --- the translation hop ---
  // mineflayer cannot speak 26.2, so it talks 1.21.11 to a local ViaProxy which
  // translates up to whatever the server actually runs.
  botVersion: process.env.MC_BOT_VERSION || '1.21.11',
  localPort: int(process.env.MC_LOCAL_PORT, 25568),
  // Raw TCP is firewalled in this container; the agent proxy tunnels it via CONNECT.
  backendProxyUrl: process.env.MC_BACKEND_PROXY ?? process.env.HTTPS_PROXY ?? '',
  viaproxyJar: process.env.VIAPROXY_JAR || path.join(__dirname, 'vendor', 'viaproxy.jar'),
  viaproxyVersion: '3.4.12',
  javaBin: process.env.JAVA_BIN || '',

  // Set MC_DIRECT=1 to skip ViaProxy entirely (server already speaks botVersion,
  // or it runs ViaVersion itself).
  direct: process.env.MC_DIRECT === '1',

  // Chat prefix the bot answers to.
  prefix: (process.env.MC_PREFIX || 'claude').toLowerCase(),
  // How many bots may be in the world at once.
  maxBots: parseInt(process.env.MC_MAX_BOTS || '10', 10),
  owner: process.env.MC_OWNER || ''
}
