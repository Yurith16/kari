import ytSearch from 'yt-search'
import { getAudio } from '../utils/kar-api.js'
import { getBotSignature } from '../utils/formatters.js'
import axios from 'axios'

async function getApiKey() {
  const res = await axios.get('https://cnv.cx/v2/sanity/key', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
      'Accept': '*/*',
      'Referer': 'https://iframe.y2meta-uk.com/',
      'Origin': 'https://iframe.y2meta-uk.com'
    },
    timeout: 15000
  })
  return res.data.key
}

export default {
  command: ['ytmp3'],
  tag: 'ytmp3',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio de YouTube en MP3',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué canción quieres que busque? Dime el nombre o pásame el enlace.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoId, title, author, duration, views, ago, videoUrl, thumbnail

      if (isUrl) {
        const match = query.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)
        videoId = match ? match[1] : null
        if (!videoId) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
        videoUrl = query
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
        const video = search.videos[0]
        videoId = video.videoId
        title = video.title
        author = video.author
        duration = video.duration
        views = video.views
        ago = video.ago
        videoUrl = video.url
        thumbnail = video.thumbnail
      }

      // Enviar portada con todos los detalles
      const signature = `           ${getBotSignature(global.bot)}`

      const videoDetails = 
`  · · ─────── ·🌸· ─────── · ·
  ⊱ *_${title || 'Descargando...'}_* ⊰
  ♡ *Canal:* _${author?.name || 'YouTube'}_
  ❁ *Duración:* _${duration?.timestamp || '--:--'}_
  ✾ *Vistas:* _${(views || 0).toLocaleString()}_
  ✤ *Publicado:* _${ago || 'Reciente'}_
  ♡ *Enlace:* _${videoUrl}_
  · · ─────── ·🌸· ─────── · ·
     ${signature}`

      await sock.sendMessage(from, {
        image: { url: thumbnail },
        caption: videoDetails
      }, { quoted: msg })

      // Luego descargar el audio
      let downloadUrl, fileName
      try {
        const result = await getAudio(videoUrl)
        downloadUrl = result.url
        fileName = result.title ? `${result.title}.mp3` : 'audio.mp3'
      } catch {
        const API_KEY = await getApiKey()

        const params = new URLSearchParams({
          link: videoUrl,
          format: 'mp3',
          audioBitrate: '320',
          videoQuality: '720',
          filenameStyle: 'pretty',
          vCodec: 'h264'
        })

        const convRes = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'key': API_KEY,
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Origin': 'https://iframe.y2meta-uk.com',
            'Referer': 'https://iframe.y2meta-uk.com/'
          },
          timeout: 30000
        })

        if (convRes.data?.status !== 'tunnel' || !convRes.data?.url) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
        }

        downloadUrl = convRes.data.url
        fileName = convRes.data.filename || 'audio.mp3'
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 300000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })

      const buffer = Buffer.from(fileRes.data)
      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (buffer.length / (1024 * 1024) < 15) {
        await sock.sendMessage(from, {
          audio: buffer,
          mimetype: 'audio/mpeg',
          fileName: fileName
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'audio/mpeg',
          fileName: fileName
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}