import { resolveTarget } from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:   'kick',
  tag:       'kick',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Expulsa a un usuario del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, {
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.kick @user*'
      }, { quoted: msg })
      return
    }
    const realJid  = await getRealJid(sock, target.jid, msg).catch(() => target.jid)
    const num      = cleanNumber(realJid)
    const jidFinal = `${num}@s.whatsapp.net`
    try {
      await sock.groupParticipantsUpdate(from, [jidFinal], 'remove')
      await sock.sendMessage(from, {
        text: `🚫 @${num} ha sido expulsado del grupo.`,
        mentions: [jidFinal]
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}