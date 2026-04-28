// plugins/sticker.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import sharp from 'sharp'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

export default {
  command: ['sticker', 's'],
  tag: 'sticker',
  categoria: 'utilidad',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const isMedia = msg.message?.imageMessage || msg.message?.videoMessage
    const isQuotedMedia = quoted?.imageMessage || quoted?.videoMessage
    const isQuotedSticker = quoted?.stickerMessage

    if (!isMedia && !isQuotedMedia && !isQuotedSticker) {
      return sock.sendMessage(from, {
        text: '🌱 *Responde a una imagen, video o sticker*\n\n.sticker --img → sticker a imagen'
      }, { quoted: msg })
    }

    if (isQuotedSticker && args.includes('--img')) {
      return exportStickerToImage(sock, msg, from)
    }

    const pack = global.bot?.stickerPack || ''
    const author = global.bot?.stickerAuthor || 'Midori-Hana'

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      let mediaBuffer
      let isVideo = false

      if (isMedia) {
        mediaBuffer = await downloadMediaMessage(msg, 'buffer', {})
        isVideo = !!msg.message?.videoMessage
      } else if (isQuotedMedia) {
        const fakeMsg = { message: quoted }
        mediaBuffer = await downloadMediaMessage(fakeMsg, 'buffer', {})
        isVideo = !!quoted?.videoMessage
      }

      if (!mediaBuffer) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el media.' }, { quoted: msg })
      }

      if (isVideo) {
        const tmpInput = join(tmpdir(), `${Date.now()}_in.mp4`)
        const tmpOutput = join(tmpdir(), `${Date.now()}_out.webp`)

        await writeFile(tmpInput, mediaBuffer)

        // Crop centrado para llenar todo el cuadrado sin bordes congelados
        await execFileAsync('ffmpeg', [
          '-i', tmpInput,
          '-t', '6',
          '-vf', 'fps=15,crop=min(iw\\,ih):min(iw\\,ih),scale=512:512',
          '-c:v', 'libwebp',
          '-lossless', '0',
          '-q:v', '60',
          '-preset', 'default',
          '-loop', '0',
          '-an',
          '-vsync', '0',
          tmpOutput
        ], { timeout: 30000 })

        const stickerBuffer = await readFile(tmpOutput)
        await unlink(tmpInput).catch(() => {})
        await unlink(tmpOutput).catch(() => {})

        await sock.sendMessage(from, {
          sticker: stickerBuffer,
          pack,
          author
        }, { quoted: msg })

      } else {
        const stickerBuffer = await sharp(mediaBuffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 100 })
          .toBuffer()

        await sock.sendMessage(from, {
          sticker: stickerBuffer,
          pack,
          author
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}

async function exportStickerToImage(sock, msg, from) {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const fakeMsg = { message: quoted }
    const downloaded = await downloadMediaMessage(fakeMsg, 'buffer', {})
    const pngBuffer = await sharp(downloaded).png().toBuffer()

    await sock.sendMessage(from, { image: pngBuffer }, { quoted: msg })
    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })
  } catch {
    await sock.sendMessage(from, {
      text: global.messages?.error || '⚠️ Error al convertir.'
    }, { quoted: msg })
  }
}