// plugins/unreg.js

import { getUser } from '../core/sqlite.js'
import Database from 'better-sqlite3'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const db = new Database('./midori.db')

export default {
  command:     'unreg',
  tag:         'unreg',
  categoria:   'main',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Elimina tu perfil del bot (solo datos personales)',

  async execute(sock, msg, { from, sender }) {
    const realJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const user    = cleanNumber(realJid)

    if (!user) {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
      return
    }

    const perfil = getUser(user)
    if (!perfil) {
      await sock.sendMessage(from, {
        text: '🌸 No tienes un perfil creado. Usa *.registro* para crear uno.'
      }, { quoted: msg })
      return
    }

    db.pragma('foreign_keys = OFF')
    db.prepare(`DELETE FROM users WHERE user_num = ?`).run(user)
    db.pragma('foreign_keys = ON')

    await sock.sendMessage(from, {
      text: `🗑️ Perfil de *${perfil.nombre}* eliminado.\n\nTus kryons y banco se mantienen intactos. Si quieres volver a registrarte usa *.registro*`
    }, { quoted: msg })
  }
}