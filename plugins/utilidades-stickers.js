import { downloadMediaMessage } from '@whiskeysockets/baileys'
import { Sticker } from 'wa-sticker-formatter'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

export default {
  command:   ['sticker', 's'],
  tag:       'sticker',
  categoria: 'utilidad',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Convierte imágenes o videos a sticker',

  async execute(sock, msg, { from }) {
    const quoted       = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const isQuotedImage = quoted?.imageMessage
    const isQuotedVideo = quoted?.videoMessage
    const isDirectImage = msg.message?.imageMessage
    const isDirectVideo = msg.message?.videoMessage

    if (!isQuotedImage && !isDirectImage && !isQuotedVideo && !isDirectVideo) {
      return sock.sendMessage(from, {
        text: '✦ Responde a una imagen o video para convertirlo en sticker.\n\nVideos: máximo 7 segundos.'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      if (isQuotedImage || isDirectImage) {
        const sourceMsg = isQuotedImage ? { message: quoted } : { message: msg.message }
        const buffer    = await downloadMediaMessage(sourceMsg, 'buffer', {})
        const sticker   = new Sticker(buffer, {
          pack:    global.bot?.stickerPack   || '',
          author:  global.bot?.stickerAuthor || '',
          type:    'full',
          quality: 70
        })
        await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg })

      } else if (isQuotedVideo || isDirectVideo) {
        const sourceMsg = isQuotedVideo ? { message: quoted } : { message: msg.message }
        const buffer    = await downloadMediaMessage(sourceMsg, 'buffer', {})

        const tmpInput  = join(tmpdir(), `${Date.now()}_in.mp4`)
        const tmpOutput = join(tmpdir(), `${Date.now()}_out.webp`)

        await writeFile(tmpInput, buffer)

        await execFileAsync('ffmpeg', [
          '-i', tmpInput,
          '-t', '7',                    // máximo 7 segundos
          '-vf', 'fps=10,scale=320:320:force_original_aspect_ratio=decrease', // fps y resolución reducidos
          '-c:v', 'libwebp',
          '-lossless', '0',
          '-q:v', '30',                 // calidad más baja = menos peso
          '-preset', 'default',
          '-loop', '0',
          '-an',
          '-vsync', '0',
          tmpOutput
        ], { timeout: 30000 })

        const webpBuffer = await readFile(tmpOutput)
        const sticker    = new Sticker(webpBuffer, {
          pack:    global.bot?.stickerPack   || '',
          author:  global.bot?.stickerAuthor || '',
          type:    'full',
          quality: 50
        })
        await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg })

        await unlink(tmpInput).catch(() => {})
        await unlink(tmpOutput).catch(() => {})
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}