// plugins/ytsearch.js
import ytSearch from 'yt-search'
import axios from 'axios'
import sharp from 'sharp'

export default {
  command: ['ytsearch', 'yts', 'youtube', 'buscar'],
  tag: 'ytsearch',
  categoria: 'busqueda',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: '🌸 Busca videos en YouTube y muestra los 5 primeros resultados',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué quieres buscar en YouTube?'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

    try {
      const search = await ytSearch(query)
      
      if (!search.videos || search.videos.length === 0) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        return sock.sendMessage(from, { text: '🌿 No encontré resultados para tu búsqueda.' }, { quoted: msg })
      }

      const videos = search.videos.slice(0, 5)

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]
        const title = video.title
        const author = video.author?.name || 'Desconocido'
        const duration = video.duration?.timestamp || video.duration || '--'
        const views = video.views
        const ago = video.ago || 'Desconocido'
        const videoUrl = video.url
        const thumbnail = video.thumbnail

        const videoDetails = ` *「✦」 ${title}*\n\n` +
          `> ✦ *Canal:* » ${author}\n` +
          `> ⴵ *Duración:* » ${duration}\n` +
          `> ✰ *Vistas:* » ${views ? Number(views).toLocaleString() : '--'}\n` +
          `> ✐ *Publicado:* » ${ago}\n` +
          `> 🜸 *Enlace:* » ${videoUrl.split('&')[0]}\n\n` +
          `> 🌸 *Resultado ${i + 1} de 5*`

        try {
          const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 10000 })
          const thumbBuffer = await sharp(Buffer.from(thumbRes.data))
            .resize(480, 360)
            .jpeg({ quality: 80 })
            .toBuffer()

          await sock.sendMessage(from, {
            image: thumbBuffer,
            caption: videoDetails.trim()
          }, { quoted: msg })
        } catch (thumbError) {
          console.error('[YTSEARCH] Error con thumbnail:', thumbError.message)
          await sock.sendMessage(from, { text: videoDetails.trim() }, { quoted: msg })
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (error) {
      console.error('[YTSEARCH] Error:', error.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: '🌿 Error al buscar en YouTube. Intenta de nuevo.' }, { quoted: msg })
    }
  }
}