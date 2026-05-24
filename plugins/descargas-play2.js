// plugins/play2.js

import ytSearch from 'yt-search'
import axios from 'axios'
import sharp from 'sharp'
import { downloadVideo } from '../utils/video.js'

const descargando = new Set()

export default {
  command: ['play2'],
  tag: 'play2',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y descarga videos de YouTube en MP4',

  async execute(sock, msg, { from, args, prefix }) {
    if (!args.length) return sock.sendMessage(from, { 
      text: '🌸 ¿Qué video quieres que busque en YouTube? Pásame el nombre o el enlace.' 
    }, { quoted: msg })

    const userId = msg.key.participant || msg.key.remoteJid

    if (descargando.has(userId)) {
      return sock.sendMessage(from, {
        text: '🌸 Espera a que termine tu descarga actual antes de pedir otra.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    descargando.add(userId)

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

      if (thumbnail) {
        const videoDetails = ` *「✦」 ${title || 'Video'}*\n\n` +
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

      const { buffer, title: finalTitle, sizeMB } = await downloadVideo(videoUrl)
      title = finalTitle || title

      if (sizeMB <= 100) {
        await sock.sendMessage(from, {
          video: buffer,
          mimetype: 'video/mp4'
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    } finally {
      descargando.delete(userId)
    }
  }
}