// plugins/shazam.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import acrcloud from 'acrcloud'
import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)

let acr = null

function getACR() {
  if (!acr) {
    acr = new acrcloud({
      host: 'identify-us-west-2.acrcloud.com',
      access_key: '4ee38e62e85515a47158aeb3d26fb741',
      access_secret: 'KZd3cUQoOYSmZQn1n5ACW5XSbqGlKLhg6G8S8EvJ'
    })
  }
  return acr
}

export default {
  command: ['shazam', 'whatsong', 'identify'],
  tag: 'shazam',
  categoria: 'utilidad',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Identifica una canción por audio',

  async execute(sock, msg, { from }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    // Detectar audio, video, documento multimedia
    const isAudio = msg.message?.audioMessage || quoted?.audioMessage
    const isVideo = msg.message?.videoMessage || quoted?.videoMessage
    const isDoc = msg.message?.documentMessage || quoted?.documentMessage
    const isMedia = isAudio || isVideo || isDoc

    if (!isMedia) {
      return sock.sendMessage(from, {
        text: '🌱 *Responde a un audio, video o documento de música para identificar la canción*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } })

      const sourceMsg = { message: msg.message?.documentMessage || msg.message?.videoMessage || msg.message?.audioMessage ? msg.message : quoted }
      let buffer = await downloadMediaMessage(sourceMsg, 'buffer', {})

      // Si es video o dura más de 2 min, extraer audio con ffmpeg y cortar
      if (isVideo || isDoc || buffer.length > 2 * 1024 * 1024) {
        const tmpInput = join(tmpdir(), `${Date.now()}_in.tmp`)
        const tmpOutput = join(tmpdir(), `${Date.now()}_out.m4a`)

        await writeFile(tmpInput, buffer)

        await execFileAsync('ffmpeg', [
          '-i', tmpInput,
          '-t', '120',
          '-c:a', 'aac',
          '-b:a', '64k',
          '-vn',
          '-y',
          tmpOutput
        ], { timeout: 20000 })

        buffer = await readFile(tmpOutput)

        await unlink(tmpInput).catch(() => {})
        await unlink(tmpOutput).catch(() => {})
      }

      // Limitar a 1MB para ACRCloud
      const MAX_SIZE = 1 * 1024 * 1024
      if (buffer.length > MAX_SIZE) {
        buffer = buffer.slice(0, MAX_SIZE)
      }

      const acrInstance = getACR()
      const result = await acrInstance.identify(buffer)

      if (result.status.code !== 0 || !result.metadata?.music?.length) {
        return sock.sendMessage(from, {
          text: '🌱 No se pudo identificar la canción.'
        }, { quoted: msg })
      }

      const song = result.metadata.music[0]
      const title = song.title || 'Desconocido'
      const artists = song.artists?.map(a => a.name).join(', ') || 'Desconocido'
      const album = song.album?.name || ''
      const genres = song.genres?.map(g => g.name).join(', ') || ''
      const releaseDate = song.release_date || ''

      let txt = `🌱 *Título:* ${title}\n`
      txt += `🌱 *Artista:* ${artists}\n`
      if (album) txt += `🌱 *Álbum:* ${album}\n`
      if (genres) txt += `🌱 *Género:* ${genres}\n`
      if (releaseDate) {
        const [year, month, day] = releaseDate.split('-')
        txt += `🌱 *Lanzamiento:* ${day}/${month}/${year}\n`
      }

      let coverUrl = null

      try {
        const ytQuery = `${title} ${song.artists?.[0]?.name || ''}`
        const { data: ytData } = await axios.get(
          `https://api.princetechn.com/api/search/yts?apikey=prince&query=${encodeURIComponent(ytQuery)}`,
          { timeout: 10000 }
        )
        if (ytData?.results?.[0]) {
          txt += `\n🌱 *Enlace:* ${ytData.results[0].url}`
          coverUrl = ytData.results[0].image
        }
      } catch {}

      if (coverUrl) {
        try {
          const imgRes = await axios.get(coverUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          })
          await sock.sendMessage(from, {
            image: Buffer.from(imgRes.data),
            caption: txt
          }, { quoted: msg })
        } catch {
          await sock.sendMessage(from, { text: txt }, { quoted: msg })
        }
      } else {
        await sock.sendMessage(from, { text: txt }, { quoted: msg })
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