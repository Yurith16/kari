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
    await sock.sendMessage(from, { react: { text: '📋', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const lista = _getMuted.all(from)

    if (!lista.length) {
      await sock.sendMessage(from, {
        text: '_No hay nadie silenciado._'
      }, { quoted: msg })
      return
    }

    const mentions = lista.map(r => `${r.user}@s.whatsapp.net`)

    let txt = `𝚂𝙸𝙻𝙴𝙽𝙲𝙸𝙰𝙳𝙾𝚂\n`
    txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`

    lista.forEach((r) => {
      txt += `> ✦ *Usuario* @${r.user}\n\n`
    })

    txt += `> ✦ *Total:* ${lista.length} usuario(s)`

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}