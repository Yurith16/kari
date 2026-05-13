// plugins/tagall.js

import { cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

export default {
  command:   'tagall',
  tag:       'tagall',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Etiqueta a todos los miembros del grupo',

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    try {
      const meta = await sock.groupMetadata(from)
      const participantes = meta.participants

      // Separar admins y miembros
      const admins = participantes.filter(p => p.admin)
      const miembros = participantes.filter(p => !p.admin)

      const mentions = participantes.map(p => p.id)

      const texto = args.join(' ') || '🌸 Han sido invocados.'

      let txt = `╭─〔 ${toBold('👥 INVOCACIÓN')} 〕\n`
      txt += `│\n`
      txt += `│ ${texto}\n`
      txt += `│\n`

      if (admins.length) {
        txt += `│ ${toBold('👮 Admins:')}\n`
        admins.forEach(a => {
          const num = cleanNumber(a.id)
          txt += `│    @${num}\n`
        })
        txt += `│\n`
      }

      txt += `│ ${toBold('👤 Miembros:')}\n`
      miembros.forEach(m => {
        const num = cleanNumber(m.id)
        txt += `│    @${num}\n`
      })

      txt += `│\n`
      txt += `╰─── ── ── ── ──\n`

      await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}