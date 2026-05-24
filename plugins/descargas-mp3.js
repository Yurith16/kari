// plugins/mp3.js

import axios from 'axios'
import ytSearch from 'yt-search'

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'

let cachedToken = null

async function getToken() {
  if (cachedToken) return cachedToken
  const { data } = await axios.get('https://eta.etacloud.org/api/v1/auth?_=' + Date.now(), {
    headers: { 'User-Agent': UA, 'Origin': 'https://v3.y2mate.nu', 'Referer': 'https://v3.y2mate.nu/' }
  })
  cachedToken = data.key
  return cachedToken
}

export default {
  command: ['mp3'],
  tag: 'mp3',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio de YouTube en MP3 (y2mate)',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, { 
      text: '🌸 Pásame el enlace del video de YouTube.'
    }, { quoted: msg })

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoUrl, title, thumbnail

      if (isUrl) {
        videoUrl = query
        if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
          return await sock.sendMessage(from, { text: '🌸 Eso no parece un enlace de YouTube, corazón.' }, { quoted: msg })
        }
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) {
          return await sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
        const video = search.videos[0]
        videoUrl = video.url
        title = video.title
        thumbnail = video.thumbnail
      }

      const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)?.[1]
      if (!videoId) return await sock.sendMessage(from, { text: '🌸 No pude extraer el ID del video.' }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const token = await getToken()

      // Init
      const initRes = await axios.get('https://eta.etacloud.org/api/v1/init?_=' + Date.now(), {
        headers: {
          'User-Agent': UA,
          'Authorization': `Bearer ${token}`,
          'Origin': 'https://v3.y2mate.nu',
          'Referer': 'https://v3.y2mate.nu/'
        }
      })

      let convertUrl = initRes.data.convertURL
      let result = null

      for (let i = 0; i < 15 && !result; i++) {
        await new Promise(r => setTimeout(r, 2000))

        const url = i === 0 ? `${convertUrl}&v=${videoId}&f=mp3` : convertUrl
        const convertRes = await axios.get(url, {
          headers: {
            'User-Agent': UA,
            'Origin': 'https://v3.y2mate.nu',
            'Referer': 'https://v3.y2mate.nu/'
          }
        })

        const data = convertRes.data
        if (data.downloadURL) { result = data; break }
        if (data.redirect === 1 && data.redirectURL) { convertUrl = data.redirectURL; continue }
        if (data.progressURL) {
          for (let j = 0; j < 15; j++) {
            await new Promise(r => setTimeout(r, 2000))
            const progRes = await axios.get(`${data.progressURL}&t=${Date.now()}`, {
              headers: {
                'User-Agent': UA,
                'Origin': 'https://v3.y2mate.nu',
                'Referer': 'https://v3.y2mate.nu/'
              }
            })
            if (progRes.data?.downloadURL) { result = progRes.data; break }
          }
          break
        }
      }

      if (!result?.downloadURL) {
        return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      // Descargar
      const fileRes = await axios.get(result.downloadURL, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA, 'Referer': 'https://v3.y2mate.nu/' },
        timeout: 120000
      })

      const buffer = Buffer.from(fileRes.data)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        document: buffer,
        mimetype: 'audio/mpeg',
        fileName: `${title || 'audio'}.mp3`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}