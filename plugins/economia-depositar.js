// plugins/eco-depositar.js
import { getEconomy, depositBanco, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command: ['depositar', 'dep', 'deposit', 'deposita', 'guardar', 'banco'],
  tag: 'depositar',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Guarda kryons en tu banco',

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
          text: '> 🌸 No tienes kryons para guardar.'
        }, { quoted: msg })
      }
      return sock.sendMessage(from, {
        text: `> 🌸 Tienes ${eco.kryons.toLocaleString()} kryons en mano. ¿Cuántos quieres depositar?`
      }, { quoted: msg })
    }

    let cantidad

    if (args[0].toLowerCase() === 'all') {
      cantidad = eco.kryons
      if (cantidad === 0) {
        return sock.sendMessage(from, {
          text: '> 🌸 No tienes kryons para guardar.'
        }, { quoted: msg })
      }
    } else {
      cantidad = parseInt(args[0])
      if (isNaN(cantidad) || cantidad <= 0) {
        return sock.sendMessage(from, {
          text: '> 🌸 Cantidad inválida. Usa .dep 500 o .dep all'
        }, { quoted: msg })
      }
    }

    if (cantidad > eco.kryons) {
      return sock.sendMessage(from, {
        text: `> 🌸 No tienes tanto. Tienes ${eco.kryons.toLocaleString()} kryons en mano.`
      }, { quoted: msg })
    }

    depositBanco(selfNum, cantidad)
    const ecoActual = getEconomy(selfNum)

    await sock.sendMessage(from, { react: { text: '🏦', key: msg.key } })

    await sock.sendMessage(from, {
      text: `> 🌸 Depositaste ${cantidad.toLocaleString()} kryons en el banco, ahora tienes ${ecoActual.banco.toLocaleString()} kryons guardados.`
    }, { quoted: msg })
  }
}