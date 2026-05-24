// plugins/ytmp4doc.js

import ytSearch from 'yt-search'
import axios from 'axios'
import sharp from 'sharp'
import fs from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'
import ffmpegPath from 'ffmpeg-static'
import { downloadVideo, downloadVideoLarge } from '../utils/video.js'

const MEDIA_DIR = join(process.cwd(), 'media', 'videos')
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true })

const descargando = new Set()

function splitVideo(inputPath, title, sizeMB) {
  const maxPartSize = 400
  let numParts = Math.ceil(sizeMB / maxPartSize)
  if (numParts > 4) numParts = 4
  if (numParts < 2) numParts = 2

  let duration = 0
  try {
    const probe = execSync(`"${ffmpegPath}" -i "${inputPath}" 2>&1 | grep Duration`, { encoding: 'utf-8' })
    const match = probe.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
    if (match) duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
  } catch {}

  const segmentTime = Math.ceil(duration / numParts)
  const baseName = title.replace(/[<>:"/\\|?*]/g, '_')
  const outputPattern = join(MEDIA_DIR, `${baseName}_parte_%d.mp4`)

  execSync(`"${ffmpegPath}" -i "${inputPath}" -c copy -map 0 -segment_time ${segmentTime} -f segment -reset_timestamps 1 "${outputPattern}"`, { stdio: 'pipe' })

  const parts = []
  for (let i = 0; i < numParts; i++) {
    const partPath = join(MEDIA_DIR, `${baseName}_parte_${i}.mp4`)
    if (fs.existsSync(partPath)) {
      parts.push({
        path: partPath,
        name: `${title} - Parte ${i + 1} de ${numParts}.mp4`,
        caption: `🌸 *${title}*\n♡ Parte ${i + 1} de ${numParts}`
      })
    }
  }

  return parts
}

export default {
  command: ['ytmp4doc','ytmp4'],
  tag: 'ytmp4doc',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de YouTube en MP4 (documento)',

  async execute(sock, msg, { from, args }) {
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

      let result = null
      try {
        result = await downloadVideoLarge(videoUrl)
      } catch {
        try {
          const { buffer, title: t } = await downloadVideo(videoUrl)
          result = {
            filePath: null,
            buffer,
            title: t || title,
            sizeMB: buffer.length / (1024 * 1024)
          }
        } catch {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
        }
      }

      title = result.title || title

      if (result.buffer) {
        await sock.sendMessage(from, {
          document: result.buffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
        return
      }

      const sizeMB = result.sizeMB

      if (sizeMB <= 400) {
        const buffer = fs.readFileSync(result.filePath)
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`
        }, { quoted: msg })
        fs.unlinkSync(result.filePath)
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
        return
      }

      const partes = splitVideo(result.filePath, title, sizeMB)
      
      await sock.sendMessage(from, {
        text: `🌸 Este video pesa *${sizeMB.toFixed(0)} MB*, lo enviaré en *${partes.length} partes*.`
      }, { quoted: msg })

      for (const parte of partes) {
        const buffer = fs.readFileSync(parte.path)
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: parte.name
        }, { quoted: msg })
        fs.unlinkSync(parte.path)
      }

      if (result.filePath && fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath)
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[ytmp4doc] Error:', err.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    } finally {
      descargando.delete(userId)
    }
  }
}