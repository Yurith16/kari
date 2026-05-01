// plugins/tomp3.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { spawn } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export default {
  command:   'tomp3',
  tag:       'tomp3',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    const isVideo = msg.message?.videoMessage || quoted?.videoMessage
    const isDoc = msg.message?.documentMessage || quoted?.documentMessage
    const isAudio = msg.message?.audioMessage || quoted?.audioMessage

    if (!isVideo && !isDoc && !isAudio) {
      return sock.sendMessage(from, {
        text: '🌱 *Responde a un video, documento o audio para extraer el audio en MP3*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const sourceMsg = msg.message?.videoMessage || msg.message?.documentMessage || msg.message?.audioMessage
        ? { message: msg.message }
        : { message: quoted }

      const msgProgress = await sock.sendMessage(from, {
        text: '> 🎵 *Extrayendo audio...* 0%'
      }, { quoted: msg })

      const buffer = await downloadMediaMessage(sourceMsg, 'buffer', {})
      if (!buffer) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el archivo.' }, { quoted: msg })
      }

      const tmpInput = join(tmpdir(), `${Date.now()}_in.tmp`)
      const tmpOutput = join(tmpdir(), `${Date.now()}_out.mp3`)
      await writeFile(tmpInput, buffer)

      // Duración total
      let duration = 0
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v', 'quiet', '-print_format', 'json', '-show_format', tmpInput
        ])
        duration = parseFloat(JSON.parse(stdout).format?.duration) || 0
      } catch {}

      // Conversión con progreso
      let lastSent = 0
      await new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-i', tmpInput, '-vn', '-c:a', 'libmp3lame',
          '-b:a', '192k', '-q:a', '0', '-map_metadata', '-1',
          '-threads', '0', '-y', tmpOutput
        ])

        ff.stderr.on('data', (d) => {
          const m = d.toString().match(/time=(\d+):(\d+):(\d+\.\d+)/)
          if (m && duration > 0) {
            const sec = +m[1] * 3600 + +m[2] * 60 + +m[3]
            const pct = Math.min(99, Math.floor((sec / duration) * 100))
            if (pct >= lastSent + 5) {
              lastSent = pct
              sock.sendMessage(from, {
                text: `> 🎵 *Extrayendo audio...* ${lastSent}%`,
                edit: msgProgress.key
              }).catch(() => {})
            }
          }
        })

        ff.on('close', (c) => c === 0 ? resolve() : reject(new Error(`exit ${c}`)))
      })

      // 100% y enviando
      await sock.sendMessage(from, {
        text: '> 📤 *Enviando audio...* 100%',
        edit: msgProgress.key
      }).catch(() => {})

      const mp3Buffer = await readFile(tmpOutput)
      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      const sizeMB = mp3Buffer.length / (1024 * 1024)

      if (sizeMB < 15) {
        // Audio nativo si pesa menos de 15MB
        await sock.sendMessage(from, {
          audio: mp3Buffer,
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: msg })
      } else {
        // Documento si es más pesado
        const finalSizeMB = sizeMB.toFixed(2)
        await sock.sendMessage(from, {
          document: mp3Buffer,
          mimetype: 'audio/mpeg',
          fileName: 'audio.mp3',
          caption: `> Audio extraído\n> ${finalSizeMB} MB 🍃`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🍃', key: msg.key } })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}