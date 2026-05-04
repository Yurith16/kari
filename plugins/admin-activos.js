import { toBold }    from '../utils/helpers.js'
import { cleanNumber } from '../utils/jid.js'
import db            from '../core/sqlite.js'

const _getActivity = db.prepare(`
  SELECT user, msgs FROM activity
  WHERE group_id = ? AND msgs > 0
  ORDER BY msgs DESC
`)

export default {
  command:   'contador',
  tag:       'contador',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra los miembros más activos del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    try {
      const lista = _getActivity.all(from)

      if (!lista.length) {
        await sock.sendMessage(from, {
          text: '✦ Aún no hay actividad registrada en este grupo.'
        }, { quoted: msg })
        return
      }

      const meta     = await sock.groupMetadata(from)
      const members  = meta.participants
      const total    = members.length
      const div      = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

      // Mapear número → JID real del grupo para las menciones
      const numToJid = {}
      members.forEach(m => {
        const num = cleanNumber(m.id)
        numToJid[num] = m.id
      })

      const mentions = []
      let txt = `╭─〔 ${toBold('RANKING DE ACTIVIDAD')} 〕\n`
      txt += `│\n`
      txt += `│ ${div}\n`

      lista.forEach((r, i) => {
        const jid = numToJid[r.user] || `${r.user}@s.whatsapp.net`
        mentions.push(jid)
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        txt += `│ ${medal} @${r.user}  ·  ${r.msgs} msg${r.msgs !== 1 ? 's' : ''}\n`
      })

      txt += `│\n`
      txt += `│ ${toBold('Participantes activos')}: ${lista.length} / ${total}\n`
      txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}