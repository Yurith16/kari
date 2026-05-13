// plugins/balance.js

import { getEconomy, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     ['bal', 'balance'],
  tag:         'balance',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra tu balance de kryons',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)

    if (!isRegistered(selfNum)) {
      return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
    }

    const perfil = getUser(selfNum)
    const eco = getEconomy(selfNum)
    const nombre = perfil.apodo || perfil.nombre
    const total = eco.kryons + eco.banco

    const frases = [
      `🌸 *${nombre}*, tienes *${eco.kryons.toLocaleString()}* kryons en la mano y *${eco.banco.toLocaleString()}* guardados en el banco. En total son *${total.toLocaleString()}* kryons. Nada mal.`,
      `🍃 *${nombre}*, en tu bolsillo llevas *${eco.kryons.toLocaleString()}* y en el banco descansan *${eco.banco.toLocaleString()}*. Sumando todo, tienes *${total.toLocaleString()}* kryons.`,
      `✨ *${nombre}*, entre lo que cargas y lo que tienes guardado juntas *${total.toLocaleString()}* kryons. Tu bolsillo tiene *${eco.kryons.toLocaleString()}* y el banco *${eco.banco.toLocaleString()}*.`
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(from, { text: frase }, { quoted: msg })
  }
}