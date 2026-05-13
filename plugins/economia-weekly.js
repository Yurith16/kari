// plugins/weekly.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 7 * 24 * 60 * 60 // 7 días

export default {
  command:     ['weekly', 'semanal'],
  tag:         'weekly',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Recompensa semanal',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'weekly', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌸 Ya recogiste tu premio semanal. Vuelve en *${formatCooldown(cd.secsLeft)}*.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 15000) + 8000 // 8000-23000 kryons
    const xp = Math.floor(Math.random() * 300) + 150 // 150-450 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'weekly')

    await sock.sendMessage(from, { react: { text: '🌟', key: msg.key } })

    const frases = [
      `🌟 Una semana más en Midori merece un gran premio. Toma *${ganancia.toLocaleString()}* kryons.`,
      `💫 Siete días de lealtad no se ven todos los días. Ganaste *${ganancia.toLocaleString()}* kryons.`,
      `🏆 Gracias por estar una semana más conmigo. Aquí tienes *${ganancia.toLocaleString()}* kryons.`
    ]

    await sock.sendMessage(from, {
      text: frases[Math.floor(Math.random() * frases.length)]
    }, { quoted: msg })
  }
}