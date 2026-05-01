// plugins/reportar.js

import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:   ['reporte', 'reportar', 'report'],
  tag:       'reporte',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el mensaje que deseas reportar*\n\nEjemplo: *.reporte El comando de play no funciona*'
      }, { quoted: msg })
    }

    const mensaje = args.join(' ')
    const bot = global.bot || {}
    const ownerJid = (bot.ownerNumber || '50496926150') + '@s.whatsapp.net'

    const rawJid = msg.key.participant || from
    const realJid = await getRealJid(sock, rawJid, msg).catch(() => rawJid)
    const numero = cleanNumber(realJid)

    try {
      await sock.sendMessage(ownerJid, {
        text: `> 📩 *Nuevo reporte*\n> *De:* +${numero}\n> *Mensaje:* ${mensaje}`
      })

      await sock.sendMessage(from, {
        text: '✅ *Tu reporte fue enviado con éxito.*\nGracias por ayudar a mejorar.'
      }, { quoted: msg })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error al enviar el reporte.'
      }, { quoted: msg })
    }
  }
}