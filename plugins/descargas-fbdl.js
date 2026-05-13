// plugins/fbdl.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, statSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { getBotSignature } from '../utils/formatters.js'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)
const API_KEY = 'antbx21e5jhac'
const MEDIA_DIR = join(process.cwd(), 'media')

if (!existsSync(MEDIA_DIR)) {
  mkdirSync(MEDIA_DIR, { recursive: true })
}

export default {
  command: ['fbdl', 'fb'],
  tag: 'fbdl',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de Facebook',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 Pásame el enlace del video de Facebook que quieres descargar.'
      }, { quoted: msg })
    }

    const url = args[0]
    let localInput = null
    let localOutput = null

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const { data } = await axios.post('https://panel.apinexus.fun/api/facebook/descargar', {
        url
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        timeout: 30000
      })

      if (!data.success || !data.data) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      const { titulo, autor, duracion, miniatura, hd, sd } = data.data

      const duracionSeg = duracion || 0
      const duracionMin = duracionSeg / 60
      const videoUrl = duracionMin <= 30 ? (hd || sd) : (sd || hd)

      if (!videoUrl) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      if (miniatura) {
        const signature = getBotSignature(global.bot)
        let caption = 
`  · · ─────── ·🌸· ─────── · ·
  ⊱ *_${titulo || 'Facebook'}_* ⊰
  ♡ *Autor:* _${autor || 'Desconocido'}_`

        if (duracionSeg > 0) {
          const min = Math.floor(duracionMin)
          const seg = Math.floor(duracionSeg % 60)
          caption += `\n  ♡ *Duración:* _${min}:${seg.toString().padStart(2, '0')}_`
        }

        caption += `\n  · · ─────── ·🌸· ─────── · ·\n     ${signature}`

        await sock.sendMessage(from, {
          image: { url: miniatura },
          caption
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const videoRes = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 300000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0',
          'Referer': 'https://www.facebook.com/'
        }
      })

      const rawBuffer = Buffer.from(videoRes.data)

      const fileName = `fb_${Date.now()}.mp4`
      localInput = join(MEDIA_DIR, `in_${Date.now()}.mp4`)
      localOutput = join(MEDIA_DIR, fileName)

      writeFileSync(localInput, rawBuffer)

      await execFileAsync(ffmpegPath, [
        '-i', localInput,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-y',
        localOutput
      ])

      const stats = statSync(localOutput)
      const sizeMB = stats.size / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (sizeMB > 80) {
        await sock.sendMessage(from, {
          document: { url: localOutput },
          mimetype: 'video/mp4',
          fileName
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: { url: localOutput }
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    } finally {
      if (localInput && existsSync(localInput)) try { unlinkSync(localInput) } catch {}
      if (localOutput && existsSync(localOutput)) try { unlinkSync(localOutput) } catch {}
    }
  }
}