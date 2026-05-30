// core/plugins.js
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
      // Si es hot, añadimos el query string con la fecha actual para romper la caché de Node.js
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

// ─── Carga e inicialización (Soporta recargas en caliente) ────────────────────
export async function loadPlugins(hot = false) {
  // Limpiamos el mapa global para quitar alias o comandos modificados anteriores
  commands.clear()
  await scan(path.resolve('plugins'), hot)
  if (!hot) {
    logger.info('Plugins', `${commands.size} comandos cargados`)
  }
}

// ─── Hot-reload en desarrollo ─────────────────────────────────────────────────
export function watchPlugins() {
  const dir = path.resolve('plugins')
  if (!fs.existsSync(dir)) return
  fs.watch(dir, { recursive: true }, async (_, file) => {
    if (file?.endsWith('.js')) {
      clearTimeout(watchPlugins._timer)
      watchPlugins._timer = setTimeout(async () => {
        // Ejecutamos loadPlugins pasando true para obligar a usar la nueva estampa de tiempo
        await loadPlugins(true)
        logger.info('Plugins', `Hot-reload — ${commands.size} comandos vigentes`)
      }, 150)
    }
  })
}