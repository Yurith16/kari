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
        text: `🌿 El tiempo aún no ha dado sus frutos. Espera *${formatCooldown(cd.secsLeft)}* para tu siguiente recompensa.`
      }, { quoted: msg })
    }

    const ganancia = Math.floor(Math.random() * 600) + 300 // 300-900 kryons
    const xp = Math.floor(Math.random() * 30) + 15 // 15-45 xp

    addKryons(selfNum, ganancia)
    addXp(selfNum, xp)
    setCooldown(selfNum, 'hourly')

    const reacciones = ['⏰', '🍃', '⌛', '✨', '💚', '🌱']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const frases = [
      `⏰ El tiempo sigue su curso y tú has sido constante. Recibe *${ganancia.toLocaleString()}* kryons por tu lealtad.`,
      `🌿 Una hora más junto a Midori-Hana florece en *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `✨ El reloj avanza, pero tu fortuna también. Toma estos *${ganancia.toLocaleString()}* kryons.`,
      `🍃 Tu paciencia es recompensada con *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `⌛ La arena del tiempo cae y te deja *${ganancia.toLocaleString()}* kryons en tu billetera.`,
      `💚 Gracias por mantenerte cerca otra hora. Aquí tienes *${ganancia.toLocaleString()}* kryons extra.`,
      `🌱 Una nueva hora, un nuevo pequeño premio de *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `💧 Como gotas de rocío, los *${ganancia.toLocaleString()}* kryons se suman a tu balance.`,
      `🐾 El tiempo pasa volando, aquí tienes tus *${ganancia.toLocaleString()}* kryons de compensación.`,
      `🧧 Encontraste un pequeño amuleto del tiempo que te otorga *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `🌑 A cada hora, tu riqueza crece. Toma *${ganancia.toLocaleString()}* kryons por tu esfuerzo.`,
      `💎 El tiempo es oro, y esta hora te ha dejado *${ganancia.toLocaleString()}* kryons.`,
      `🎐 El viento de la suerte te trajo *${ganancia.toLocaleString()}* kryons en este momento.`,
      `🍀 Una racha de suerte horaria te entrega *${ganancia.toLocaleString()}* kryons y *${xp}* XP.`,
      `📖 Registramos tu actividad de esta última hora: *${ganancia.toLocaleString()}* kryons añadidos.`
    ]

    const msgFinal = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { text: `> ${msgFinal}` }, { quoted: msg })
  }
}