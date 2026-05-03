// plugins/mp4.js

import axios from 'axios'
import yts from 'yt-search'

const qualityvideo = ['144', '240', '360', '480', '720', '1080', '1440', '2160']

function convertid(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/
  const match = url.match(regex)
  return match ? match[1] : null
}

async function request(url, data) {
  return axios.post(url, data, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      'Content-Type': 'application/json',
      origin: 'https://cnvmp3.com',
      referer: 'https://cnvmp3.com/v54'
    },
    timeout: 120000
  })
}

async function cnvmp4(yturl, quality) {
  const youtube_id = convertid(yturl)
  if (!youtube_id) throw new Error('URL de YouTube inválida')

  const qualitiesToTry = [
    quality,
    '480',
    '360',
    '720',
    '240',
    '144'
  ].filter((q, i, arr) => arr.indexOf(q) === i)

  for (const q of qualitiesToTry) {
    if (!qualityvideo.includes(String(q))) continue
    const finalQuality = parseInt(q)

    try {
      const check = await request('https://cnvmp3.com/check_database.php',
        { youtube_id, quality: finalQuality, formatValue: 0 })

      if (check.data?.success) {
        return {
          title: check.data.data.title,
          download: check.data.data.server_path,
          quality: q
        }
      }
    } catch {}

    try {
      const yturlfull = `https://www.youtube.com/watch?v=${youtube_id}`

      const viddata = await request('https://cnvmp3.com/get_video_data.php',
        { url: yturlfull, token: '1234' })

      if (viddata.data?.duration && viddata.data.duration > 1800) {
        throw new Error('Video mayor a 30 minutos')
      }

      const title = viddata.data.title

      const download = await request('https://cnvmp3.com/download_video_ucep.php',
        { url: yturlfull, quality: finalQuality, title, formatValue: 0 })

      if (download.data?.error) continue

      const finalLink = download.data.download_link

      await request('https://cnvmp3.com/insert_to_database.php',
        { youtube_id, server_path: finalLink, quality: finalQuality, title, formatValue: 0 }).catch(() => {})

      return { title, download: finalLink, quality: q }
    } catch (e) {
      if (e.message === 'Video mayor a 30 minutos') throw e
      continue
    }
  }

  throw new Error('No se encontró calidad disponible')
}

export default {
  command:   'mp4',
  tag:       'mp4',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const isUrl = args[0] && /^https?:\/\//.test(args[0])
    const qualityArg = isUrl ? (args[1] || '480') : (args[0] || '480')

    if (!args.length) {
      return sock.sendMessage(from, {
        text: `🌱 *Ingresa el nombre del video o una URL de YouTube*\n\nEjemplo:\n*.mp4 la nueva y la ex 720*\n*.mp4 https://youtu.be/xxx 1080*\n\nCalidades: ${qualityvideo.join(', ')}`
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      let videoUrl

      if (isUrl) {
        videoUrl = args[0]
      } else {
        const search = await yts(args.join(' '))
        const video = search.videos?.[0]
        if (!video) {
          return sock.sendMessage(from, { text: '🌱 No se encontraron resultados.' }, { quoted: msg })
        }
        videoUrl = video.url
      }

      const result = await cnvmp4(videoUrl, qualityArg)

      if (!result?.download) throw new Error('No se obtuvo enlace de descarga')

      const titulo = result.title || 'Sin título'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const fileRes = await axios.get(result.download, {
        responseType: 'arraybuffer',
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
          referer: 'https://cnvmp3.com/'
        }
      })

      const buffer = Buffer.from(fileRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = buffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        const sentMsg = await sock.sendMessage(from, {
          video: buffer,
          mimetype: 'video/mp4',
          caption: `> ${titulo}\n> ${result.quality}p 🍃`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      } else {
        const sentMsg = await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: `${titulo}.mp4`,
          caption: `> ${titulo}\n> ${result.quality}p 🍃`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[MP4] Error:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      if (err.message === 'Video mayor a 30 minutos') {
        await sock.sendMessage(from, { text: '> ⏱️ *Este video dura más de 30 minutos, usa !play2 para videos largos.* 🍃' }, { quoted: msg })
      }
    }
  }
}