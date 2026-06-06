// plugins/tienda.js
import axios from 'axios'
import { getTienda } from '../core/sqlite.js'
import { toBold } from '../utils/helpers.js'

export default {
  command:     ['tienda', 'shop'],
  tag:         'tienda',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra los artículos disponibles en la tienda',

  async execute(sock, msg, { from, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const productos = getTienda()
    if (!productos.length) {
      return sock.sendMessage(from, { text: '🌿 La tienda se encuentra vacía por ahora.' }, { quoted: msg })
    }

    await sock.sendMessage(from, { react: { text: '🛍️', key: msg.key } })

    let txt = `╭─〔 🌸 *ARTÍCULOS* 〕─╮\n\n`

    productos.forEach((p) => {
      // Desglose de datos en renglones hacia abajo igual que el top
      txt += `> ✦ *Artículo:* ${p.emoji} *${p.item.toUpperCase()}*\n`
      txt += `> ✦ *Precio:* ${p.precio.toLocaleString()} kryons\n`
      txt += `> ✦ *Efecto:* _${p.descripcion}_\n\n`
    })

    txt += `───────────────────\n`
    txt += `🛒 *Para comprar usa:* .comprar [nombre]\n`
    txt += `🌿 ${toBold(global.bot?.name || 'Bot')}`

    const urlImagen = 'https://www.image2url.com/r2/default/images/1780188047912-ed5733cb-bc43-43d0-8a85-109dfb1c8c8a.jpg'

    try {
      const imgRes = await axios.get(urlImagen, { responseType: 'arraybuffer', timeout: 10000 })
      await sock.sendMessage(from, { image: Buffer.from(imgRes.data), caption: txt }, { quoted: msg })
    } catch (err) {
      await sock.sendMessage(from, { text: txt }, { quoted: msg })
    }
  }
}