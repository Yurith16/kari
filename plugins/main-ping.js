import { getRealJid, cleanNumber } from '../utils/jid.js'

function formatUptime() {
  const start = global.connectionStartTime || Date.now()
  const ms = Date.now() - start
  const d  = Math.floor(ms / 86400000)
  const h  = Math.floor((ms % 86400000) / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default {
  command: 'ping',
  tag: 'ping',
  categoria: 'main',
  descripcion: 'Muestra el estado de Midori-Hana',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, sender }) {
    const inicio  = Date.now()
    const bot     = global.bot || {}

    const realJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const num     = cleanNumber(realJid)
    const jidFinal = `${num}@s.whatsapp.net`
    const latencia = Date.now() - inicio

    const txt = `> 🩷 Hola @${num}, soy *${bot.name || 'Midori-Hana'}*.\n` +
      `> ✦ *Estado:* Activa\n` +
      `> ✦ *Latencia:* ${latencia}ms\n` +
      `> ✦ *Activa desde hace:* ${formatUptime()}`

    await sock.sendMessage(from, {
      text: txt,
      mentions: [jidFinal]
    }, { quoted: msg })
  }
}