// plugins/pinterestdl.js

import axios from 'axios'

async function downloadPinterest(url) {
  const pageRes = await axios.get('https://convertico.com/es/descargador-de-Pinterest/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0'
    },
    timeout: 15000
  })

  const cookies = pageRes.headers['set-cookie'] || []
  const cookieStr = cookies.map(c => c.split(';')[0]).join('; ')

  const html = pageRes.data
  const tMatch = html.match(/t:\s*['"](\d+)['"]/)
  const hMatch = html.match(/h:\s*['"]([a-f0-9]+)['"]/)

  if (!tMatch || !hMatch) throw new Error('No se pudieron obtener los tokens de sesión')

  const t = tMatch[1]
  const h = hMatch[1]

  const { data } = await axios.post(
    'https://convertico.com/es/descargador-de-Pinterest/process.php',
    { url, t, h },
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0',
        'Origin': 'https://convertico.com',
        'Referer': 'https://convertico.com/es/descargador-de-Pinterest/',
        'Cookie': cookieStr
      },
      timeout: 30000
    }
  )

  if (!data.success) throw new Error('No se pudo obtener el contenido')

  return {
    images: data.images || [],
    videos: data.videos || [],
    t,
    h,
    cookieStr
  }
}

async function downloadMedia(mediaUrl, t, h, cookieStr) {
  const downloadUrl = `https://convertico.com/es/descargador-de-Pinterest/process.php?download=${Buffer.from(mediaUrl).toString('base64')}&filename=pin&t=${t}&h=${h}`

  const response = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxRedirects: 5,
    headers: { 'Cookie': cookieStr }
  })

  return Buffer.from(response.data)
}

export default {
  command:   ['pinterestdl', 'pindl'],
  tag:       'pinterestdl',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Descarga imagenes y videos de pinterest',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Pinterest*\n\nEjemplo: *.pindl https://pin.it/vm3LEeeRU*'
      }, { quoted: msg })
    }

    const url = args[0]
    if (!url.includes('pin.it') && !url.includes('pinterest.com')) {
      return sock.sendMessage(from, { text: '🌱 *Ingresa una URL válida de Pinterest*' }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { images, videos, t, h, cookieStr } = await downloadPinterest(url)

      if (!images.length && !videos.length) {
        return sock.sendMessage(from, { text: '🌱 No se encontró contenido.' }, { quoted: msg })
      }

      if (videos.length) {
        const video = videos[0]
        await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })
        const videoBuffer = await downloadMedia(video.url, t, h, cookieStr)
        await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

        const sizeMB = videoBuffer.length / (1024 * 1024)
        if (sizeMB < 50) {
          await sock.sendMessage(from, { video: videoBuffer }, { quoted: msg })
        } else {
          await sock.sendMessage(from, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'pinterest.mp4'
          }, { quoted: msg })
        }
      } else if (images.length) {
        const bestImage = images.find(i => i.quality === 'Original') || images[0]
        await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })
        const imgBuffer = await downloadMedia(bestImage.url, t, h, cookieStr)
        await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })
        await sock.sendMessage(from, { image: imgBuffer }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🍃', key: msg.key } })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}