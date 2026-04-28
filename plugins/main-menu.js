import { toMono, toBold } from '../utils/helpers.js'
import { commands }       from '../core/plugins.js'

const CATEGORIAS = {
  main:      '🌿 Principales',
  utilidad:  '🔧 Utilidad',
  diversion: '🎮 Diversión',
  admin:     '👑 Administración',
  owner:     '💎 Owner',
  nsfw:      '🔞 NSFW',
  descargas: '📥 Descargas',
  busqueda:  '🔍 Búsqueda',
}

export default {
  command:   ['menu', 'help', 'comandos'],
  tag:       'menu',
  categoria: 'main',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isGroup, groupCfg, prefix }) {
    try {
      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

      const bot      = global.bot || {}
      const imageUrl = bot.defaultImg
      const div      = `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`

      // Filtrar y agrupar por categoría
      const seen  = new Set()
      const mapa  = {}

      for (const p of commands.values()) {
        if (!p.command || !p.categoria)                      continue
        if (p.owner && !isOwner)                             continue
        if (p.group && !isGroup)                             continue
        if (p.nsfw && (!groupCfg?.nsfw || !isGroup))         continue

        const name = Array.isArray(p.command) ? p.command[0] : p.command
        if (seen.has(name)) continue
        seen.add(name)

        const cat = p.categoria || 'main'
        if (!mapa[cat]) mapa[cat] = []
        mapa[cat].push(name)
      }

      // Construir texto
      let txt = `╭─〔 🌸 *${toMono(bot.name?.toUpperCase() || 'BOT')}* 🌸 〕\n`
      txt += `│\n`
      txt += `│ 👩‍💻 ${toBold('Desarrollador')}: ${bot.owner || 'Owner'}\n`
      txt += `│ 📦 ${toBold('Versión')}: ${toMono(bot.version || '1.0.0')}\n`
      txt += `│ 💬 ${toBold('Prefijo')}: ${toMono(prefix)}\n`
      txt += `│ ${div}\n`

      for (const [key, nombre] of Object.entries(CATEGORIAS)) {
        const cmds = mapa[key]
        if (!cmds?.length) continue
        txt += `│ ${toBold(nombre)}\n`
        cmds.forEach(cmd => { txt += `│    🌱 ${toMono(prefix + cmd)}\n` })
        txt += `│\n`
      }

      txt += `╰─── *${toMono(bot.name || 'Bot')} ™* 🌸`

      await sock.sendMessage(from, {
        image:   { url: imageUrl },
        caption: txt
      }, { quoted: msg })

    } catch (err) {
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}