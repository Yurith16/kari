import axios from 'axios'
import ytSearch from 'yt-search'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const execFileAsync = promisify(execFile)
const VIDEO_QUALITIES = ['144', '240', '360', '480', '720', '1080']
const MEDIA_DIR = join(process.cwd(), 'media')

if (!existsSync(MEDIA_DIR)) {
  await mkdir(MEDIA_DIR, { recursive: true }).catch(() => {})
}

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
  command: ['mp4', 'video', 'v'],
  tag: 'descargas',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: `✦ Ingresa el nombre o URL de YouTube.\n\nEjemplo: *.mp4 123 sofia reyes 720*\n\nCalidades: ${VIDEO_QUALITIES.join(', ')}`
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const API_KEY = await getApiKey()

      let videoId, title, thumbnail

      if (isUrl) {
        const parts = query.split(' ')
        const urlPart = parts[0]
        const match = urlPart.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)
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

      let videoQuality = '360'
      if (isUrl) {
        const qualityPart = query.split(' ')[1]
        if (qualityPart && VIDEO_QUALITIES.includes(qualityPart)) {
          videoQuality = qualityPart
        }
      } else {
        const lastArg = args[args.length - 1]
        if (lastArg && VIDEO_QUALITIES.includes(lastArg)) {
          videoQuality = lastArg
        }
      }

      const videoUrl = `https://youtu.be/${videoId}`

      if (!isUrl || title) {
        await sock.sendMessage(from, {
          image: { url: thumbnail },
          caption: `✦ *${title || 'Procesando...'}*\n✦ *Link:* ${videoUrl}\n✦ *Calidad:* ${videoQuality}p\n\n⬇️ *Descargando...*`
        }, { quoted: msg })
      }

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
      const fileName = convRes.data.filename || 'video.mp4'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 600000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
        }
      })

      const rawBuffer = Buffer.from(fileRes.data)
      const sizeMB = rawBuffer.length / (1024 * 1024)

      if (sizeMB > 600) {
        return sock.sendMessage(from, {
          text: `✦ El video pesa ${sizeMB.toFixed(0)} MB, excede el límite de 600 MB.`
        }, { quoted: msg })
      }

      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.mp4`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}_out.mp4`)

      await writeFile(tmpInput, rawBuffer)

      await execFileAsync('ffmpeg', [
        '-i', tmpInput,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-threads', '0',
        '-y',
        tmpOutput
      ])

      const mp4Buffer = await readFile(tmpOutput)

      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const caption = `✦ *${fileName}*\n✦ *Calidad:* ${videoQuality}p`

      if (mp4Buffer.length / (1024 * 1024) < 80) {
        await sock.sendMessage(from, {
          video: mp4Buffer,
          mimetype: 'video/mp4',
          caption: caption
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: mp4Buffer,
          mimetype: 'video/mp4',
          fileName: fileName,
          caption: caption
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[MP4] Error:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}