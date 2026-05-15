// plugins/play2.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)
const MEDIA_DIR = join(process.cwd(), 'media')
const FFMPEG = ffmpegPath
const descargando = new Set()

if (!existsSync(MEDIA_DIR)) {
  await mkdir(MEDIA_DIR, { recursive: true }).catch(() => {})
}

async function getApiKey() {
  return axios.get('https://cnv.cx/v2/sanity/key', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*',
      'Referer': 'https://iframe.y2meta-uk.com/',
      'Origin': 'https://iframe.y2meta-uk.com'
    }
  }).then(r => r.data.key)
}

export default {
  command: ['ytmp4'],
  tag: 'ytmp4',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de YouTube en MP4 (rápido)',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 Pásame la URL del video de YouTube que quieres descargar.'
      }, { quoted: msg })
    }

    const videoUrl = args[0]

    if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
      return sock.sendMessage(from, {
        text: '🌸 Eso no parece un enlace de YouTube, corazón.'
      }, { quoted: msg })
    }

    const userId = msg.key.participant || msg.key.remoteJid

    if (descargando.has(userId)) {
      return sock.sendMessage(from, {
        text: '🌸 Espera a que termine tu descarga actual antes de pedir otra.'
      }, { quoted: msg })
    }

    descargando.add(userId)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const apiKey = await getApiKey()

      const params = new URLSearchParams({
        link: videoUrl,
        format: 'mp4',
        audioBitrate: '128',
        videoQuality: '360',
        filenameStyle: 'pretty',
        vCodec: 'h264'
      })

      const convRes = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'key': apiKey,
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://iframe.y2meta-uk.com',
          'Referer': 'https://iframe.y2meta-uk.com/'
        }
      })

      if (convRes.data?.status !== 'tunnel' || !convRes.data?.url) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      const downloadUrl = convRes.data.url
      const fileName = convRes.data.filename || 'video.mp4'

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
        }
      })

      const rawBuffer = Buffer.from(fileRes.data)
      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.mp4`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}_out.mp4`)

      await writeFile(tmpInput, rawBuffer)

      await execFileAsync(FFMPEG, [
        '-i', tmpInput,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-y',
        tmpOutput
      ])

      const mp4Buffer = await readFile(tmpOutput)
      const sizeMB = mp4Buffer.length / (1024 * 1024)

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (sizeMB < 80) {
        await sock.sendMessage(from, { video: mp4Buffer, mimetype: 'video/mp4' }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: mp4Buffer,
          mimetype: 'video/mp4',
          fileName
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    } finally {
      descargando.delete(userId)
    }
  }
}