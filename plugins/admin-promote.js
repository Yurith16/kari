// plugins/promote.js

import { resolveTarget } from '../utils/target.js'

export default {
  command:   ['promote', 'ascender', 'subir', 'haceradmin', 'daradmin'],
  tag:       'promote',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Asciende a un miembro a administrador',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, { text: global.messages.userNeeded }, { quoted: msg })
      return
    }

    try {
      await sock.groupParticipantsUpdate(from, [target.jid], 'promote')
      await sock.sendMessage(from, {
        text: `👮 +${target.num} ahora es admin, ¡a mandar se ha dicho!`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: global.messages.botNotAdmin }, { quoted: msg })
    }
  }
}