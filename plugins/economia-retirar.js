// plugins/eco-retirar.js
import { getEconomy, withdrawBanco, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

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

    if (!args.length) {
      if (eco.banco === 0) {
        return sock.sendMessage(from, {
          text: '> 🌸 No tienes kryons en el banco.'
        }, { quoted: msg })
      }
      return sock.sendMessage(from, {
        text: `> 🌸 Tienes ${eco.banco.toLocaleString()} kryons en el banco. ¿Cuántos quieres retirar?`
      }, { quoted: msg })
    }

    let cantidad

    if (args[0].toLowerCase() === 'all') {
      cantidad = eco.banco
      if (cantidad === 0) {
        return sock.sendMessage(from, {
          text: '> 🌸 No tienes kryons en el banco.'
        }, { quoted: msg })
      }
    } else {
      cantidad = parseInt(args[0])
      if (isNaN(cantidad) || cantidad <= 0) {
        return sock.sendMessage(from, {
          text: '> 🌸 Cantidad inválida. Usa .wd 500 o .wd all'
        }, { quoted: msg })
      }
    }

    if (cantidad > eco.banco) {
      return sock.sendMessage(from, {
        text: `> 🌸 No tienes tanto en el banco. Tienes ${eco.banco.toLocaleString()} kryons guardados.`
      }, { quoted: msg })
    }

    withdrawBanco(selfNum, cantidad)
    const ecoActual = getEconomy(selfNum)

    await sock.sendMessage(from, { react: { text: '💰', key: msg.key } })

    await sock.sendMessage(from, {
      text: `> 🌸 Retiraste ${cantidad.toLocaleString()} kryons del banco, ahora tienes ${ecoActual.kryons.toLocaleString()} kryons en mano.`
    }, { quoted: msg })
  }
}