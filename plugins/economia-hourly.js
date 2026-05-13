// plugins/hourly.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 60 * 60 // 1 hora

export default {
  command:     ['hourly', 'hora'],
  tag:         'hourly',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Recompensa cada hora',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'hourly', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌸 Ya recogiste tu recompensa. Vuelve en *${formatCooldown(cd.secsLeft)}*.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 600) + 300 // 300-900 kryons
    const xp = Math.floor(Math.random() * 30) + 15 // 15-45 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'hourly')

    await sock.sendMessage(from, { react: { text: '⏰', key: msg.key } })

    const frases = [
      `⏰ Pasaste una hora más conmigo. Toma *${ganancia}* kryons de recompensa por tu lealtad.`,
      `🌸 Una hora más en Midori merece premio. Aquí tienes *${ganancia}* kryons.`,
      `🍃 El tiempo vuela cuando estás aquí. Ganaste *${ganancia}* kryons por esta hora.`
    ]

    await sock.sendMessage(from, {
      text: frases[Math.floor(Math.random() * frases.length)]
    }, { quoted: msg })
  }
}