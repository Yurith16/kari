// plugins/transferir.js

import { getEconomy, addKryons, removeKryons, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'
import { toBold } from '../utils/helpers.js'

export default {
  command: ['transferir', 'pay', 'pagar', 'enviar'],
  tag: 'transferir',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Transfiere kryons a otro usuario',

  async execute(sock, msg, { from, args, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `> 🌿 *Uso incorrecto*\n\n> ↳ _Ejemplo: .pay @usuario 500_`
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, {
        text: `> 🌿 Menciona a la persona o responde a su mensaje para realizar la transferencia.`
      }, { quoted: msg })
    }

    const targetNum = target.num
    const targetJid = `${targetNum}@s.whatsapp.net`

    if (selfNum === targetNum) {
      return sock.sendMessage(from, { text: `> 🌿 No puedes transferirte fondos a ti mismo.` }, { quoted: msg })
    }

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, { text: `> 🌿 Esa persona no está registrada en el sistema.` }, { quoted: msg })
    }

    const cantidad = parseInt(args[args.length - 1])
    if (isNaN(cantidad) || cantidad <= 0) {
      return sock.sendMessage(from, { text: `> 🌿 Indica una cantidad numérica válida.` }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)
    if (cantidad > eco.kryons) {
      return sock.sendMessage(from, {
        text: `> 🌿 Fondos insuficientes. Solo tienes *${eco.kryons.toLocaleString()}* kryons en mano.`
      }, { quoted: msg })
    }

    removeKryons(selfNum, cantidad)
    addKryons(targetNum, cantidad)

    const perfil = getUser(targetNum)
    const nombre = perfil.apodo || perfil.nombre

    // Reacciones aleatorias
    const reacciones = ['💸', '💌', '✨', '🍀', '💚']
    const react = reacciones[Math.floor(Math.random() * reacciones.length)]

    const mensajesExito = [
      `💸 Has transferido *${cantidad.toLocaleString()}* kryons a *${nombre}*. ¡Qué generosidad!`,
      `💌 *${nombre}* ha recibido *${cantidad.toLocaleString()}* kryons de tu parte.`,
      `✨ Has enviado *${cantidad.toLocaleString()}* kryons a *${nombre}*. El flujo de riqueza continúa.`,
      `🍀 Transferencia exitosa. *${nombre}* ahora cuenta con *${cantidad.toLocaleString()}* kryons adicionales gracias a ti.`,
      `💚 Has compartido *${cantidad.toLocaleString()}* kryons con *${nombre}*. Un gesto muy noble.`
    ]

    const msgFinal = mensajesExito[Math.floor(Math.random() * mensajesExito.length)]

    await sock.sendMessage(from, { react: { text: react, key: msg.key } })
    await sock.sendMessage(from, {
      text: `> 🏦 *Transferencia completada*\n\n> ↳ _${msgFinal}_`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}