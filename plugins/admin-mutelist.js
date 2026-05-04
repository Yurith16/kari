import { toBold } from '../utils/helpers.js'

// Query directa a SQLite para obtener muteados del grupo
import db from '../core/sqlite.js'
const _getMuted = db.prepare(`SELECT user FROM mutes WHERE group_id = ? ORDER BY muted_at DESC`)

export default {
  command:   'mutelist',
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
    if (lista.length === 0) {
      await sock.sendMessage(from, {
        text: '✦ No hay usuarios silenciados en este grupo actualmente.'
      }, { quoted: msg })
      return
    }
    const div = '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄'
    let txt = `╭─〔 ${toBold('Usuarios Silenciados')} 〕\n│\n│ ${div}\n`
    lista.forEach((r, i) => {
      txt += `│  ${i + 1}. +${r.user}\n`
    })
    txt += `│\n│ ${toBold('Total')}: ${lista.length} usuario(s)\n`
    txt += `╰─── ${toBold(global.bot?.name || 'Bot')} ✦`
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}