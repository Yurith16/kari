import { toBold }    from '../utils/helpers.js'
import { cleanNumber } from '../utils/jid.js'
import db            from '../core/sqlite.js'

const _getActive = db.prepare(`
  SELECT user FROM activity WHERE group_id = ? AND msgs > 0
`)

export default {
  command:   'fantasmas',
  tag:       'fantasmas',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Detecta y lista los miembros inactivos del grupo',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    try {
      await sock.sendMessage(from, { react: { text: '👻', key: msg.key } })

      const meta    = await sock.groupMetadata(from)
      const members = meta.participants
      const total   = members.length
      const div     = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

      const activos = new Set(_getActive.all(from).map(r => r.user))

      const fantasmas = members.filter(m => {
        const num = cleanNumber(m.id)
        return !activos.has(num) && !m.admin
      })

      if (!fantasmas.length) {
        await sock.sendMessage(from, {
          text: '🌸 ¡Qué bonito! No hay fantasmas, todos han participado.'
        }, { quoted: msg })
        return
      }

      const mentions = fantasmas.map(m => m.id)

      let txt = `╭─〔 ${toBold('👻 FANTASMAS DEL GRUPO')} 〕\n`
      txt += `│\n`
      txt += `│ ${toBold('Personitas que no han dicho ni pío:')}\n`
      txt += `│ ${div}\n`

      fantasmas.forEach(m => {
        const num = cleanNumber(m.id)
        txt += `│ 👻 @${num}\n`
      })

      txt += `│\n`
      txt += `│ ✨ ${fantasmas.length} de ${total} están muditos\n`
      txt += `│ 🌿 ${activos.size} de ${total} sí han hablado\n`
      txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}