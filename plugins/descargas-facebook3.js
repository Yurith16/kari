// plugins/facebook.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

export default {
  command: ['facebook2', 'fb2'],
  tag: 'fb2',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de Facebook',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, { text: '🌸 Pásame el enlace del video de Facebook.' }, { quoted: msg })

    const url = args[0]

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      console.log('[fb] Buscando:', url)
      const { data } = await axios.get(`https://yosoyyo-api-ofc.onrender.com/api/facebook?url=${encodeURIComponent(url)}&apiKey=YJ-EspinoX`)
      console.log('[fb] Status:', data?.status, 'HD:', !!data?.result?.media?.video_hd, 'SD:', !!data?.result?.media?.video_sd)

      if (!data?.result?.media?.video_hd && !data?.result?.media?.video_sd) {
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      const videoUrl = data.result.media.video_hd || data.result.media.video_sd
      const title = data.result.info?.title || 'Facebook'
      console.log('[fb] Video:', title)
      console.log('[fb] URL:', videoUrl?.slice(0, 80))

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      console.log('[fb] Descargando...')
      const fileRes = await axios.get(videoUrl, { responseType: 'arraybuffer' })
      const rawBuffer = Buffer.from(fileRes.data)
      console.log('[fb] Descargado:', (rawBuffer.length / (1024 * 1024)).toFixed(2), 'MB')

      const tmpInput = join(tmpdir(), `${Date.now()}_in.mp4`)
      const tmpOutput = join(tmpdir(), `${Date.now()}_out.mp4`)

      await writeFile(tmpInput, rawBuffer)
      console.log('[fb] Procesando con ffmpeg...')

      await execFileAsync(ffmpegPath, ['-i', tmpInput, '-c', 'copy', '-movflags', '+faststart', '-y', tmpOutput])

      const buffer = await readFile(tmpOutput)
      const sizeMB = buffer.length / (1024 * 1024)
      console.log('[fb] Final:', sizeMB.toFixed(2), 'MB')

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (sizeMB < 50) {
        console.log('[fb] Enviando como video')
        await sock.sendMessage(from, { video: buffer, mimetype: 'video/mp4' }, { quoted: msg })
      } else {
        console.log('[fb] Enviando como documento')
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })
      console.log('[fb] ✅ Listo!')

    } catch (err) {
      console.error('[fb] ❌ Error:', err.message)
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}