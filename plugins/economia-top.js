// plugins/top.js

import { getTopEconomy, getUser } from '../core/sqlite.js'
import { toBold } from '../utils/helpers.js'

export default {
  command:     ['top', 'ricos'],
  tag:         'top',
  categoria:   'economia',
  owner:       false,
  group:       false,
  nsfw:        false,
  descripcion: 'Muestra a los usuarios más ricos',

  async execute(sock, msg, { from, isGroup, groupCfg }) {
    if (isGroup && groupCfg?.economia === 0) {
      return sock.sendMessage(from, { text: global.messages.ecoDisabled }, { quoted: msg })
    }

    await sock.sendMessage(from, { react: { text: '🏆', key: msg.key } })

    const top = getTopEconomy(10)

    if (!top.length) {
      return sock.sendMessage(from, {
        text: '🌸 Aún no hay ricos en Midori. ¡Sé el primero en usar *.work*!'
      }, { quoted: msg })
    }

    const medallas = ['🥇', '🥈', '🥉']

    let txt = `╭─〔 ${toBold('🏆 TOP MÁS RICOS')} 〕\n`
    txt += `│\n`

    top.forEach(({ user_num, total }, i) => {
      const perfil = getUser(user_num)
      const nombre = perfil?.apodo || perfil?.nombre || user_num
      const medalla = medallas[i] || `${i + 1}.`
      txt += `│ ${medalla} ${nombre}\n`
      txt += `> ✦ ${total.toLocaleString()} kryons\n`
    })

    txt += `│\n`
    txt += `│ 🌸 ${top.length} fortunas en Midori\n`
    txt += `╰─── ── ── ── ──\n`

    await sock.sendMessage(from, { text: txt }, { quoted: msg })
  }
}