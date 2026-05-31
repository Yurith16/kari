import { addWarn, resetWarns } from '../core/sqlite.js'
import { resolveTarget }       from '../utils/target.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:   ['warn', 'avisar', 'advertir', 'llamadaatencion', 'nota'],
  tag:       'warn',
  categoria: 'admin',
  descripcion: 'Advierte a un usuario del grupo',
  owner:     false,
  group:     true,
  nsfw:      false,

  async execute(sock, msg, { from, args, isOwner, isAdmin }) {
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
    const count    = addWarn(from, num)

    if (count >= 3) {
      await sock.sendMessage(from, {
        text: `🚫 @${num} juntó 🔴🔴🔴 *3 avisos* y será expulsado en 5 segundos...`,
        mentions: [jidFinal]
      }, { quoted: msg })
      setTimeout(async () => {
        try {
          await sock.groupParticipantsUpdate(from, [jidFinal], 'remove')
          resetWarns(from, num)
        } catch {}
      }, 5000)
    } else {
      const circulos = '🔴'.repeat(count) + '⚪'.repeat(3 - count)
      await sock.sendMessage(from, {
        text: `⚠️ @${num} ${circulos} *${count}/3* avisos. Una más y te tengo que sacar.`,
        mentions: [jidFinal]
      }, { quoted: msg })
    }
  }
}