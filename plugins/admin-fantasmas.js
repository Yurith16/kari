import db from '../core/sqlite.js'
import { cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

const _getActive = db.prepare(`
  SELECT user FROM activity
  WHERE group_id = ? AND msgs > 0
`)

export default {
  command:     'fantasmas',
  tag:         'fantasmas',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
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

      // Resolver número real de cada miembro usando todas las fuentes disponibles
      const miembros = members.map(p => {
        let num = cleanNumber(p.id)

        // Si es @lid o el número parece interno (> 10 dígitos sin código de país válido)
        // intentar resolver desde caché global del pipeline
        if (p.id.endsWith('@lid') || num.length > 13) {
          const cached = global.lidCache?.get(p.id)
          if (cached) num = cleanNumber(cached)
        }

        // Si el participante tiene phoneNumber en el metadata (versión nueva de Baileys)
        if (p.phoneNumber) {
          const fromPhone = cleanNumber(p.phoneNumber)
          if (fromPhone.length >= 8) num = fromPhone
        }

        return { jid: p.id, num, admin: p.admin }
      }).filter(m => m.num && m.num.length >= 8 && m.num.length <= 15)

      const activos   = new Set(_getActive.all(from).map(r => r.user))
      const fantasmas = miembros.filter(m => !activos.has(m.num) && !m.admin)

      if (!fantasmas.length) {
        await sock.sendMessage(from, {
          text: '🌸 ¡Qué bonito! No hay fantasmas, todos han participado.'
        }, { quoted: msg })
        return
      }

      const mentions = fantasmas.map(m => `${m.num}@s.whatsapp.net`)
      const div      = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

      let txt = `╭─〔 ${toBold('👻 FANTASMAS DEL GRUPO')} 〕\n`
      txt += `│\n`
      txt += `│ ${toBold('Personitas que no han dicho ni pío:')}\n`
      txt += `│ ${div}\n`

      fantasmas.forEach(m => {
        txt += `│ 👻 @${m.num}\n`
      })

      txt += `│\n`
      txt += `│ ✨ ${fantasmas.length} de ${total} están muditos\n`
      txt += `│ 🌿 ${activos.size} de ${total} sí han hablado\n`
      txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch (err) {
      console.error('[fantasmas]', err.message)
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}