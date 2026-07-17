import ytSearch from 'yt-search'
import axios from 'axios'
import sharp from 'sharp'

export default {
  command:   ['y'],
  tag:       'ytv',
  categoria: 'descargas',
  descripcion: 'Descarga videos de YouTube',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '¿Y se supone que tengo que adivinar qué video quieres o qué? Pásame el nombre o el enlace y dejo de hacerte esperar.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoUrl, title, thumbnail, duration, views, author, ago

      if (isUrl) {
        videoUrl = query
        if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
          await sock.sendMessage(from, {
            text: 'Eso no es un enlace de YouTube. No me hagas perder el tiempo, pásame algo que sirva.'
          }, { quoted: msg })
          return
        }
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) {
          await sock.sendMessage(from, {
            text: 'Busqué por todos lados y no encontré nada con eso. Intenta con otras palabras a ver si hay suerte.'
          }, { quoted: msg })
          return
        }
        const video = search.videos[0]
        videoUrl = video.url
        title = video.title
        thumbnail = video.thumbnail
        duration = video.duration?.timestamp || video.duration
        views = video.views
        author = video.author?.name || video.author
        ago = video.ago
      }

      if (thumbnail) {
        const midoriEmojis = ['🌴', '🌱', '🌾', '🐛', '🐝']
        const emo = midoriEmojis[Math.floor(Math.random() * midoriEmojis.length)]

        const videoDetails = `> *${title || 'Video'}*\n\n` +
          `> ${emo} *Canal:* ${author || 'YouTube'}\n` +
          `> ${emo} *Duración:* ${duration || '--'}\n` +
          `> ${emo} *Vistas:* ${views ? Number(views).toLocaleString() : '--'}\n` +
          `> ${emo} *Publicado:* ${ago || 'Desconocido'}\n` +
          `> ${emo} *Enlace:* ${videoUrl.split('&')[0]}`

        try {
          const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer' })
          const thumbBuffer = await sharp(Buffer.from(thumbRes.data))
            .resize(480, 360)
            .jpeg({ quality: 80 })
            .toBuffer()

          await sock.sendMessage(from, {
            image: thumbBuffer,
            caption: videoDetails.trim()
          }, { quoted: msg })
        } catch {
          await sock.sendMessage(from, { text: videoDetails.trim() }, { quoted: msg })
        }
      }

      const apiUrl = `https://api.lempi.lat/dl/ytv?url=${encodeURIComponent(videoUrl)}&apikey=lem851`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.descarga) {
        await sock.sendMessage(from, {
          text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
        }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const videoRes = await axios.get(data.descarga.url, {
        responseType: 'arraybuffer',
        timeout: 180000
      })
      const videoBuffer = Buffer.from(videoRes.data)
      const sizeMB = videoBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      const caption = `*${data.titulo || title || 'Video'}*\n*Canal:* ${data.canal || author || 'YouTube'}\n*Duración:* ${data.duracion || duration || '--'}\n*Calidad:* ${data.descarga.calidad || '--'}`

      if (sizeMB <= 50) {
        await sock.sendMessage(from, {
          video: videoBuffer,
          caption: caption
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${data.titulo || 'video'}.mp4`,
          caption: `${caption}\nEl video pesa más de lo que puedo mandar como video normal, así que te lo paso como documento. No es lo ideal, pero es lo que hay.`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })

    } catch {
      await sock.sendMessage(from, {
        text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
      }, { quoted: msg })
    }
  }
}