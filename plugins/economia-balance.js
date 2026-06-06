// plugins/inventario.js
import { getInventory, getEconomy, isRegistered, getUser } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'
import { toBold } from '../utils/helpers.js'

export default {
  command: ['bal', 'balance', 'inventario', 'inv'],
  tag: 'inventario',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Muestra tus estadísticas financieras y mochila con interfaz visual',

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
    const items = getInventory(selfNum) || []
    const nombre = perfil.apodo || perfil.nombre
    const total = eco.kryons + eco.banco

    const emojiItem = {
      'escudo': '🛡️',
      'pico':   '⛏️',
      'maletín': '💼',
      'capa':   '🧥'
    }

    // Estructura visual idéntica a tu comando de perfil
    let txt = `> ╭─〔 🌸 *INVENTARIO* 〕\n`
    txt += `> │\n`
    txt += `> │ ✦ *Usuario:* ${nombre}\n`
    txt += `> │ ✦ *Nivel:* ${eco.nivel}\n`
    txt += `> │ ✦ *Exp:* ${eco.xp?.toLocaleString() || 0} XP\n`
    txt += `> │ ✦ *Kryons:* ${eco.kryons.toLocaleString()}\n`
    txt += `> │ ✦ *Banco:* ${eco.banco.toLocaleString()}\n`
    txt += `> │ ✦ *Total:* ${total.toLocaleString()}\n`

    const itemsValidos = items.filter(({ cantidad }) => cantidad > 0)

    if (itemsValidos.length > 0) {
      txt += `> │\n`
      txt += `> ├─〔 🎒 *MOCHILA* 〕\n`
      txt += `> │\n`
      itemsValidos.forEach(({ item, cantidad }) => {
        const emoji = emojiItem[item] || '📦'
        const itemFormateado = item.charAt(0).toUpperCase() + item.slice(1)
        txt += `> │ 🟢 ${emoji} *${itemFormateado}:* x${cantidad}\n`
      })
    }

    txt += `> │\n`
    txt += `> ╰─── ${toBold(global.bot?.name || 'Bot')} ✦`

    // Reacción de Midori-Hana
    await sock.sendMessage(from, { react: { text: '💚', key: msg.key } })

    // Envío del mensaje en texto plano pero estilizado
    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}