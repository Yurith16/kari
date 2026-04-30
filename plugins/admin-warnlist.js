import { toBold } from '../utils/helpers.js'
import db from '../core/sqlite.js'
const _getWarns = db.prepare(`SELECT user, count FROM warns WHERE group_id = ? AND count > 0 ORDER BY count DESC`)

export default {
  command:   'warnlist',
  tag:       'warnlist (lista baneados',
  categoria: 'admin',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, isOwner, isAdmin }) {
    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }
    const lista = _getWarns.all(from)
    if (lista.length === 0) {
      await sock.sendMessage(from, {
        text: '✦ No hay usuarios con advertencias activas en este grupo.'
      }, { quoted: msg })
      return
    }
    const div = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'
    let txt = `╭─〔 ${toBold('Advertencias Activas')} 〕\n│\n│ ${div}\n`
    lista.forEach((r, i) => {
      const barra = '▓'.repeat(r.count) + '░'.repeat(3 - r.count)
      txt += `│  ${i + 1}. +${r.user}  [${barra}] ${r.count}/3\n`
    })
    txt += `│\n│ ${toBold('Total')}: ${lista.length} usuario(s)\n`
    txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}