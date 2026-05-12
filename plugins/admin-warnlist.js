import { toBold }    from '../utils/helpers.js'
import db            from '../core/sqlite.js'

const _getWarns = db.prepare(`SELECT user, count FROM warns WHERE group_id = ? AND count > 0 ORDER BY count DESC`)

export default {
  command:   'warnlist',
  tag:       'warnlist',
  categoria: 'admin',
  descripcion: 'Muestra la lista de usuarios con advertencias activas',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const lista = _getWarns.all(from)

    if (!lista.length) {
      await sock.sendMessage(from, {
        text: '🌸 Todo en paz, nadie tiene avisos pendientes.'
      }, { quoted: msg })
      return
    }

    const mentions = lista.map(r => `${r.user}@s.whatsapp.net`)
    const div      = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'

    let txt = `╭─〔 ${toBold('⚠️ AVISOS ACTIVOS')} 〕\n│\n│ ${div}\n`
    lista.forEach((r, i) => {
      const circulos = '🔴'.repeat(r.count) + '⚪'.repeat(3 - r.count)
      txt += `│  ${i + 1}. @${r.user}  ${circulos} ${r.count}/3\n`
    })
    txt += `│\n│ 🌿 ${lista.length} persona(s) con llamadas de atención\n`
    txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    await sock.sendMessage(from, { text: txt, mentions }, { quoted: msg })
  }
}