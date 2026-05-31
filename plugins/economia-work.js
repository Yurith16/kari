// plugins/work.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos

export default {
  command:     ['work', 'trabajar', 'chamba', 'w'],
  tag:         'work',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Trabaja para ganar kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'work', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `> 🌿 *Hora de un respiro*\n> ↳ _Ya has trabajado suficiente por ahora. Vuelve en ${formatCooldown(cd.secsLeft)}._`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 300) + 100 // 100-400 kryons
    const xp = Math.floor(Math.random() * 15) + 8 // 8-23 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'work')

    const reacciones = ['💼', '🍃', '✨', '☕', '🌿', '📦', '🧬', '🐾', '🧹', '📜']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const frases = [
      `💼 Ayudaste en la cafetería local y ganaste *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `🍃 Regaste el jardín botánico de Midori y te recompensaron con *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `✨ Hiciste un mandado importante y recibiste *${ganancia.toLocaleString()}* kryons. ¡Excelente! (+${xp} XP)`,
      `☕ Atendiste a los clientes y lograste reunir *${ganancia.toLocaleString()}* kryons en propinas. (+${xp} XP)`,
      `🌿 Trabajaste podando setos y el dueño te pagó *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `📦 Organizaste el almacén central y encontraste *${ganancia.toLocaleString()}* kryons extra. (+${xp} XP)`,
      `🧬 Ayudaste en el laboratorio botánico y obtuviste *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `🐾 Cuidaste las mascotas del vecindario y ganaste *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `🧹 Dejaste el área común impecable, te mereces esos *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `📜 Transcribiste documentos antiguos y te pagaron *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `🎨 Pintaste un mural en la plaza central y te pagaron *${ganancia.toLocaleString()}* kryons por tu arte. (+${xp} XP)`,
      `🎣 Pesaste algunas piezas en el muelle y ganaste *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `📚 Organizaste la biblioteca municipal obteniendo *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `🔧 Reparaste un ventilador viejo en el centro y recibiste *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`,
      `🎤 Cantaste en el metro y la gente te dejó *${ganancia.toLocaleString()}* kryons. (+${xp} XP)`
    ]

    const msgFinal = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { 
      text: `> ${msgFinal}` 
    }, { quoted: msg })
  }
}