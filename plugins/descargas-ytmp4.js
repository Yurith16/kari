// plugins/ytmp4.js

import yts from 'yt-search'
import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { getVideo } from '../utils/video-api.js'

const execFileAsync = promisify(execFile)

const activeUsers = new Map()

function limpiarUrl(url) {
  return url
    .replace(/m\.youtube\.com|music\.youtube\.com|www\.youtube\.com|youtube\.com\/shorts|youtu\.be/, 'youtube.com/watch')
    .split('&feature=')[0]
    .split('?si=')[0]
}

export default {
  command:   'ytmp4',
  tag:       'ytmp4',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const userId = msg.key.participant || from

    if (activeUsers.has(userId)) return

    if (!args[0]) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, { text: '> ¿Qué video deseas descargar bb? 🤭' }, { quoted: msg })
      return
    }

    activeUsers.set(userId, true)
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      const input = args.join(' ')
      const isUrl = /^https?:\/\//.test(input)

      let videoUrl, searchData

      if (isUrl) {
        videoUrl = limpiarUrl(input)
      } else {
        const search = await yts(`${input} video`)
        const video = search.videos.find(v => v.type === 'video') || search.videos[0]
        if (!video) throw new Error('Video no encontrado')

        videoUrl = video.url
        searchData = video
      }

      let downloadUrl = null
      let title = searchData?.title || 'Video de YouTube'

      // Intentar primero con Nayan
      try {
        const { data } = await axios.get(
          `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoUrl)}`,
          { timeout: 30000 }
        )

        const info = data?.data
        if (data?.status && info?.video) {
          downloadUrl = info.video
          title = info.title || title
        }
      } catch {}

      // Si Nayan falló, usar video-api.js
      if (!downloadUrl) {
        const result = await getVideo(videoUrl)
        if (result?.url) {
          downloadUrl = result.url
          title = result.title || title
        }
      }

      if (!downloadUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se pudo descargar el video 🍃' }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const rawBuffer = Buffer.from(videoRes.data)

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

      if (sizeMB > 400) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: `> El video es demasiado pesado para enviarlo oíste 🫢` }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const botName = global.bot?.name || 'Midori-Hana'
      const cleanName = `${title.substring(0, 30).replace(/[<>:"/\\|?*]/g, '')} - ${botName}.mp4`

      const sentMsg = await sock.sendMessage(from, {
        document: mp4Buffer,
        mimetype: 'video/mp4',
        fileName: cleanName,
        caption: ` `
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('Error en ytmp4:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    } finally {
      activeUsers.delete(userId)
    }
  }
}