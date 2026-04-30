// plugins/ytmp4.js

import yts from 'yt-search'
import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

export default {
  command: 'ytmp4',
  tag: 'ytmp4',
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

      let video, videoUrl

      if (isUrl) {
        videoUrl = query
      } else {
        const results = await yts(query)
        video = results.videos?.[0]

        if (!video) {
          return sock.sendMessage(from, { text: '🌱 No se encontraron resultados.' }, { quoted: msg })
        }

        videoUrl = video.url
      }

      // Mostrar detalles primero
      if (!isUrl && video) {
        const txt = `🌱 *Título:* ${video.title}\n` +
          `🌱 *Canal:* ${video.author?.name || 'Desconocido'}\n` +
          `🌱 *Duración:* ${video.duration?.timestamp || 'N/A'}\n` +
          `🌱 *Vistas:* ${(video.views || 0).toLocaleString()}\n` +
          `🌱 *Publicado:* ${video.ago || 'Reciente'}\n` +
          `🌱 *Enlace:* ${video.url}\n\n` +
          `⬇️ *Descargando...*`

        try {
          const imgRes = await axios.get(video.thumbnail || video.image, {
            responseType: 'arraybuffer',
            timeout: 10000
          })
          await sock.sendMessage(from, {
            image: Buffer.from(imgRes.data),
            caption: txt
          }, { quoted: msg })
        } catch {
          await sock.sendMessage(from, { text: txt }, { quoted: msg })
        }
      }

      const { data } = await axios.get(
        `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 30000 }
      )

      const info = data?.data
      if (!data?.status || !info) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el video.' }, { quoted: msg })
      }

      const downloadUrl = info.video
      if (!downloadUrl) {
        return sock.sendMessage(from, { text: '🌱 No se encontró video en 360p.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const rawBuffer = Buffer.from(videoRes.data)

      // Copia pura sin re-encodeo + faststart
      const tmpInput = join(tmpdir(), `${Date.now()}_in.mp4`)
      const tmpOutput = join(tmpdir(), `${Date.now()}_out.mp4`)

      await writeFile(tmpInput, rawBuffer)

      await execFileAsync('ffmpeg', [
        '-i', tmpInput,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-threads', '0',
        '-y',
        tmpOutput
      ])

      const mp4Buffer = await readFile(tmpOutput)

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      const sizeMB = mp4Buffer.length / (1024 * 1024)

      if (sizeMB > 500) {
        return sock.sendMessage(from, {
          text: `🌱 *El video pesa ${sizeMB.toFixed(1)} MB, excede el límite de 500 MB*`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const title = info.title || video?.title || 'video'
      const canal = info.channel || video?.author?.name || ''
      const fileName = `${title}.mp4`.replace(/[\\/:*?"<>|]/g, '')

      await sock.sendMessage(from, {
        document: mp4Buffer,
        mimetype: 'video/mp4',
        fileName,
        caption: `🌱 *${title}*\n${canal}`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}