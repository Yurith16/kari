import { ignoreUser, isIgnored } from '../core/sqlite.js'
import { resolveTarget }         from '../utils/target.js'

export default {
  command:     ['ignorar', 'ignore'],
  tag:         'ignorar',
  categoria:   'admin',
  owner:       false,
  group:       true,
  nsfw:        false,
  descripcion: 'Ignora a un usuario en este grupo',

  async execute(sock, msg, { from, args, isAdmin, isOwner }) {
    await sock.sendMessage(from, { react: { text: '🔇', key: msg.key } })

    if (!isAdmin && !isOwner) {
      await sock.sendMessage(from, { text: global.messages?.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, { text: global.messages?.userNeeded }, { quoted: msg })
      return
    }

    if (target.isAdmin || target.isOwner) {
      await sock.sendMessage(from, {
        text: '_No puedo ignorar a un admin o al owner._'
      }, { quoted: msg })
      return
    }

    if (isIgnored(from, target.num)) {
      await sock.sendMessage(from, {
        text: '_Ese usuario ya estaba ignorado en este grupo._'
      }, { quoted: msg })
      return
    }

    ignoreUser(from, target.num)

    await sock.sendMessage(from, {
      text: `_@${target.num} será ignorado, sus comandos no tendrán efecto._`,
      mentions: [`${target.num}@s.whatsapp.net`]
    }, { quoted: msg })
  }
}