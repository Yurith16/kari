// plugins/spotify.js

import axios from 'axios'

export default {
  command: ['spotify', 'sp', 'song'],
  tag: 'spotify',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa el nombre de la canción o un enlace de Spotify*'
      }, { quoted: msg })
    }

    const input = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      let trackUrl = input

      // Buscar si no es link directo
      if (!input.includes('spotify.com')) {
        const { data: sData } = await axios.get(
          `https://api.delirius.store/search/spotify?q=${encodeURIComponent(input)}&limit=1`,
          { timeout: 10000 }
        )

        if (!sData.status || !sData.data?.length) {
          return sock.sendMessage(from, { text: '🌱 No se encontró la canción.' }, { quoted: msg })
        }

        trackUrl = sData.data[0].url
      }

      // Descargar
      const { data: dData } = await axios.get(
        `https://api-aswin-sparky.koyeb.app/api/downloader/spotify?url=${encodeURIComponent(trackUrl)}`,
        { timeout: 30000 }
      )

      if (!dData.status || !dData.data?.download) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar.' }, { quoted: msg })
      }

      const { title, artist, download, cover } = dData.data
      const finalTitle = title || 'Spotify'
      const finalArtist = artist || ''

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const audioRes = await axios.get(download, { responseType: 'arraybuffer', timeout: 60000 })
      const audioBuffer = Buffer.from(audioRes.data)

      if (audioBuffer.length / (1024 * 1024) > 50) {
        return sock.sendMessage(from, { text: '🌱 El audio es demasiado pesado.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const fileName = `${finalArtist} - ${finalTitle}.mp3`.replace(/[<>:"/\\|?*]/g, '')

      const docMsg = {
        document: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName
      }

      if (cover) {
        docMsg.contextInfo = {
          externalAdReply: {
            title: finalTitle,
            body: finalArtist || 'Midori-Hana',
            thumbnailUrl: cover,
            sourceUrl: trackUrl,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }

      await sock.sendMessage(from, docMsg, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}