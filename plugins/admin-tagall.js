import { cleanNumber } from '../utils/jid.js'

export default {
  command:   'tagall',
  tag:       'tagall',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Menciona a todos los miembros del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    try {
      const meta     = await sock.groupMetadata(from)
      const members  = meta.participants
      const mensaje  = args.join(' ') || 'Atencion a todos'
      const mentions = members.map(m => m.id)

      let txt = `╭─ 📢 *${mensaje}*\n│\n`
      members.forEach(m => {
        const num = cleanNumber(m.id)
        txt += `│ ✦ @${num}\n`
      })
      txt += `╰─── ${members.length} miembros`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}