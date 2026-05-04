// plugins/demote.js

import { resolveTarget } from '../utils/target.js'

export default {
  command:   'demote',
  tag:       'demote',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Quita el rango de admin a un miembro',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, {
        text: '✦ Responde al mensaje del usuario, menciónalo o escribe su número.\n\nEjemplo: *.demote 50412345678*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.groupParticipantsUpdate(from, [target.jid], 'demote')
      await sock.sendMessage(from, {
        text: `✦ *+${target.num}* ha sido degradado de administrador.`
      }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, {
        text: '✦ No se pudo degradar al usuario.'
      }, { quoted: msg })
    }
  }
}