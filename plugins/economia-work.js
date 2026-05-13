// plugins/work.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos

export default {
  command:     ['work', 'trabajar', 'chamba'],
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
        text: `🌸 Ya trabajaste, descansa un poco. Vuelve en *${formatCooldown(cd.secsLeft)}*.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 300) + 100 // 100-400 kryons
    const xp = Math.floor(Math.random() * 15) + 8 // 8-23 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'work')

    const frases = [
      `🌸 Ayudaste en la cafetería y te dieron *${ganancia}* kryons. ¡Buen trabajo!`,
      `🍃 Regaste las plantas del vecino y ganaste *${ganancia}* kryons.`,
      `✨ Hiciste un mandado y te pagaron *${ganancia}* kryons. Nada mal.`,
      `🌿 Trabajaste en el jardín y conseguiste *${ganancia}* kryons.`
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { text: frase }, { quoted: msg })
  }
}