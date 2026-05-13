// plugins/depositar.js

import { getEconomy, depositBanco, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['depositar', 'dep'],
  tag:         'depositar',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Guarda tus kryons en el banco',

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
      if (eco.kryons === 0) {
        return sock.sendMessage(from, {
          text: '🌸 No tienes kryons en la mano para guardar, corazón.'
        }, { quoted: msg })
      }
      return sock.sendMessage(from, {
        text: `🌸 ¿Cuántos kryons quieres guardar?\n\nTienes *${eco.kryons.toLocaleString()}* en la mano y *${eco.banco.toLocaleString()}* en el banco.\n\nEscribe *.dep <cantidad>* o *.dep all* para guardar todo.`
      }, { quoted: msg })
    }

    let cantidad

    if (args[0].toLowerCase() === 'all') {
      cantidad = eco.kryons
    } else {
      cantidad = parseInt(args[0])
      if (isNaN(cantidad) || cantidad <= 0) {
        return sock.sendMessage(from, {
          text: '🌸 Dime un número válido, corazón. Ejemplo: *.dep 500*'
        }, { quoted: msg })
      }
    }

    if (cantidad === 0) {
      return sock.sendMessage(from, {
        text: '🌸 No tienes kryons para guardar, corazón.'
      }, { quoted: msg })
    }

    if (cantidad > eco.kryons) {
      return sock.sendMessage(from, {
        text: `🌸 No tienes tantos kryons sueltos, solo tienes *${eco.kryons.toLocaleString()}*.`
      }, { quoted: msg })
    }

    depositBanco(selfNum, cantidad)

    const ecoActual = getEconomy(selfNum)

    await sock.sendMessage(from, {
      text: `🏦 Guardadito queda. Pusiste *${cantidad.toLocaleString()}* kryons en el banco.\n\nAhora tienes *${ecoActual.kryons.toLocaleString()}* en la mano y *${ecoActual.banco.toLocaleString()}* seguros en el banco.`
    }, { quoted: msg })
  }
}