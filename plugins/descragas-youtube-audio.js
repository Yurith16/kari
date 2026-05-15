// plugins/audio.js

import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)

export default {
  command: ['audio'],
  tag: 'audio',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y descarga audio de YouTube en documento',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, { text: '🌸 ¿Qué audio buscas?' }, { quoted: msg })

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const { data } = await axios.get(`https://yosoyyo-api-ofc.onrender.com/api/youtube?q=${encodeURIComponent(query)}&apiKey=YJ-EspinoX`)

      if (!data?.result?.length) return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })

      const elegido = data.result[0]

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const fileRes = await axios.get(elegido.download.mp3, { responseType: 'arraybuffer' })
      const rawBuffer = Buffer.from(fileRes.data)

      const tmpInput = join(tmpdir(), `${Date.now()}_in.mp3`)
      const tmpOutput = join(tmpdir(), `${Date.now()}_out.mp3`)

      await writeFile(tmpInput, rawBuffer)

      // Convertir a MP3 real
      await execFileAsync(ffmpegPath, [
        '-i', tmpInput,
        '-codec:a', 'libmp3lame',
        '-b:a', '128k',
        '-q:a', '2',
        '-y',
        tmpOutput
      ])

      const buffer = await readFile(tmpOutput)

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        document: buffer,
        mimetype: 'audio/mpeg',
        fileName: `${elegido.title}.mp3`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch (err) {
      console.error('[audio] Error:', err.message)
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}