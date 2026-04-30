// plugins/play.js

import yts from 'yt-search'
import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

export default {
  command: 'play',
  tag: 'play',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el nombre de la canción o una URL de YouTube*'
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

      // Si no es URL, mostrar detalles primero
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

      if (!data?.status || !data?.data?.audio) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el audio.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const audioRes = await axios.get(data.data.audio, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const rawBuffer = Buffer.from(audioRes.data)

      const tmpInput = join(tmpdir(), `${Date.now()}_in.m4a`)
      const tmpOutput = join(tmpdir(), `${Date.now()}_out.mp3`)

      await writeFile(tmpInput, rawBuffer)

      await execFileAsync('ffmpeg', [
        '-i', tmpInput,
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        '-q:a', '0',
        '-map_metadata', '-1',
        '-threads', '0',
        '-y',
        tmpOutput
      ])

      const mp3Buffer = await readFile(tmpOutput)

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const title = data.data.title || video?.title || 'audio'
      const channel = data.data.channel || video?.author?.name || ''

      const fileName = `${title}.mp3`.replace(/[\\/:*?"<>|]/g, '')

      await sock.sendMessage(from, {
        document: mp3Buffer,
        mimetype: 'audio/mpeg',
        fileName,
        caption: `🌱 *${title}*\n${channel}`
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