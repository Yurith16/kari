import { resolveTarget } from '../utils/target.js'

export default {
  command:   'kick',
  tag:       'kick (elimina user)',
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
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.gban 50412345678*'
      }, { quoted: msg })
      return
    }
    try {
      await sock.groupParticipantsUpdate(from, [target.jid], 'remove')
      await sock.sendMessage(from, {
        text: `✦ Usuario *+${target.num}* expulsado del grupo correctamente.`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}