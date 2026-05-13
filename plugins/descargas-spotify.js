// plugins/spotify.js

import axios from 'axios'
import { getBotSignature } from '../utils/formatters.js'

const API_KEY = 'antbx21e5jhac'

export default {
  command: ['spotify', 'sp'],
  tag: 'spotify',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y descarga música de Spotify',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué canción buscas en Spotify? Dime el nombre o el artista.'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      // Buscar en Spotify
      const { data: search } = await axios.post('https://panel.apinexus.fun/api/spotify/buscar', {
        query
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      })

      if (!search.success || !search.data?.length) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
      }

      const track = search.data[0]
      const signature = getBotSignature(global.bot)

      // Enviar portada con diseño
      const caption = 
`  · · ─────── ·🌸· ─────── · ·
  ⊱ *_${track.titulo}_* ⊰
  ♡ *Artista:* _${track.artista}_
  ♡ *Enlace:* _${track.link}_
  · · ─────── ·🌸· ─────── · ·
     ${signature}`

      await sock.sendMessage(from, {
        image: { url: track.imagen },
        caption
      }, { quoted: msg })

      // Descargar el audio
      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const { data: download } = await axios.post('https://panel.apinexus.fun/api/spotify/descargar', {
        query: `${track.artista} ${track.titulo}`
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      })

      if (!download.success || !download.data?.audio) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      const audioRes = await axios.get(download.data.audio, {
        responseType: 'arraybuffer',
        timeout: 120000
      })

      const audioBuffer = Buffer.from(audioRes.data)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        document: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${track.artista} - ${track.titulo}.mp3`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}