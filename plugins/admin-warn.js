import { addWarn, resetWarns } from '../core/sqlite.js'
import { resolveTarget }       from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:   'warn',
  tag:       'warn',
  categoria: 'admin',
  descripcion: 'Advierte a un usuario del grupo',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, {
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.warn 50412345678*'
      }, { quoted: msg })
      return
    }

    const realJid  = await getRealJid(sock, target.jid, msg).catch(() => target.jid)
    const num      = cleanNumber(realJid)
    const jidFinal = `${num}@s.whatsapp.net`
    const count    = addWarn(from, num)

    if (count >= 3) {
      await sock.sendMessage(from, {
        text: `⚠️ @${num} acumuló *3 advertencias* y será expulsado en 5 segundos.`,
        mentions: [jidFinal]
      }, { quoted: msg })
      setTimeout(async () => {
        try {
          await sock.groupParticipantsUpdate(from, [jidFinal], 'remove')
          resetWarns(from, num)
        } catch {}
      }, 5000)
    } else {
      await sock.sendMessage(from, {
        text: `⚠️ Advertencia *${count}/3* para @${num}.\n\nUna advertencia más y será expulsado automáticamente.`,
        mentions: [jidFinal]
      }, { quoted: msg })
    }
  }
}