// plugins/facebook.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

export default {
  command:   ['facebook', 'fb', 'fbdl'],
  tag:       'facebook',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Facebook*'
      }, { quoted: msg })
      return
    }

    const url = args[0]

    if (!url.includes('facebook.com') && !url.includes('fb.com') && !url.includes('fb.watch')) {
      await sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de Facebook*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.post('https://panel.apinexus.fun/api/facebook/descargar',
        { url },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'antbx21e5jhac'
          },
          timeout: 30000
        }
      )

      if (!data.success || !data.data) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se pudo descargar el video 🍃' }, { quoted: msg })
        return
      }

      const videoUrl = data.data.hd || data.data.sd
      if (!videoUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se encontró video en ese enlace 🍃' }, { quoted: msg })
        return
      }

      const titulo = data.data.titulo || 'Facebook'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 300000
      })
      const rawBuffer = Buffer.from(videoRes.data)

      // Convertir a MP4 sin re-encodeo (copia pura + faststart)
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

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = mp4Buffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        const sentMsg = await sock.sendMessage(from, {
          video: mp4Buffer,
          caption: `> ${titulo} 🍃`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      } else {
        const sentMsg = await sock.sendMessage(from, {
          document: mp4Buffer,
          mimetype: 'video/mp4',
          fileName: `${titulo.substring(0, 50)}.mp4`,
          caption: `> ${titulo} 🍃`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}