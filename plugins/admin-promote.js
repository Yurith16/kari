// plugins/promote.js

import { resolveTarget } from '../utils/target.js'

export default {
  command:   'promote',
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
      await sock.sendMessage(from, {
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.promote 50412345678*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.groupParticipantsUpdate(from, [target.jid], 'promote')
      await sock.sendMessage(from, {
        text: `✦ *+${target.num}* ha sido promovido a administrador.`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, {
        text: '✦ No se pudo promover al usuario.'
      }, { quoted: msg })
    }
  }
}