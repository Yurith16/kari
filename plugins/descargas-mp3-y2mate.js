import axios from 'axios'
import ytSearch from 'yt-search'

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
  command: ['play', 'ytmp3'],
  tag: 'play',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio de YouTube en MP3',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '✦ Ingresa el nombre o URL de YouTube.\n\nEjemplo: *.mp3 sofia reyes*'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const API_KEY = await getApiKey()

      let videoId, title, thumbnail

      if (isUrl) {
        const match = query.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)
        videoId = match ? match[1] : null
        if (!videoId) {
          return sock.sendMessage(from, { text: '✦ URL de YouTube inválida.' }, { quoted: msg })
        }
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) {
          return sock.sendMessage(from, { text: '✦ No se encontraron resultados.' }, { quoted: msg })
        }
        videoId = search.videos[0].videoId
        title = search.videos[0].title
        thumbnail = search.videos[0].thumbnail
      }

      const videoUrl = `https://youtu.be/${videoId}`

      // Enviando imagen con detalles (Diseño oficial)
      await sock.sendMessage(from, {
        image: { url: thumbnail },
        caption: `✦ *${title || 'Procesando...'}*\n✦ *Link:* ${videoUrl}\n\n⬇️ *Descargando MP3 (320kbps)...*`
      }, { quoted: msg })

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
        return sock.sendMessage(from, { text: '✦ No se pudo obtener el enlace de descarga.' }, { quoted: msg })
      }

      const downloadUrl = convRes.data.url
      const fileName = convRes.data.filename || 'audio.mp3'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 300000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })

      const buffer = Buffer.from(fileRes.data)
      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

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
          fileName: fileName,
          caption: `✦ *${fileName}*\n✦ 320kbps`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[MP3] Error:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}