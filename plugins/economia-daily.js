// plugins/daily.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 24 * 60 * 60 // 24 horas

export default {
  command:     ['daily', 'diario'],
  tag:         'daily',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Recompensa diaria',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'daily', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌸 Ya recogiste tu regalo hoy. Vuelve en *${formatCooldown(cd.secsLeft)}*.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 3000) + 1500 // 1500-4500 kryons
    const xp = Math.floor(Math.random() * 80) + 40 // 40-120 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'daily')

    await sock.sendMessage(from, { react: { text: '🌅', key: msg.key } })

    const frases = [
      `🌅 Un nuevo día, una nueva recompensa. Toma *${ganancia.toLocaleString()}* kryons por tu visita diaria.`,
      `☀️ Gracias por volver un día más. Aquí tienes *${ganancia.toLocaleString()}* kryons.`,
      `🌸 Cada día es una bendición. Ganaste *${ganancia.toLocaleString()}* kryons hoy.`
    ]

    await sock.sendMessage(from, {
      text: frases[Math.floor(Math.random() * frases.length)]
    }, { quoted: msg })
  }
}