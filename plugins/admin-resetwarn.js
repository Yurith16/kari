import { resetWarns } from '../core/sqlite.js'
import { resolveTarget } from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:   ['delwarn', 'resetwarns', 'limpiarwarns', 'borrarwarns', 'clearwarns'],
  tag:       'delwarn',
  categoria: 'admin',
  descripcion: 'Elimina todas las advertencias de un usuario',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
    await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })

    if (!isOwner && !isAdmin) {
      await sock.sendMessage(from, { text: global.messages.notAdmin }, { quoted: msg })
      return
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      await sock.sendMessage(from, { text: global.messages.userNeeded }, { quoted: msg })
      return
    }

    const realJid  = await getRealJid(sock, target.jid, msg).catch(() => target.jid)
    const num      = cleanNumber(realJid)
    const jidFinal = `${num}@s.whatsapp.net`

    resetWarns(from, num)
    await sock.sendMessage(from, {
      text: `_Avisos de @${num} reiniciados._`,
      mentions: [jidFinal]
    }, { quoted: msg })
  }
}