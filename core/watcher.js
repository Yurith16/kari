import fs   from 'fs'
import path from 'path'
import { logger }      from '../utils/helpers.js'
import { loadPlugins } from './plugins.js'

// ─── Recarga de settings ──────────────────────────────────────────────────────

async function reloadSettings(file) {
  try {
    const url = `file://${path.resolve(file)}?t=${Date.now()}`
    const mod = await import(url)
    const data = mod.default

    if (file.includes('bot.js'))      { Object.assign(global.bot,      data); logger.info('Watcher', 'settings/bot.js recargado') }
    if (file.includes('features.js')) { Object.assign(global.features,  data); logger.info('Watcher', 'settings/features.js recargado') }
    if (file.includes('messages.js')) { Object.assign(global.messages,  data); logger.info('Watcher', 'settings/messages.js recargado') }
  } catch (err) {
    logger.error('Watcher', `No se pudo recargar ${file} — ${err.message}`)
  }
}

// ─── Watcher principal ────────────────────────────────────────────────────────

export function startWatcher() {
  const settingsDir = path.resolve('settings')
  const pluginsDir  = path.resolve('plugins')

  // Vigila settings/
  if (fs.existsSync(settingsDir)) {
    fs.watch(settingsDir, async (_, file) => {
      if (!file?.endsWith('.js')) return
      const full = path.join('settings', file)
      // Pequeño debounce — evita doble disparo del fs.watch
      clearTimeout(reloadSettings._timer)
      reloadSettings._timer = setTimeout(() => reloadSettings(full), 150)
    })
    logger.info('Watcher', 'Vigilando settings/')
  }

  // Vigila plugins/ — loadPlugins ya hace el hot-reload interno
  if (fs.existsSync(pluginsDir)) {
    fs.watch(pluginsDir, { recursive: true }, async (_, file) => {
      if (!file?.endsWith('.js')) return
      clearTimeout(loadPlugins._timer)
      loadPlugins._timer = setTimeout(async () => {
        await loadPlugins()
        logger.info('Watcher', `plugins/ recargado`)
      }, 150)
    })
    logger.info('Watcher', 'Vigilando plugins/')
  }
}