'use strict'
// Manages the local ViaProxy hop.
//
// mineflayer's protocol support stops at 1.21.11, but modern servers run 26.x.
// ViaProxy sits in the middle: the bot connects to it in 1.21.11 and it speaks the
// server's real version outbound. It also takes an HTTP proxy for that outbound leg,
// which is how we get past a firewall that blocks raw TCP.

const { spawn, execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const JAR_URL = v => `https://github.com/ViaVersion/ViaProxy/releases/download/v${v}/ViaProxy-${v}.jar`

function findJava (explicit) {
  const candidates = []
  if (explicit) candidates.push(explicit)
  if (process.env.JAVA_HOME) candidates.push(path.join(process.env.JAVA_HOME, 'bin', 'java'))
  // Prefer a newer JDK if one was unpacked into /opt.
  try {
    for (const d of fs.readdirSync('/opt').sort().reverse()) {
      if (/^jdk-\d/.test(d)) candidates.push(path.join('/opt', d, 'bin', 'java'))
    }
  } catch {}
  candidates.push('java')

  for (const c of candidates) {
    try {
      const out = execFileSync(c, ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] , encoding: 'utf8'}) +
                  ''
      return c
    } catch (e) {
      // execFileSync throws unless the binary exists; -version writes to stderr, so a
      // zero exit with empty stdout is still a success.
      if (e.status === 0) return c
    }
  }
  return null
}

function javaOk (bin) {
  try {
    execFileSync(bin, ['-version'], { stdio: 'ignore' })
    return true
  } catch { return false }
}

function ensureJar (jarPath, version, log) {
  if (fs.existsSync(jarPath) && fs.statSync(jarPath).size > 1e7) return
  fs.mkdirSync(path.dirname(jarPath), { recursive: true })
  log(`downloading ViaProxy ${version} (~47MB, one time)...`)
  // curl honours the proxy env vars; node's https module would not.
  execFileSync('curl', ['-sSL', '--max-time', '600', '-o', jarPath, JAR_URL(version)], { stdio: 'inherit' })
  if (!fs.existsSync(jarPath) || fs.statSync(jarPath).size < 1e7) {
    throw new Error('ViaProxy download failed or was truncated')
  }
  log('ViaProxy downloaded.')
}

/**
 * Boots ViaProxy and resolves once it is listening. Returns the child process.
 */
function start (cfg, log) {
  return new Promise((resolve, reject) => {
    let java = findJava(cfg.javaBin)
    if (!java || !javaOk(java)) return reject(new Error('no usable java found (ViaProxy needs Java 17+); set JAVA_BIN'))

    ensureJar(cfg.viaproxyJar, cfg.viaproxyVersion, log)

    const args = [
      '-jar', cfg.viaproxyJar, 'cli',
      '--bind-address', `127.0.0.1:${cfg.localPort}`,
      '--target-address', `${cfg.host}:${cfg.port}`,
      '--target-version', cfg.serverVersion,
      '--auth-method', cfg.auth === 'microsoft' ? 'ACCOUNT' : 'NONE',
      '--proxy-online-mode', 'false'
    ]
    if (cfg.backendProxyUrl) args.push('--backend-proxy-url', cfg.backendProxyUrl)

    log(`starting ViaProxy: 127.0.0.1:${cfg.localPort} -> ${cfg.host}:${cfg.port} (${cfg.serverVersion})`)
    const child = spawn(java, args, { cwd: path.dirname(cfg.viaproxyJar), stdio: ['ignore', 'pipe', 'pipe'] })

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill()
      reject(new Error('ViaProxy did not start within 120s'))
    }, 120000)

    const onLine = buf => {
      const text = buf.toString().replace(/\x1b\[[0-9;]*m/g, '')
      if (process.env.MC_DEBUG) process.stdout.write(text)
      if (!settled && /Binding proxy server/.test(text)) {
        settled = true
        clearTimeout(timer)
        log('ViaProxy is listening.')
        resolve(child)
      }
      const bad = text.match(/Highest supported version[^\n]*/)
      if (bad && process.env.MC_DEBUG) log(bad[0].trim())
    }
    child.stdout.on('data', onLine)
    child.stderr.on('data', onLine)
    child.on('exit', code => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(new Error(`ViaProxy exited early (code ${code})`))
      }
    })
  })
}

module.exports = { start, findJava }
