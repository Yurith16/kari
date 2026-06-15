import { toBold }    from '../utils/helpers.js'
import { cleanNumber } from '../utils/jid.js'
import db            from '../core/sqlite.js'

const _getActivity = db.prepare(`
  SELECT user, msgs FROM activity
  WHERE group_id = ? AND msgs > 0
  ORDER BY msgs DESC
`)

export default {
  command:   ['contador', 'cont'],
  tag:       'contador',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra los miembros más activos del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '🪷', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const lista = _getActivity.all(from)

      if (!lista.length) {
        await sock.sendMessage(from, {
          text: '_Aún no hay actividad registrada._'
        }, { quoted: msg })
        return
      }

      const meta    = await sock.groupMetadata(from)
      const members = meta.participants
      const total   = members.length

      const numToJid = {}
      members.forEach(m => {
        const num = cleanNumber(m.id)
        numToJid[num] = m.id
      })

      const mentions = []
      let txt = `𝚁𝙰𝙽𝙺𝙸𝙽𝙶 𝙳𝙴 𝙰𝙲𝚃𝙸𝚅𝙸𝙳𝙰𝙳\n`
      txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`

      lista.forEach((r) => {
        const jid = numToJid[r.user] || `${r.user}@s.whatsapp.net`
        mentions.push(jid)
        txt += `> ✦ *Usuario* @${r.user}\n`
        txt += `> ✦ *Total Msg:* *${r.msgs}*\n\n`
      })

      txt += `> ✦ *Total:* ${lista.length} de ${total} miembros`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}