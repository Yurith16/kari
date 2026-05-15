// plugins/mp3.js

import axios from 'axios'
import ytSearch from 'yt-search'
import sharp from 'sharp'

const API_KEY = 'antbx21e5jhac'

export default {
  command: ['mp3'],
  tag: 'mp3',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio de YouTube en MP3',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, { text: '🌸 ¿Qué canción buscas?' }, { quoted: msg })

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoUrl, thumbnail

      if (isUrl) {
        videoUrl = query
        const match = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)
        thumbnail = match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        videoUrl = search.videos[0].url
        thumbnail = search.videos[0].thumbnail
      }

      const { data } = await axios.post('https://panel.apinexus.fun/api/youtube/v2/mp3', { url: videoUrl }, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY }
      })

      if (!data?.success) return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })

      // Descargar audio
      const audioRes = await axios.get(data.data.audio, { responseType: 'arraybuffer' })
      const audioBuffer = Buffer.from(audioRes.data)

      // Descargar y redimensionar miniatura
      let thumbBuffer = null
      if (thumbnail) {
        try {
          const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer' })
          thumbBuffer = await sharp(Buffer.from(thumbRes.data))
            .resize(320, 180)
            .jpeg({ quality: 70 })
            .toBuffer()
        } catch {}
      }

      await sock.sendMessage(from, {
        document: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${data.data.titulo || 'audio'}.mp3`,
        jpegThumbnail: thumbBuffer
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}