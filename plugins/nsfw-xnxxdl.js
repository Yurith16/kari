// plugins/xnxxdl.js

import axios from 'axios'
import fs from 'fs'
import path from 'path'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
  'Referer': 'https://www.xnxx.com/',
  'DNT': '1',
  'Connection': 'keep-alive'
}

function extractHtml5Player(html, fnName) {
  const regex = new RegExp(`html5player\\.${fnName}\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`, 'i')
  const match = html.match(regex)
  return match ? match[1] : null
}

function decodeHtmlEntities(str) {
  if (!str) return str
  return str
    .replace(/&ntilde;/g, 'ñ').replace(/&Ntilde;/g, 'Ñ')
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&iexcl;/g, '¡').replace(/&iquest;/g, '¿')
}

async function scrapeXNXX(videoUrl) {
  if (!videoUrl || !videoUrl.includes('xnxx')) {
    throw new Error('URL inválida')
  }

  const response = await axios.get(videoUrl, { headers: HEADERS, timeout: 15000, maxRedirects: 5 })
  const html = response.data

  const title    = extractHtml5Player(html, 'setVideoTitle')
  const hlsUrl   = extractHtml5Player(html, 'setVideoHLS')
  const highUrl  = extractHtml5Player(html, 'setVideoUrlHigh')
  const lowUrl   = extractHtml5Player(html, 'setVideoUrlLow')
  const thumbUrl = extractHtml5Player(html, 'setThumbUrl')
  const duration = extractHtml5Player(html, 'setVideoDuration')

  if (!highUrl && !hlsUrl && !lowUrl) {
    throw new Error('No links')
  }

  return {
    title: decodeHtmlEntities(title ? decodeURIComponent(title.replace(/\+/g, ' ')) : 'Sin título'),
    thumbnail: thumbUrl || null,
    hls: hlsUrl || null,
    high: highUrl || null,
    low: lowUrl || null,
    duration: duration ? parseInt(duration) : null
  }
}

export default {
  command:     ['xnxxdl', 'xnxxdown', 'xnxxdescarga'],
  tag:         'xnxxdl',
  categoria:   'nsfw',
  owner:       false,
  group:       true,
  nsfw:        true,
  descripcion: 'Descarga videos de XNXX guardando localmente antes de enviar',

  async execute(sock, msg, { from, args, groupCfg }) {
    // Validación usando global.messages.nsfwDisabled
    if (!groupCfg?.nsfw) {
      await sock.sendMessage(from, { text: global.messages.nsfwDisabled }, { quoted: msg })
      return
    }

    // Validación si no pasa argumentos
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '🌸 Pásame un enlace válido de XNXX para que pueda buscarlo.'
      }, { quoted: msg })
      return
    }

    const videoUrl = args[0]
    // Asegurar y preparar los directorios locales
    const dirPath = path.join(process.cwd(), 'media', 'nsfw')
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const tempFilePath = path.join(dirPath, `${Date.now()}_xnxx.mp4`)

    try {
      await sock.sendMessage(from, { react: { text: '🔥', key: msg.key } })

      const data = await scrapeXNXX(videoUrl)
      const downloadLink = data.high || data.low

      if (!downloadLink) {
        await sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        return
      }

      // Descarga local del archivo de video vía stream
      const writer = fs.createWriteStream(tempFilePath)
      const downloadRes = await axios({
        url: downloadLink,
        method: 'GET',
        responseType: 'stream',
        headers: HEADERS
      })

      downloadRes.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      // Verificar el tamaño físico real del archivo descargado
      const stats = fs.statSync(tempFilePath)
      const sizeInMB = stats.size / (1024 * 1024)

      const caption = `🔞 *${data.title}*\n` +
        `✦ Duración: ${data.duration ? `${data.duration}s` : 'Desconocida'}`

      if (sizeInMB > 50) {
        // Enviar como documento si excede los 50MB
        await sock.sendMessage(from, {
          document: fs.readFileSync(tempFilePath),
          mimetype: 'video/mp4',
          fileName: `${data.title}.mp4`,
          caption: caption + `\n📦 *Nota:* Se envió como documento porque pesa más de 50MB.`
        }, { quoted: msg })
      } else {
        // Enviar como video estándar
        await sock.sendMessage(from, {
          video: fs.readFileSync(tempFilePath),
          caption: caption,
          gifPlayback: false
        }, { quoted: msg })
      }

      // Limpieza preventiva del almacenamiento del bot
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }

    } catch {
      // Limpieza en caso de error para evitar archivos temporales corruptos
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}