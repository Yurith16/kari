import { toBold }    from '../utils/helpers.js'
import db            from '../core/sqlite.js'

const _getWarns = db.prepare(`SELECT user, count FROM warns WHERE group_id = ? AND count > 0 ORDER BY count DESC`)

export default {
  command:   ['warnlist', 'avisos', 'advertencias', 'listaavisos', 'warns'],
  tag:       'warnlist',
  categoria: 'admin',
  descripcion: 'Muestra la lista de usuarios con advertencias activas',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '📋', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const lista = _getWarns.all(from)

    if (!lista.length) {
      await sock.sendMessage(from, {
        text: '_Nadie tiene avisos pendientes._'
      }, { quoted: msg })
      return
    }

    const mentions = lista.map(r => `${r.user}@s.whatsapp.net`)

    let txt = `𝙰𝚅𝙸𝚂𝙾𝚂 𝙰𝙲𝚃𝙸𝚅𝙾𝚂\n`
    txt += `⊰᯽⊱┈──╌❊╌──┈⊰᯽⊱\n\n`

   lista.forEach((r, i) => {
  const circulos = '●'.repeat(r.count) + '○'.repeat(3 - r.count)
  txt += `✦ ${i + 1}. @${r.user}  ${circulos} ${r.count}/3\n\n`
})

    txt += `✦ *Total:* ${lista.length} usuario(s)`

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}