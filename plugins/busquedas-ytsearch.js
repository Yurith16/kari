// plugins/yts.js

import yts from 'yt-search'
import axios from 'axios'

const EMOJIS = ['🌱', '🍃', '🌿', '🪴', '🌵']

export default {
  command:   'yts',
  tag:       'yts',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '🌱 *¿Qué deseas buscar en YouTube?*'
      }, { quoted: msg })
      return
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const results = await yts(query)
      const videos = results.videos?.slice(0, 5)

      if (!videos?.length) {
        return await sock.sendMessage(from, {
          text: '🌱 No se encontraron resultados.'
        }, { quoted: msg })
      }

      for (let i = 0; i < videos.length; i++) {
        const v = videos[i]
        const emoji = EMOJIS[i] || '🌱'

        const txt = `${emoji} *Título:* ${v.title}\n` +
          `${emoji} *Canal:* ${v.author?.name || 'Desconocido'}\n` +
          `${emoji} *Duración:* ${v.duration?.timestamp || 'N/A'}\n` +
          `${emoji} *Vistas:* ${(v.views || 0).toLocaleString()}\n` +
          `${emoji} *Publicado:* ${v.ago || 'Reciente'}\n` +
          `${emoji} *Enlace:* ${v.url}`

        try {
          const imgRes = await axios.get(v.thumbnail || v.image, {
            responseType: 'arraybuffer',
            timeout: 10000
          })
          await sock.sendMessage(from, {
            image: Buffer.from(imgRes.data),
            caption: txt
          }, { quoted: i === 0 ? msg : undefined })
        } catch {
          await sock.sendMessage(from, {
            text: txt
          }, { quoted: i === 0 ? msg : undefined })
        }

        if (i < videos.length - 1) {
          await new Promise(r => setTimeout(r, 1500))
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}