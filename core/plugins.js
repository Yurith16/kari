import fs   from 'fs'
import path from 'path'
import { logger } from '../utils/helpers.js'

// ─── Registro central de comandos ────────────────────────────────────────────

export const commands = new Map()

// ─── Scanner recursivo ────────────────────────────────────────────────────────

async function scan(dir, hot = false) {
  if (!fs.existsSync(dir)) return
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, file.name)
    if (file.isDirectory()) { await scan(full, hot); continue }
    if (!file.name.endsWith('.js')) continue
    try {
      const url = hot ? `file://${full}?t=${Date.now()}` : `file://${full}`
      const mod = await import(url)
      const cmd = mod.default
      if (!cmd?.command) continue
      const names = Array.isArray(cmd.command) ? cmd.command : [cmd.command]
      names.forEach(n => commands.set(n, cmd))
    } catch (err) {
      logger.error('Plugin', `${file.name} — ${err.message}`)
    }
  }
}

// ─── Carga inicial ────────────────────────────────────────────────────────────

export async function loadPlugins() {
  commands.clear()
  await scan(path.resolve('plugins'))
  logger.info('Plugins', `${commands.size} comandos cargados`)
}

// ─── Hot-reload en desarrollo ─────────────────────────────────────────────────

export function watchPlugins() {
  const dir = path.resolve('plugins')
  if (!fs.existsSync(dir)) return
  fs.watch(dir, { recursive: true }, async (_, file) => {
    if (file?.endsWith('.js')) {
      await scan(dir, true)
      logger.info('Plugins', `Hot-reload — ${commands.size} comandos`)
    }
  })
}