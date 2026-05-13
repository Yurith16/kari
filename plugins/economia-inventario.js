// plugins/inventario.js

import { getInventory, getEconomy, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { getBotSignature } from '../utils/formatters.js'

export default {
  command:     ['inventario', 'inv'],
  tag:         'inventario',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra tus bienes y estadísticas',

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
    const items = getInventory(selfNum)
    const signature = getBotSignature(global.bot)

    const emojiItem = {
      'escudo': '🛡',
      'pico': '⛏',
      'maletín': '💼',
      'capa': '🧥'
    }

    const nombre = perfil.apodo || perfil.nombre
    const total = eco.kryons + eco.banco
    const xpParaNivel = 500
    const progreso = eco.xp % xpParaNivel
    const barra = '▓'.repeat(Math.floor((progreso / xpParaNivel) * 10)) + '░'.repeat(10 - Math.floor((progreso / xpParaNivel) * 10))

    let txt = `  · · ─────── ·🌸· ─────── · ·\n`
    txt += `  ⊱ *_${nombre}_* ⊰\n`
    txt += `  ♡ *En mano:* _${eco.kryons.toLocaleString()}_ kryons\n`
    txt += `  ♡ *En el banco:* _${eco.banco.toLocaleString()}_ kryons\n`
    txt += `  ♡ *Fortuna total:* _${total.toLocaleString()}_ kryons\n`
    txt += `  ♡ *Nivel:* _${eco.nivel}_\n`
    txt += `  ♡ *Experiencia:* _${progreso}/${xpParaNivel}_\n`
    txt += `     [${barra}]\n`

    if (items && items.length > 0) {
      txt += `  ♡ *Tus cositas:*\n`
      items.forEach(({ item, cantidad }) => {
        const emoji = emojiItem[item] || '📦'
        txt += `     ${emoji} _${item}_ ×${cantidad}\n`
      })
    }

    txt += `  · · ─────── ·🌸· ─────── · ·\n`
    txt += `     ${signature}`

    await sock.sendMessage(from, { react: { text: '🎒', key: msg.key } })
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}