import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import ytSearch from 'yt-search'

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
  command: ['mp4'],
  tag: 'mp4',
  categoria: 'descargas',
  descripcion: 'Descarga videos de YouTube en MP4',
  owner: false,
  group: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, { text: '✦ Ingresa el nombre o URL de un video de YouTube.' }, { quoted: msg })
      return
    }

    const query = args.join(' ')
    const isUrl = query.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/)

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      let videoUrl = query
      let title, thumbnail

      if (!isUrl) {
        const search = await ytSearch(query)
        if (!search.videos.length) return await sock.sendMessage(from, { text: '✦ No se encontraron resultados.' }, { quoted: msg })
        videoUrl = search.videos[0].url
        title = search.videos[0].title
        thumbnail = search.videos[0].thumbnail
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

      await sock.sendMessage(from, {
        image: { url: thumbnail },
        caption: `✦ *${title}*\n\nProcesando pedido...`
      }, { quoted: msg })

      let opciones = api.mediaItems.filter(m => m.mediaExtension?.toLowerCase() === 'mp4')
      if (!opciones.length) throw new Error('No MP4 found')

      let elegido = opciones.find(m => String(m.mediaRes).includes('360')) || 
                    opciones.find(m => String(m.mediaRes).includes('480')) || 
                    opciones[0]

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const downloadUrl = await poll(client, elegido.mediaUrl)
      const videoRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
      const videoBuffer = Buffer.from(videoRes.data)
      const sizeMB = videoBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      if (sizeMB > 80) {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${title.slice(0, 30)}.mp4`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: videoBuffer
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages?.error || '✦ Hubo un problema con la descarga.' }, { quoted: msg })
    }
  }
}