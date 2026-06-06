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
        text: '🌸 No puedo ignorar a un admin o al owner.'
      }, { quoted: msg })
      return
    }

    if (isIgnored(from, target.num)) {
      await sock.sendMessage(from, {
        text: '🌸 Ese usuario ya estaba siendo ignorado en este grupo.'
      }, { quoted: msg })
      return
    }

    ignoreUser(from, target.num)

    await sock.sendMessage(from, {
      text: `🔇 @${target.num} será ignorado en este grupo. Sus comandos no tendrán efecto.`,
      mentions: [`${target.num}@s.whatsapp.net`]
    }, { quoted: msg })
  }
}