// plugins/inventario.js

import { getInventory, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command:     'inventario',
  tag:         'inventario',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra los items que tienes en tu inventario',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      await sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
      return
    }

    const realJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const user    = cleanNumber(realJid)

    if (!user) {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
      return
    }

    if (!isRegistered(user)) {
      await sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
      return
    }

    const items = getInventory(user)

    if (!items || items.length === 0) {
      await sock.sendMessage(from, { text: '🌿 Tu inventario está vacío.' }, { quoted: msg })
      return
    }

    let txt = `╭─〔 🎒 *INVENTARIO* 〕\n`
    txt += `│\n`

    for (const { item, cantidad } of items) {
      const emoji = item === 'escudo' ? '🛡' : item === 'pico' ? '⛏' : item === 'maletín' ? '💼' : item === 'capa' ? '🧥' : '📦'
      txt += `│ ${emoji} *${item}* ×${cantidad}\n`
    }

    txt += `│\n`
    txt += `╰─── ✦`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}