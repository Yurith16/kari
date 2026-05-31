// plugins/retirar.js

import { getEconomy, withdrawBanco, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

export default {
  command: ['retirar', 'sacar', 'wd', 'withdraw', 'retira'],
  tag: 'retirar',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Retira tus kryons del banco de Midori-Hana',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    const reacciones = ['🍃', '🍀', '🎋', '🌲', '💚', '🌱']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    if (!args.length) {
      if (eco.banco === 0) {
        return sock.sendMessage(from, {
          text: `🌿 Tu bóveda está vacía. No hay nada que retirar.`
        }, { quoted: msg })
      }
      return sock.sendMessage(from, {
        text: `> ╭─〔 🏦 *BANCO CENTRAL* 〕\n` +
              `> │\n` +
              `> │ 🏦 *En banco:* ${eco.banco.toLocaleString()}\n` +
              `> │\n` +
              `> │ 🌿 *Uso:* .wd <cantidad> o .wd all\n` +
              `> ╰─── ${toBold(global.bot?.name || 'Bot')} 🌿`
      }, { quoted: msg })
    }

    let cantidad

    if (args[0].toLowerCase() === 'all') {
      cantidad = eco.banco
    } else {
      cantidad = parseInt(args[0])
      if (isNaN(cantidad) || cantidad <= 0) {
        return sock.sendMessage(from, {
          text: `🌿 Indica una cantidad válida. Ejemplo: *.wd 500*`
        }, { quoted: msg })
      }
    }

    if (cantidad > eco.banco) {
      return sock.sendMessage(from, {
        text: `🌿 Solo tienes *${eco.banco.toLocaleString()}* kryons en el banco. No puedes retirar más.`
      }, { quoted: msg })
    }

    withdrawBanco(selfNum, cantidad)
    const ecoActual = getEconomy(selfNum)

    const mensajesExito = [
      `🏦 Has retirado *${cantidad.toLocaleString()}* kryons. Úsalos con sabiduría.`,
      `🌿 Retiro procesado. *${cantidad.toLocaleString()}* kryons ahora están en tu mano.`,
      `🔐 Transacción exitosa. Retiraste *${cantidad.toLocaleString()}* kryons de tu cuenta segura.`,
      `🍀 Has sacado *${cantidad.toLocaleString()}* kryons del banco. ¡Que la fortuna te acompañe!`,
      `💼 Fondos entregados. Tienes *${cantidad.toLocaleString()}* kryons listos para gastar.`,
      `🌱 Operación completada. Has retirado *${cantidad.toLocaleString()}* kryons de tus reservas.`,
      `🍃 Retiro confirmado. Ahora cuentas con *${cantidad.toLocaleString()}* kryons fuera del banco.`,
      `💚 Has extraído *${cantidad.toLocaleString()}* kryons. El banco de Midori-Hana siempre estará disponible para ti.`,
      `🎋 Tus *${cantidad.toLocaleString()}* kryons han sido entregados con éxito.`,
      `🌲 Has retirado *${cantidad.toLocaleString()}* kryons de la bóveda principal.`,
      `🔮 Movimiento realizado. Tu tesoro de *${cantidad.toLocaleString()}* kryons está en tus manos.`,
      `🧪 Has retirado *${cantidad.toLocaleString()}* kryons para tus gastos diarios.`,
      `🥀 No te quedes sin nada. Has retirado *${cantidad.toLocaleString()}* kryons con éxito.`,
      `💌 Fondos recibidos. Tienes *${cantidad.toLocaleString()}* kryons frescos para invertir.`,
      `🥂 Brindemos por el retiro. *${cantidad.toLocaleString()}* kryons están ahora en tu poder.`,
      `🧬 Tu capital se ha movido. Has retirado *${cantidad.toLocaleString()}* kryons al sistema de mano.`,
      `🌙 En la tranquilidad del momento, has retirado *${cantidad.toLocaleString()}* kryons.`,
      `🏍️ Fondos transferidos a tu mano. *${cantidad.toLocaleString()}* kryons ya están contigo.`,
      `👑 Eres el dueño de tus ahorros. *${cantidad.toLocaleString()}* kryons retirados bajo sello oficial.`,
      `🦋 Has asegurado *${cantidad.toLocaleString()}* kryons fuera del banco para tu uso personal.`
    ]

    const msgFinal = mensajesExito[Math.floor(Math.random() * mensajesExito.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, { text: `> ${msgFinal}\n\n> ⚖️ *En mano:* ${ecoActual.kryons.toLocaleString()} | *En banco:* ${ecoActual.banco.toLocaleString()}` }, { quoted: msg })
  }
}