// plugins/transferir.js

import { getEconomy, addKryons, removeKryons, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { resolveTarget } from '../utils/target.js'

export default {
  command:     ['transferir', 'pay', 'pagar'],
  tag:         'transferir',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
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

    if (!args.length || args.length < 2) {
      return sock.sendMessage(from, {
        text: '🌸 ¿A quién y cuánto le quieres enviar?\n\n_Ejemplo: .pay @usuario 500_'
      }, { quoted: msg })
    }

    const target = await resolveTarget(sock, msg, args)
    if (!target?.num) {
      return sock.sendMessage(from, {
        text: '🌸 Menciona a la persona o responde a su mensaje para transferirle.'
      }, { quoted: msg })
    }

    const targetNum = target.num

    if (selfNum === targetNum) {
      return sock.sendMessage(from, {
        text: '🌸 No puedes transferirte a ti mismo, corazón.'
      }, { quoted: msg })
    }

    if (!isRegistered(targetNum)) {
      return sock.sendMessage(from, {
        text: '🌸 Esa persona no está registrada en el bot.'
      }, { quoted: msg })
    }

    const cantidad = parseInt(args[args.length - 1])
    if (isNaN(cantidad) || cantidad <= 0) {
      return sock.sendMessage(from, {
        text: '🌸 Dime una cantidad válida para transferir. Ejemplo: *.pay @usuario 500*'
      }, { quoted: msg })
    }

    const eco = getEconomy(selfNum)

    if (cantidad > eco.kryons) {
      return sock.sendMessage(from, {
        text: `🌸 No tienes suficientes kryons. Tienes *${eco.kryons.toLocaleString()}* en la mano.`
      }, { quoted: msg })
    }

    removeKryons(selfNum, cantidad)
    addKryons(targetNum, cantidad)

    const perfil = getUser(targetNum)
    const nombre = perfil.apodo || perfil.nombre

    const targetJid = `${targetNum}@s.whatsapp.net`

    await sock.sendMessage(from, { react: { text: '💸', key: msg.key } })

    await sock.sendMessage(from, {
      text: `💸 Le enviaste *${cantidad.toLocaleString()}* kryons a *${nombre}*. ¡Qué generoso!`,
      mentions: [selfJid, targetJid]
    }, { quoted: msg })
  }
}