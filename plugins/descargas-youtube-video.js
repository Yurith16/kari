// plugins/video.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

export default {
  command: ['video'],
  tag: 'video',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y descarga videos de YouTube en documento',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, { text: '🌸 ¿Qué video buscas?' }, { quoted: msg })

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      console.log('[video] Buscando:', query)
      const { data } = await axios.get(`https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(query)}&apiKey=YJ-EspinoX`)
      console.log('[video] Status:', data?.status, 'Resultados:', data?.result?.length)

      if (!data?.result?.length) return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })

      const elegido = data.result[0]
      console.log('[video] Elegido:', elegido.title)
      console.log('[video] MP4 URL:', elegido.download.mp4)

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      console.log('[video] Descargando...')
      const fileRes = await axios.get(elegido.download.mp4, { responseType: 'arraybuffer' })
      const rawBuffer = Buffer.from(fileRes.data)
      console.log('[video] Descargado:', (rawBuffer.length / (1024 * 1024)).toFixed(2), 'MB')

      const tmpInput = join(tmpdir(), `${Date.now()}_in.mp4`)
      const tmpOutput = join(tmpdir(), `${Date.now()}_out.mp4`)

      await writeFile(tmpInput, rawBuffer)
      console.log('[video] Procesando con ffmpeg...')

      await execFileAsync(ffmpegPath, ['-i', tmpInput, '-c', 'copy', '-movflags', '+faststart', '-y', tmpOutput])

      const buffer = await readFile(tmpOutput)
      const sizeMB = buffer.length / (1024 * 1024)
      console.log('[video] Final:', sizeMB.toFixed(2), 'MB')

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        document: buffer,
        mimetype: 'video/mp4',
        fileName: `${elegido.title}.mp4`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })
      console.log('[video] ✅ Listo!')

    } catch (err) {
      console.error('[video] ❌ Error:', err.message)
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}