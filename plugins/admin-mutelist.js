import { toBold } from '../utils/helpers.js'
import db         from '../core/sqlite.js'

const _getMuted = db.prepare(`SELECT user FROM mutes WHERE group_id = ? ORDER BY muted_at DESC`)

export default {
  command:   ['mutelist', 'silenciados', 'lista.mute', 'muted'],
  tag:       'mutelist',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,
  descripcion: 'Muestra la lista de usuarios silenciados',

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const lista = _getMuted.all(from)

    if (!lista.length) {
      await sock.sendMessage(from, {
        text: '🌸 No hay nadie silenciado, todos pueden hablar libremente.'
      }, { quoted: msg })
      return
    }

    const mentions = lista.map(r => `${r.user}@s.whatsapp.net`)
    const div      = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

    let txt = `╭─〔 ${toBold('🔇 SILENCIADOS')} 〕\n│\n│ ${div}\n`
    lista.forEach((r, i) => {
      txt += `│  ${i + 1}. @${r.user}\n`
    })
    txt += `│\n│ 🌿 ${lista.length} personita(s) en silencio\n`
    txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}