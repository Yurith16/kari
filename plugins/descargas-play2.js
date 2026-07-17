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
const descargaTimeouts = new Map()

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
        caption: `*${title}*\nParte ${i + 1} de ${numParts}`
      })
    }
  }

  return parts
}

export default {
  command: ['ytmp4doc', 'play2', 'mp4', 'ytmp4'],
  tag: 'play2',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de YouTube en MP4',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '¿Y se supone que tengo que adivinar qué video quieres o qué? Pásame el nombre o el enlace y dejo de hacerte esperar.'
      }, { quoted: msg })
    }

    const userId = msg.key.participant || msg.key.remoteJid

    if (descargando.has(userId)) {
      return sock.sendMessage(from, {
        text: 'Todavía estoy con tu descarga anterior, no me hagas trabajar el doble. Espera un momento.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    descargando.add(userId)
    
    // Timeout de seguridad: 10 minutos máximo por descarga
    const timeout = setTimeout(() => {
      descargando.delete(userId)
    }, 600000)
    descargaTimeouts.set(userId, timeout)

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
        
        // Verificar duración máxima (5 horas = 18000 segundos)
        const durSecs = video.duration?.seconds || 0
        if (durSecs > 18000) {
          await sock.sendMessage(from, {
            text: 'Ese video dura más de 5 horas. Ni yo que soy un bot me atrevo a descargar algo tan largo, busca algo más razonable.'
          }, { quoted: msg })
          return
        }
        
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

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

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
          await sock.sendMessage(from, {
            text: 'No pude descargar eso, y no es por falta de ganas. Probé todo lo que tenía y nada funcionó.'
          }, { quoted: msg })
          return
        }
      }

      title = result.title || title
      const sizeMB = result.sizeMB || (result.buffer ? result.buffer.length / (1024 * 1024) : 0)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      // Si es buffer y pesa menos de 100MB, enviar como video
      if (result.buffer) {
        if (sizeMB <= 100) {
          await sock.sendMessage(from, {
            video: result.buffer,
            caption: `*${title}*`
          }, { quoted: msg })
        } else {
          await sock.sendMessage(from, {
            document: result.buffer,
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`,
            caption: `*${title}*\nEl video pesa más de 100MB, así que te lo paso como documento. No es lo ideal, pero es lo que hay.`
          }, { quoted: msg })
        }
        await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })
        return
      }

      // Si tiene filePath
      if (sizeMB <= 100) {
        const buffer = fs.readFileSync(result.filePath)
        await sock.sendMessage(from, {
          video: buffer,
          caption: `*${title}*`
        }, { quoted: msg })
        fs.unlinkSync(result.filePath)
        await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })
        return
      }

      if (sizeMB <= 400) {
        const buffer = fs.readFileSync(result.filePath)
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption: `*${title}*\nEl video pesa más de 100MB, así que te lo paso como documento. No es lo ideal, pero es lo que hay.`
        }, { quoted: msg })
        fs.unlinkSync(result.filePath)
        await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })
        return
      }

      // Videos muy pesados: dividir en partes
      const partes = splitVideo(result.filePath, title, sizeMB)

      await sock.sendMessage(from, {
        text: `El video pesa *${sizeMB.toFixed(0)} MB*, lo voy a dividir en *${partes.length} partes* porque no pienso enviarlo de golpe.`
      }, { quoted: msg })

      for (const parte of partes) {
        const buffer = fs.readFileSync(parte.path)
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: parte.name,
          caption: parte.caption
        }, { quoted: msg })
        fs.unlinkSync(parte.path)
      }

      if (result.filePath && fs.existsSync(result.filePath)) {
        fs.unlinkSync(result.filePath)
      }

      await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })

    } catch {
      await sock.sendMessage(from, {
        text: 'No pude descargar eso, y no es por falta de ganas. Probé todo lo que tenía y nada funcionó.'
      }, { quoted: msg })
    } finally {
      clearTimeout(descargaTimeouts.get(userId))
      descargaTimeouts.delete(userId)
      descargando.delete(userId)
    }
  }
}