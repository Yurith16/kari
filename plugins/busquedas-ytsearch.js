// creditos a YJ-EspinoX
import ytSearch from 'yt-search'
import { getBotSignature } from '../utils/formatters.js'

export default {
  command: ['yts', 'ytsearch', 'buscar'],
  tag: 'ytsearch',
  categoria: 'busqueda',
  descripcion: 'Busca videos en YouTube y envía los resultados individualmente',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args, prefix }) {
    const query = args.join(' ')
    if (!query) return sock.sendMessage(from, { text: '🌸 ¿Qué video quieres que busque en YouTube?' }, { quoted: msg })

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const results = await ytSearch(query)
      const videos = results.videos.slice(0, 5)

      if (videos.length === 0) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
      }

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]
        const { title, author, duration, views, ago, url, thumbnail } = video

        const videoDetails = ` *「✦」 ${title}*\n\n` +
          `> ✦ *Canal:* » ${author.name}\n` +
          `> ⴵ *Duración:* » ${duration.timestamp}\n` +
          `> ✰ *Vistas:* » ${(views || 0).toLocaleString()}\n` +
          `> ✐ *Publicado:* » ${ago || 'Reciente'}\n` +
          `> 🜸 *Enlace:* » ${url}`

        try {
          await sock.sendMessage(from, {
            image: { url: thumbnail },
            caption: videoDetails
          }, { quoted: msg })

          await new Promise(resolve => setTimeout(resolve, 500))
        } catch {
          continue
        }
      }

      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      return await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}