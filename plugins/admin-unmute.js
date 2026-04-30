import { unmuteUser } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'

export default {
  command:   'unmute',
  tag:       'unmute (quitar mute)',
  categoria: 'admin',
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
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.unmute 50412345678*'
      }, { quoted: msg })
      return
    }
    unmuteUser(from, target.num)
    await sock.sendMessage(from, {
      text: `✦ *+${target.num}* ha sido desilenciado. Ya puede enviar mensajes con normalidad.`
    }, { quoted: msg })
  }
}