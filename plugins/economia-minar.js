// plugins/minar.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos

export default {
  command:     ['minar', 'mine'],
  tag:         'minar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Mina para conseguir kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const cd = checkCooldown(selfNum, 'minar', COOLDOWN)
    if (!cd.ok) {
      return sock.sendMessage(from, {
        text: `🌸 Ya minaste, descansa un poco. Vuelve en *${formatCooldown(cd.secsLeft)}*.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 250) + 80
    const xp = Math.floor(Math.random() * 15) + 8

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'minar')

    const frases = [
      `⛏ Estuviste picando piedra un buen rato y encontraste *${ganancia}* kryons.`,
      `💎 Bajaste a la mina y con esfuerzo sacaste *${ganancia}* kryons.`,
      `🪨 Entre la tierra dura hallaste una veta con *${ganancia}* kryons.`,
      `✨ La suerte estuvo de tu lado, la mina te dio *${ganancia}* kryons.`
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { text: frase }, { quoted: msg })
  }
}