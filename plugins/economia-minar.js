// plugins/minar.js

import { addKryons, addXp, isRegistered, checkCooldown, setCooldown } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { formatCooldown } from '../utils/helpers.js'

const COOLDOWN = 10 * 60 // 10 minutos

export default {
  command:     ['minar', 'mine', 'minero'],
  tag:         'minar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Mina para conseguir kryons y experiencia',

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
        text: `🌿 Tus herramientas necesitan enfriarse. Espera *${formatCooldown(cd.secsLeft)}* para volver a la mina.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 250) + 80
    const xp = Math.floor(Math.random() * 15) + 8

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'minar')

    // Reacciones aleatorias de minería
    const reacciones = ['⛏️', '💎', '🪨', '✨', '🍀', '🌿']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const frases = [
      `⛏️ Picaste piedra hasta el cansancio y hallaste *${ganancia.toLocaleString()}* kryons.`,
      `💎 En lo profundo de la cueva, encontraste un cristal valioso que vendiste por *${ganancia.toLocaleString()}* kryons.`,
      `🪨 Entre el polvo y la tierra, lograste extraer *${ganancia.toLocaleString()}* kryons.`,
      `✨ Brillaba en la oscuridad: era un depósito de *${ganancia.toLocaleString()}* kryons esperándote.`,
      `🍀 Tuviste suerte hoy; al primer golpe de pico, salieron *${ganancia.toLocaleString()}* kryons.`,
      `🌿 El bosque de Midori ocultaba esta mina secreta con *${ganancia.toLocaleString()}* kryons para ti.`,
      `⚙️ Tu pico está desgastado, pero valió la pena por estos *${ganancia.toLocaleString()}* kryons.`,
      `🔨 Golpe a golpe, el muro cedió y te recompensó con *${ganancia.toLocaleString()}* kryons.`,
      `🏮 Iluminaste un pasadizo olvidado y recuperaste *${ganancia.toLocaleString()}* kryons.`,
      `🌑 El trabajo nocturno en la mina rindió frutos: *${ganancia.toLocaleString()}* kryons adicionales.`,
      `🧪 Mezclaste los minerales encontrados y obtuviste un valor total de *${ganancia.toLocaleString()}* kryons.`,
      `🎒 Llenaste tu mochila de escombros, pero también de *${ganancia.toLocaleString()}* kryons.`,
      `🦅 Un águila soltó una gema sobre la entrada, la vendiste por *${ganancia.toLocaleString()}* kryons.`,
      `💧 Encontraste una veta subterránea que contenía *${ganancia.toLocaleString()}* kryons.`,
      `🧤 Tus manos están sucias, pero tu cuenta bancaria es más feliz con *${ganancia.toLocaleString()}* kryons.`,
      `🧱 Has removido bloques pesados y has sido recompensado con *${ganancia.toLocaleString()}* kryons.`,
      `📈 La demanda de minerales subió y vendiste tus hallazgos por *${ganancia.toLocaleString()}* kryons.`,
      `🍄 Encontraste hongos exóticos junto a los minerales y los vendiste junto a *${ganancia.toLocaleString()}* kryons.`,
      `🗝️ Usaste una llave vieja en un cofre minero y encontraste *${ganancia.toLocaleString()}* kryons.`,
      `🔥 El calor de la mina es intenso, pero el botín de *${ganancia.toLocaleString()}* kryons refresca tu espíritu.`
    ]

    const fraseElegida = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { text: `> ${fraseElegida}\n\n> 📈 *Ganaste ${xp} XP.*` }, { quoted: msg })
  }
}