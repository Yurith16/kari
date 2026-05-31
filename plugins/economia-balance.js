// plugins/inventario.js
import axios from 'axios'
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

    // Estructura limpia y unificada con la esencia verde de Midori-Hana
    let txt = `> ╭─〔 💚 *INVENTARIO* 〕\n`
    txt += `> │\n`
    txt += `> │ 🌿 *Nombre:* ${nombre}\n`
    txt += `> │ 📈 *Nivel actual:* ${eco.nivel}\n`
    txt += `> │ 🧪 *Experiencia:* ${eco.xp?.toLocaleString() || 0} XP\n`
    txt += `> │ 🪙 *Kryons:* ${eco.kryons.toLocaleString()}\n`
    txt += `> │ 🏦 *Banco:* ${eco.banco.toLocaleString()}\n`
    txt += `> │ 💰 *Total:* ${total.toLocaleString()}\n`

    // Filtrar para asegurar que solo contamos ítems reales
    const itemsValidos = items.filter(({ cantidad }) => cantidad > 0)

    // Despliega la sección de la mochila dinámicamente si posee cosas
    if (itemsValidos.length > 0) {
      txt += `> │\n`
      txt += `> ├─〔 🎒 *MOCHILA* 〕\n`
      txt += `> │\n`
      itemsValidos.forEach(({ item, cantidad }) => {
        const emoji = emojiItem[item] || '📦'
        const itemFormateado = item.charAt(0).toUpperCase() + item.slice(1)
        txt += `> │ 🟢 ${emoji} *${itemFormateado}:* ${cantidad}\n`
      })
    }

    txt += `> │\n`
    txt += `> ╰─── ${toBold(global.bot?.name || 'Bot')} 🌿`

    // Reacción verde de Midori-Hana
    await sock.sendMessage(from, { react: { text: '💚', key: msg.key } })

    // URL de la imagen del inventario proporcionada
    const urlImagen = 'https://www.image2url.com/r2/default/images/1780188047912-ed5733cb-bc43-43d0-8a85-109dfb1c8c8a.jpg'

    try {
      // Descargamos la imagen en un arraybuffer de manera segura
      const imgRes = await axios.get(urlImagen, { 
        responseType: 'arraybuffer', 
        timeout: 15000 
      })
      const imgBuffer = Buffer.from(imgRes.data)
      
      await sock.sendMessage(from, { 
        image: imgBuffer, 
        caption: txt 
      }, { quoted: msg })
    } catch (err) {
      console.error('[INVENTARIO] Error al descargar banner:', err.message)
      // Si falla la descarga por red, envía el texto limpio para no romper el comando
      await sock.sendMessage(from, { text: txt }, { quoted: msg })
    }
  }
}