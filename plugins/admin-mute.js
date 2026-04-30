import { muteUser } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'

export default {
  command:   'mute',
  tag:       'mute (silencia user)',
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
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.mute 50412345678*'
      }, { quoted: msg })
      return
    }
    muteUser(from, target.num)
    await sock.sendMessage(from, {
      text: `✦ *+${target.num}* ha sido silenciado. Sus mensajes serán eliminados automáticamente hasta que se le quite el silencio.`
    }, { quoted: msg })
  }
}