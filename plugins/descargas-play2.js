import { getVideo } from '../utils/video-api.js'

export default {
  command: ['play2', 'ytmp4'],
  tag: 'Ytmp4',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el nombre del video o una URL de YouTube*'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      let videoUrl, titulo, thumbnail

      if (isUrl) {
        videoUrl = query
      } else {
        const searchRes = await fetch(`https://api.princetechn.com/api/search/yts?apikey=prince&query=${encodeURIComponent(query)}`)
        const searchJson = await searchRes.json()

        if (!searchJson.success || !searchJson.results?.length) {
          return sock.sendMessage(from, { text: '🌱 No se encontraron resultados.' }, { quoted: msg })
        }

        videoUrl = searchJson.results[0].url
        titulo = searchJson.results[0].title
        thumbnail = searchJson.results[0].image
      }

      // Usar el archivo de APIs en cascada
      const { url: videoDlUrl, title, thumb } = await getVideo(videoUrl)
      const finalTitle = title || titulo || 'video'
      const cover = thumb || thumbnail

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await fetch(videoDlUrl)
      if (!videoRes.ok) throw new Error('Error al descargar buffer')
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const docMsg = {
        document: videoBuffer,
        mimetype: 'video/mp4',
        fileName: `${finalTitle}.mp4`,
        caption: `🎬 *${finalTitle}*`
      }

      if (cover) {
        docMsg.contextInfo = {
          externalAdReply: {
            title: finalTitle,
            body: 'Midori-Hana',
            thumbnailUrl: cover,
            sourceUrl: videoUrl,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }

      await sock.sendMessage(from, docMsg, { quoted: msg })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}