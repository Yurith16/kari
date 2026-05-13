import axios from 'axios'
import ytSearch from 'yt-search'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { getVideo } from '../utils/video-api.js'
import { getBotSignature } from '../utils/formatters.js'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)
const VIDEO_QUALITIES = ['144', '240', '360', '480', '720', '1080']
const MEDIA_DIR = join(process.cwd(), 'media')
const FFMPEG = ffmpegPath

if (!existsSync(MEDIA_DIR)) {
  await mkdir(MEDIA_DIR, { recursive: true }).catch(() => {})
}

export default {
  command: ['play2', 'ytmp4'],
  tag: 'play2',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de YouTube en MP4',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué video quieres que busque? Dime el nombre o pásame el enlace.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoId, title, author, duration, views, ago, videoUrl, thumbnail, videoQuality = '360'

      if (isUrl) {
        const parts = query.split(' ')
        const urlPart = parts[0]
        const match = urlPart.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)
        videoId = match ? match[1] : null
        if (!videoId) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
        videoUrl = urlPart
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        const qualityPart = parts[1]
        if (qualityPart && VIDEO_QUALITIES.includes(qualityPart)) {
          videoQuality = qualityPart
        }
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
        const lastArg = args[args.length - 1]
        if (lastArg && VIDEO_QUALITIES.includes(lastArg)) {
          videoQuality = lastArg
        }
      }

      if (!videoUrl.startsWith('http')) {
        videoUrl = `https://youtu.be/${videoId}`
      }

      console.log(`[play2] 📹 Video: ${title || 'URL directa'}`)

      const signature = `           ${getBotSignature(global.bot)}`

      const videoDetails = 
`  · · ─────── ·🌸· ─────── · ·
  ⊱ *_${title || 'Procesando...'}_* ⊰
  ♡ *Canal:* _${author?.name || 'YouTube'}_
  ❁ *Duración:* _${duration?.timestamp || '--:--'}_
  ✾ *Vistas:* _${(views || 0).toLocaleString()}_
  ✤ *Publicado:* _${ago || 'Reciente'}_
  ♡ *Calidad:* _${videoQuality}p_
  ♡ *Enlace:* _${videoUrl}_
  · · ─────── ·🌸· ─────── · ·
     ${signature}`

      await sock.sendMessage(from, {
        image: { url: thumbnail },
        caption: videoDetails
      }, { quoted: msg })

      let downloadUrl, fileName
      try {
        console.log(`[play2] 🔍 Probando APIs...`)
        const result = await getVideo(videoUrl)
        downloadUrl = result.url
        fileName = result.title ? `${result.title}.mp4` : 'video.mp4'
        if (result.quality) videoQuality = result.quality
        console.log(`[play2] ✅ API OK: ${result.quality}`)
      } catch (err) {
        console.log(`[play2] 🔄 Fallback a cnv.cx...`)
        
        const API_KEY = await axios.get('https://cnv.cx/v2/sanity/key', {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Referer': 'https://iframe.y2meta-uk.com/',
            'Origin': 'https://iframe.y2meta-uk.com'
          }
        }).then(r => r.data.key)

        const params = new URLSearchParams({
          link: videoUrl,
          format: 'mp4',
          audioBitrate: '128',
          videoQuality: videoQuality,
          filenameStyle: 'pretty',
          vCodec: 'h264'
        })

        const convRes = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'key': API_KEY,
            'User-Agent': 'Mozilla/5.0',
            'Origin': 'https://iframe.y2meta-uk.com',
            'Referer': 'https://iframe.y2meta-uk.com/'
          }
        })

        if (convRes.data?.status !== 'tunnel' || !convRes.data?.url) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
        }

        downloadUrl = convRes.data.url
        fileName = convRes.data.filename || 'video.mp4'
        console.log(`[play2] ✅ cnv.cx OK`)
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })
      console.log(`[play2] ⬇️ Descargando...`)

      // Descargar con axios (maneja cookies/headers)
      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
        }
      })

      const rawBuffer = Buffer.from(fileRes.data)
      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.mp4`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}_out.mp4`)

      await writeFile(tmpInput, rawBuffer)
      console.log(`[play2] 🔧 Procesando con ffmpeg...`)

      await execFileAsync(FFMPEG, [
        '-i', tmpInput,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-y',
        tmpOutput
      ])

      const mp4Buffer = await readFile(tmpOutput)
      const sizeMB = mp4Buffer.length / (1024 * 1024)
      console.log(`[play2] ✅ ${sizeMB.toFixed(2)} MB`)

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (sizeMB < 80) {
        await sock.sendMessage(from, { video: mp4Buffer, mimetype: 'video/mp4' }, { quoted: msg })
      } else {
        await sock.sendMessage(from, { document: mp4Buffer, mimetype: 'video/mp4', fileName }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })
      console.log(`[play2] ✅ Listo!`)

    } catch (err) {
      console.error(`[play2] ❌ Error:`, err.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}