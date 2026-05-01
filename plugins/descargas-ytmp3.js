// plugins/ytmp3.js

import yts from 'yt-search'
import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { getAudio } from '../utils/kar-api.js'

const execFileAsync = promisify(execFile)

const activeUsers = new Map()

function limpiarUrl(url) {
  return url
    .replace(/m\.youtube\.com|music\.youtube\.com|www\.youtube\.com|youtube\.com\/shorts|youtu\.be/, 'youtube.com/watch')
    .split('&feature=')[0]
    .split('?si=')[0]
}

export default {
  command:   'ytmp3',
  tag:       'ytmp3',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const userId = msg.key.participant || from

    if (activeUsers.has(userId)) return

    if (!args[0]) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, { text: '> Ups!! Olvidaste colocar el nombre bb 🤭' }, { quoted: msg })
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
        const search = await yts(input)
        const video = search.videos?.[0]
        if (!video) throw new Error('No encontrado')
        videoUrl = video.url
        searchData = video
      }

      let audioUrl = null
      let title = searchData?.title || 'audio'

      // Intentar primero con Nayan
      try {
        const { data } = await axios.get(
          `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoUrl)}`,
          { timeout: 30000 }
        )

        if (data?.status && data?.data?.audio) {
          audioUrl = data.data.audio
          title = data.data.title || title
        }
      } catch {}

      // Si Nayan falló, usar kar-api.js
      if (!audioUrl) {
        const result = await getAudio(videoUrl)
        if (result?.url) {
          audioUrl = result.url
          title = result.title || title
        }
      }

      if (!audioUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se pudo descargar el audio 🍃' }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const audioRes = await axios.get(audioUrl, {
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

      const finalSizeMB = (mp3Buffer.length / 1024 / 1024).toFixed(2)
      const cleanName = `${title.substring(0, 30).replace(/[<>:"/\\|?*]/g, '')}`

      const sentMsg = await sock.sendMessage(from, {
        document: mp3Buffer,
        mimetype: 'audio/mpeg',
        fileName: `${cleanName}.mp3`,
        caption: `> ${title}\n> ${finalSizeMB} MB 🍃`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('Error en ytmp3:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    } finally {
      activeUsers.delete(userId)
    }
  }
}