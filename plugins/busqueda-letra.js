// plugins/lyrics.js

import axios from 'axios'

export default {
  command: ['lyrics', 'letra'],
  tag: 'lyrics',
  categoria: 'busqueda',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca la letra de una canción',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, { text: global.messages.busquedaEmpty }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let artist, title, album, lyrics

      try {
        const { data } = await axios.post('https://panel.apinexus.fun/api/letras/buscar',
          { query },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': 'antbx21e5jhac'
            },
            timeout: 20000
          }
        )

        if (data?.success && data?.data?.letra) {
          artist = data.data.artista
          title = data.data.titulo
          album = data.data.album
          lyrics = data.data.letra
        }
      } catch {}

      if (!lyrics) {
        const { data } = await axios.get(
          `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(query)}`,
          { timeout: 20000 }
        )

        if (data?.success && data?.result?.lyrics) {
          artist = data.result.artist
          title = data.result.title
          album = data.result.album
          lyrics = data.result.lyrics
        }
      }

      if (!lyrics) {
        return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
      }

      let txt = `🎵 *${artist || 'Desconocido'}*\n`
      txt += `🎶 _${title || query}_\n`
      if (album) txt += `💿 ${album}\n`
      txt += `\n${lyrics}`

      await sock.sendMessage(from, { text: txt }, { quoted: msg })
      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}