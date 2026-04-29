// plugins/play2.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

export default {
  command: ['ytmp3'],
  tag: 'ytmp3',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el nombre de la canción*'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const searchRes = await fetch(`https://api.princetechn.com/api/search/yts?apikey=prince&query=${encodeURIComponent(query)}`)
      const searchJson = await searchRes.json()

      if (!searchJson.success || !searchJson.results?.length) {
        return sock.sendMessage(from, { text: '🌱 No se encontraron resultados.' }, { quoted: msg })
      }

      const video = searchJson.results[0]
      const videoUrl = video.url

      const { data } = await axios.get(
        `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 30000 }
      )

      if (!data?.status || !data?.data?.audio) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el audio.' }, { quoted: msg })
      }

      const audioUrl = data.data.audio
      const title = data.data.title || video.title
      const channel = data.data.channel || video.author?.name

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