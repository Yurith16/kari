import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import ytSearch from 'yt-search'
import { getBotSignature } from '../utils/formatters.js'

const BASE = 'https://app.ytdown.to'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const sleep = ms => new Promise(r => setTimeout(r, ms))

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'x-requested-with': 'XMLHttpRequest',
  'Origin': BASE,
  'Referer': BASE + '/en23/',
}

async function postProxy(client, url) {
  const body = new URLSearchParams({ url }).toString()
  const { data } = await client.post(`${BASE}/proxy.php`, body, { headers: HEADERS })
  return (typeof data === 'object' ? data : JSON.parse(data))?.api
}

async function poll(client, workerUrl) {
  for (let i = 1; i <= 15; i++) {
    const api = await postProxy(client, workerUrl)
    if (api?.status === 'completed' && api.fileUrl) return api.fileUrl
    if (api?.status === 'error') throw new Error('Worker error')
    if (i < 15) await sleep(2500)
  }
  throw new Error('Tiempo agotado')
}

export default {
  command: ['ytmp3doc'],
  tag: 'ytmp3doc',
  categoria: 'descargas',
  descripcion: 'Descarga audios de YouTube en documento',
  owner: false,
  group: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, { text: '🌸 ¿Qué canción quieres que busque? Dime el nombre o pásame el enlace.' }, { quoted: msg })
      return
    }

    const query = args.join(' ')
    const isUrl = query.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoUrl = query
      let title, author, duration, views, ago, thumbnail

      if (!isUrl) {
        const search = await ytSearch(query)
        if (!search.videos.length) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return await sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
        const video = search.videos[0]
        videoUrl = video.url
        title = video.title
        author = video.author
        duration = video.duration
        views = video.views
        ago = video.ago
        thumbnail = video.thumbnail
      } else {
        const videoId = isUrl[0].split('v=')[1] || isUrl[0].split('/').pop()
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      }

      const jar = new CookieJar()
      const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { 'User-Agent': UA } }))
      await client.get(`${BASE}/`)

      const api = await postProxy(client, videoUrl)
      if (!api || api.status === 'error') throw new Error('API Error')

      title = title || api.title

      const signature = `           ${getBotSignature(global.bot)}`

      const videoDetails = 
`  · · ─────── ·🌸· ─────── · ·
  ⊱ *_${title || 'Procesando...'}_* ⊰
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

      let opciones = api.mediaItems.filter(m => m.mediaExtension?.toLowerCase() === 'mp3')
      if (!opciones.length) throw new Error('No MP3 found')

      let elegido = opciones[0]

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const downloadUrl = await poll(client, elegido.mediaUrl)
      const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
      const audioBuffer = Buffer.from(audioRes.data)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        document: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${title || 'audio'}.mp3`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}