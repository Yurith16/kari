// plugins/retirar.js

import { getEconomy, withdrawBanco, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['retirar', 'sacar', 'wd'],
  tag:         'retirar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Saca tus kryons del banco',

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

    if (!args.length) {
      if (eco.banco === 0) {
        return sock.sendMessage(from, {
          text: '🌸 Tu banco está vacío, no hay nada que sacar.'
        }, { quoted: msg })
      }
      return sock.sendMessage(from, {
        text: `🌸 ¿Cuántos kryons quieres sacar?\n\nTienes *${eco.banco.toLocaleString()}* guardados en el banco.\n\nEscribe *.wd <cantidad>* o *.wd all* para sacar todo.`
      }, { quoted: msg })
    }

    let cantidad

    if (args[0].toLowerCase() === 'all') {
      cantidad = eco.banco
    } else {
      cantidad = parseInt(args[0])
      if (isNaN(cantidad) || cantidad <= 0) {
        return sock.sendMessage(from, {
          text: '🌸 Dime un número válido, corazón. Ejemplo: *.wd 500*'
        }, { quoted: msg })
      }
    }

    if (cantidad === 0) {
      return sock.sendMessage(from, {
        text: '🌸 Tu banco está vacío, no hay nada que sacar.'
      }, { quoted: msg })
    }

    if (cantidad > eco.banco) {
      return sock.sendMessage(from, {
        text: `🌸 No tienes tanto guardado, en el banco solo hay *${eco.banco.toLocaleString()}* kryons.`
      }, { quoted: msg })
    }

    withdrawBanco(selfNum, cantidad)

    const ecoActual = getEconomy(selfNum)

    await sock.sendMessage(from, {
      text: `💰 Sacaste *${cantidad.toLocaleString()}* kryons del banco.\n\nAhora tienes *${ecoActual.kryons.toLocaleString()}* en la mano y *${ecoActual.banco.toLocaleString()}* en el banco.`
    }, { quoted: msg })
  }
}