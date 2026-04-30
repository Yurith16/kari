import { resetWarns } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'

export default {
  command:   'unwarn',
  tag:       'unwarn (quitar adver)',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const target = resolveTarget(msg, args)
    if (!target) {
      await sock.sendMessage(from, {
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.resetwarn 50412345678*'
      }, { quoted: msg })
      return
    }
    resetWarns(from, target.num)
    await sock.sendMessage(from, {
      text: `✦ Las advertencias de *+${target.num}* han sido reiniciadas correctamente.`
    }, { quoted: msg })
  }
}