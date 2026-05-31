// plugins/weekly.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown, toBold } from '../utils/helpers.js'

const COOLDOWN = 7 * 24 * 60 * 60 // 7 días

export default {
  command:     ['weekly', 'semanal', 'semana'],
  tag:         'weekly',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Recompensa semanal por tu lealtad',

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
        text: `> 🌿 *Paciencia, corazón*\n> ↳ _Aún no es momento de tu recompensa semanal. Vuelve en ${formatCooldown(cd.secsLeft)}._`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 15000) + 8000 // 8000-23000 kryons
    const xp = Math.floor(Math.random() * 300) + 150 // 150-450 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'weekly')

    const reacciones = ['🌟', '🏆', '💎', '🎉', '🍀', '👑']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const frases = [
      `🌟 Una semana más junto a Midori-Hana florece en *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🏆 Siete días de lealtad merecen una gran recompensa. Toma *${ganancia.toLocaleString()}* kryons.`,
      `💎 El tiempo ha dado sus frutos, has obtenido un cofre semanal con *${ganancia.toLocaleString()}* kryons.`,
      `👑 Tu constancia te hace destacar. Recibe *${ganancia.toLocaleString()}* kryons como bonificación especial.`,
      `🎉 ¡Felicidades! Has completado otra semana. Tu tesoro aumenta en *${ganancia.toLocaleString()}* kryons.`
    ]

    const msgFinal = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { 
        text: `> 🏆 *RECOMPENSA SEMANAL*\n> \n> ↳ _${msgFinal}_\n> \n> 📈 *Obtuviste ${xp} XP.*` 
    }, { quoted: msg })
  }
}