// plugins/shazam.js

import { downloadMediaMessage } from '@whiskeysockets/baileys'
import acrcloud from 'acrcloud'

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

  async execute(sock, msg, { from }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted || (!quoted.audioMessage && !quoted.videoMessage)) {
      return sock.sendMessage(from, {
        text: '🌱 *Responde a un audio o video para identificar la canción*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } })

      const fakeMsg = { message: quoted }
      let buffer = await downloadMediaMessage(fakeMsg, 'buffer', {})

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
      const releaseDate = song.release_date || ''

      let txt = `🌱 *Título:* ${title}\n`
      txt += `🌱 *Artista:* ${artists}\n`
      if (releaseDate) {
        const [year, month, day] = releaseDate.split('-')
        txt += `🌱 *Lanzamiento:* ${day}/${month}/${year}\n`
      }

      try {
        const ytQuery = `${title} ${song.artists?.[0]?.name || ''}`
        const ytRes = await fetch(`https://api.princetechn.com/api/search/yts?apikey=prince&query=${encodeURIComponent(ytQuery)}`)
        const ytData = await ytRes.json()
        if (ytData?.results?.[0]?.url) {
          txt += `\n${ytData.results[0].url}`
        }
      } catch {}

      await sock.sendMessage(from, { text: txt }, { quoted: msg })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}