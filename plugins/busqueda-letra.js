import axios from 'axios'

export default {
  command:     ['lyrics', 'letra'],
  tag:         'lyrics',
  categoria:   'media',
  owner:       false,
  group:       false,
  descripcion: 'Busca la letra de una canción',

  async execute(sock, msg, { from, args }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('media'), key: msg.key } })

    if (!args.length) {
      await sock.sendMessage(from, { text: 'debes ingresar el nombre de una canción o artista.' }, { quoted: msg })
      return
    }

    const query = args.join(' ')

    try {
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
        try {
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
        } catch {}
      }

      if (!lyrics) {
        return sock.sendMessage(from, { text: 'no se encontró la letra de la canción.' }, { quoted: msg })
      }

      let txt = `> *${title || query}* — *${artist || 'desconocido'}*\n`
      if (album) txt += `_álbum: ${album}_\n`
      txt += `\n${lyrics}`

      await sock.sendMessage(from, { text: txt }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}