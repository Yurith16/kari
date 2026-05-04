import { addWarn, resetWarns } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'

export default {
  command:   'warn',
  tag:       'warn',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Advierte a un usuario del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const target = await resolveTarget(sock, msg, args)
    if (!target) {
      await sock.sendMessage(from, {
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.warn 50412345678*'
      }, { quoted: msg })
      return
    }

    const count = addWarn(from, target.num)

    if (count >= 3) {
      await sock.sendMessage(from, {
        text: `⚠ @${target.num} ha acumulado *3 advertencias* y será expulsado en 5 segundos.\n\nMotivar: comportamiento repetitivo.`,
        mentions: [target.jid]
      }, { quoted: msg })
      setTimeout(async () => {
        try {
          await sock.groupParticipantsUpdate(from, [target.jid], 'remove')
          resetWarns(from, target.num)
        } catch {}
      }, 5000)
    } else {
      await sock.sendMessage(from, {
        text: `⚠ Advertencia *${count}/3* para @${target.num}.\n\nUna advertencia más y será expulsado del grupo automáticamente.`,
        mentions: [target.jid]
      }, { quoted: msg })
    }
  }
}