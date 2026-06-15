import { toBold }       from '../utils/helpers.js'
import { cleanNumber }  from '../utils/jid.js'

export default {
  command:   ['admins', 'administradores', 'staff', 'mods', 'moderadores'],
  tag:       'admins',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra la lista de administradores del grupo',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👥', key: msg.key } })

    try {
      const meta     = await sock.groupMetadata(from)
      const admins   = meta.participants.filter(p => p.admin)
      const mentions = admins.map(a => a.id)

      let txt = `  𝚂𝚃𝙰𝙵𝙵 𝙳𝙴𝙻 𝙶𝚁𝚄𝙿𝙾\n`
      txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`

      admins.forEach(a => {
        const num = cleanNumber(a.id)
        const rol = a.admin === 'superadmin' ? 'Creador' : 'Admin'
        txt += `> ✦ *${rol}* @${num}\n\n`
      })

      txt += `> ✦ *Total:* ${admins.length} administradores`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}