import { cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

export default {
  command:   ['tagall', 'mencionartodos', 'llamar', 'invocar', 'everyone'],
  tag:       'tagall',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Etiqueta a todos los miembros del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '📢', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const meta = await sock.groupMetadata(from)
      const participantes = meta.participants

      const admins = participantes.filter(p => p.admin)
      const miembros = participantes.filter(p => !p.admin)

      const mentions = participantes.map(p => p.id)

      const texto = args.join(' ') || '_Han sido invocados._'

      let txt = `𝙸𝙽𝚅𝙾𝙲𝙰𝙲𝙸𝙾𝙽\n`
      txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`
      txt += `${texto}\n\n`

      if (admins.length) {
        txt += `> ✦ *Admins:*\n`
        admins.forEach(a => {
          const num = cleanNumber(a.id)
          txt += `> @${num}\n`
        })
        txt += `\n`
      }

      txt += `> ✦ *Miembros:*\n`
      miembros.forEach(m => {
        const num = cleanNumber(m.id)
        txt += `> @${num}\n`
      })

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}