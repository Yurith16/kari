// plugins/top.js
import axios from 'axios'
import { getTopEconomy, getUser, getEconomy } from '../core/sqlite.js'
import { toBold } from '../utils/helpers.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

export default {
  command: ['top', 'ricos', 'leaderboard'],
  tag: 'top',
  categoria: 'economia',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Muestra a los 15 usuarios más ricos',

  async execute(sock, msg, { from, sender, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    const allData = getTopEconomy(100)
    if (!allData.length) {
      return sock.sendMessage(from, { text: '🌿 Aún no hay fortunas registradas.' }, { quoted: msg })
    }

    const top15 = allData.slice(0, 15)
    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const selfNum = cleanNumber(selfJid)
    const posicionUsuario = allData.findIndex(u => u.user_num === selfNum) + 1

    await sock.sendMessage(from, { react: { text: '🏆', key: msg.key } })

    let txt = `╭─〔 🏆 *TOP 15 MÁS RICOS* 〕─╮\n\n`
    
    top15.forEach(({ user_num, total }, i) => {
      const perfil = getUser(user_num)
      const eco = getEconomy(user_num)
      
      const nombre = perfil?.apodo || perfil?.nombre || user_num
      const nivel = eco?.nivel || 1
      const medalla = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`
      
      // Desglose de datos en renglones hacia abajo como lo pediste
      txt += `> ✦ *Puesto:* ${medalla}\n`
      txt += `> ✦ *Usuario:* *${nombre}*\n`
      txt += `> ✦ *Nivel:* ${nivel}\n`
      txt += `> ✦ *Fortuna:* ${total.toLocaleString()} kryons\n\n`
    })

    txt += `───────────────────\n`
    
    if (posicionUsuario > 0) {
      txt += `📍 *Tu posición actual:* #${posicionUsuario}\n`
    }

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