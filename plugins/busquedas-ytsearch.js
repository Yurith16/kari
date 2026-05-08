// creditos a YJ-EspinoX
import ytSearch from 'yt-search'

export default {
  command: ['yts', 'ytsearch', 'buscaryt'],
  tag: 'busqueda',
  categoria: 'busqueda',
  descripcion: 'Busca videos en YouTube y envía los resultados individualmente',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args, prefix }) {
    const query = args.join(' ')
    if (!query) return sock.sendMessage(from, { 
      text: `✦ *Ingresa lo que deseas buscar en YouTube.*\n\nEjemplo: *${prefix}yts phonk music*` 
    }, { quoted: msg })

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const results = await ytSearch(query)

      // Tomamos los primeros 5 resultados
      const videos = results.videos.slice(0, 5)

      if (videos.length === 0) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        return sock.sendMessage(from, { text: '✦ No se encontraron resultados.' }, { quoted: msg })
      }

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]
        const { title, author, duration, views, ago, url, thumbnail } = video

        const videoDetails = `> 🎵 *「🌱」 ${title}*\n\n` +
          `> 🍃 *Canal:* » ${author.name}\n` +
          `> ⚘ *Duración:* » ${duration.timestamp}\n` +
          `> 🌼 *Vistas:* » ${(views || 0).toLocaleString()}\n` +
          `> 🍀 *Publicado:* » ${ago || 'Reciente'}\n` +
          `> 🌿 *Enlace:* » ${url}`

        try {
          await sock.sendMessage(from, {
            image: { url: thumbnail },
            caption: videoDetails
          }, { quoted: msg })
        } catch (e) {
          console.error(`Error enviando el video ${i + 1}:`, e.message)
          continue
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (error) {
      console.error('[YTSEARCH ERROR]:', error.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { 
        text: '✦ Hubo un error al procesar la búsqueda en YouTube.' 
      }, { quoted: msg })
    }
  }
}