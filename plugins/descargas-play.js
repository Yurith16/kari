// plugins/play.js

import ytSearch from 'yt-search'
import axios from 'axios'
import sharp from 'sharp'
import { downloadAudio } from '../utils/audio.js'

export default {
  command: ['play'],
  tag: 'play',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y descarga audio de YouTube en MP3',

  async execute(sock, msg, { from, args, prefix }) {
    if (!args.length) return sock.sendMessage(from, { 
  text: '🌸 ¿Qué canción quieres que busque en YouTube? Pásame el nombre o el enlace.' 
}, { quoted: msg })

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoUrl, title, thumbnail, duration, views, author, ago

      if (isUrl) {
        videoUrl = query
        if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return await sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return await sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
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

      // Bloquear videos de más de 30 minutos
      const durStr = duration || ''
      const durParts = durStr.split(':').map(Number)
      const durMin = durParts.length === 3 ? durParts[0] * 60 + durParts[1] : durParts.length === 2 ? durParts[0] : 0
      if (durMin > 30) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 Solo puedo descargar audios de menos de 30 minutos, corazón.' }, { quoted: msg })
      }

      // Enviar portada con detalles
      if (thumbnail) {
        const videoDetails = ` *「✦」 ${title || 'Audio'}*\n\n` +
          `> ✦ *Canal:* » ${author || 'YouTube'}\n` +
          `> ⴵ *Duración:* » ${duration || '--'}\n` +
          `> ✰ *Vistas:* » ${views ? Number(views).toLocaleString() : '--'}\n` +
          `> ✐ *Publicado:* » ${ago || 'Desconocido'}\n` +
          `> 🜸 *Enlace:* » ${videoUrl.split('&')[0]}`

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
        } catch {}
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const { buffer, title: finalTitle } = await downloadAudio(videoUrl)
      title = finalTitle || title

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: 'audio/mpeg'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}