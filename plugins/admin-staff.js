import { toBold }       from '../utils/helpers.js'
import { cleanNumber }  from '../utils/jid.js'

export default {
  command:   'admins',
  tag:       'admins',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra la lista de administradores del grupo',

  async execute(sock, msg, { from }) {
    try {
      const meta     = await sock.groupMetadata(from)
      const admins   = meta.participants.filter(p => p.admin)
      const mentions = admins.map(a => a.id)
      const div      = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

      let txt = `╭─〔 ${toBold('👮 STAFF DEL GRUPO')} 〕\n│\n`
      txt += `│ ${div}\n`
      admins.forEach(a => {
        const num = cleanNumber(a.id)
        const rol = a.admin === 'superadmin' ? '⭐ Creador' : '👮 Admin'
        txt += `│ ${rol} @${num}\n`
      })
      txt += `│\n`
      txt += `│ 🌿 ${admins.length} personitas al mando\n`
      txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}