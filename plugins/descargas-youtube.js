// plugins/yt.js

import axios from 'axios'

const qualityvideo = ['144', '240', '360', '720', '1080']
const qualityaudio = ['96', '128', '256', '320']

function convertid(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function mapaudioquality(bitrate) {
  if (bitrate == 320) return 0
  if (bitrate == 256) return 1
  if (bitrate == 128) return 4
  if (bitrate == 96) return 5
  return 0 // 320 por defecto
}

async function request(url, data) {
  return axios.post(url, data, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      'Content-Type': 'application/json',
      origin: 'https://cnvmp3.com',
      referer: 'https://cnvmp3.com/v54'
    },
    timeout: 120000 // aumentado para videos largos
  })
}

async function cnvmp3(yturl, quality, format = 'mp3') {
  const youtube_id = convertid(yturl)
  if (!youtube_id) throw new Error('URL de YouTube inválida')

  const formatValue = format === 'mp4' ? 0 : 1
  let finalQuality

  if (formatValue === 0) {
    if (!qualityvideo.includes(String(quality))) throw new Error(`Calidad MP4 inválida. Usa: ${qualityvideo.join(', ')}`)
    finalQuality = parseInt(quality)
  } else {
    if (!qualityaudio.includes(String(quality))) throw new Error(`Calidad MP3 inválida. Usa: ${qualityaudio.join(', ')}`)
    finalQuality = mapaudioquality(parseInt(quality))
  }

  const check = await request('https://cnvmp3.com/check_database.php',
    { youtube_id, quality: finalQuality, formatValue })

  if (check.data?.success) {
    return {
      title: check.data.data.title,
      download: check.data.data.server_path
    }
  }

  const yturlfull = `https://www.youtube.com/watch?v=${youtube_id}`

  const viddata = await request('https://cnvmp3.com/get_video_data.php',
    { url: yturlfull, token: '1234' })

  if (viddata.data.error) throw new Error(viddata.data.error)
  const title = viddata.data.title

  const download = await request('https://cnvmp3.com/download_video_ucep.php',
    { url: yturlfull, quality: finalQuality, title, formatValue })

  if (download.data.error) throw new Error(download.data.error)

  const finalLink = download.data.download_link

  await request('https://cnvmp3.com/insert_to_database.php',
    { youtube_id, server_path: finalLink, quality: finalQuality, title, formatValue }).catch(() => {})

  return { title, download: finalLink }
}

export default {
  command:   ['mp3', 'mp4'],
  tag:       'yt',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args, prefix }) {
    const usedCommand = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const cmd = usedCommand.split(' ')[0].slice(prefix.length).toLowerCase()
    const isVideo = cmd === 'mp4'
    const format = isVideo ? 'mp4' : 'mp3'

    const url = args[0]
    // Audio: siempre 320 (máxima calidad) | Video: 360 por defecto
    const qualityArg = isVideo ? (args[1] || '360') : '320'

    if (!url) {
      return sock.sendMessage(from, {
        text: `🌱 *Ingresa una URL de YouTube*\n\nEjemplo: *.mp3 https://youtu.be/xxx*\n*.mp4 https://youtu.be/xxx 720*`
      }, { quoted: msg })
    }

    if (!convertid(url)) {
      return sock.sendMessage(from, { text: '🌱 *URL de YouTube inválida.*' }, { quoted: msg })
    }

    const calidad = isVideo
      ? (qualityvideo.includes(String(qualityArg)) ? qualityArg : '360')
      : '320' // Audio siempre máxima

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const result = await cnvmp3(url, calidad, format)

      if (!result?.download) throw new Error('No se obtuvo enlace de descarga')

      const titulo = result.title || 'Sin título'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const fileRes = await axios.get(result.download, {
        responseType: 'arraybuffer',
        timeout: 600000, // 10 minutos para videos muy largos
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
          referer: 'https://cnvmp3.com/'
        }
      })

      const buffer = Buffer.from(fileRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      if (format === 'mp3') {
        const sizeMB = buffer.length / (1024 * 1024)
        if (sizeMB < 15) {
          const sentMsg = await sock.sendMessage(from, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${titulo}.mp3`,
            ptt: false
          }, { quoted: msg })
          await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
        } else {
          const sentMsg = await sock.sendMessage(from, {
            document: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${titulo}.mp3`,
            caption: `> ${titulo}\n> 320kbps 🍃`
          }, { quoted: msg })
          await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
        }
      } else {
        const sizeMB = buffer.length / (1024 * 1024)
        if (sizeMB < 50) {
          const sentMsg = await sock.sendMessage(from, {
            video: buffer,
            mimetype: 'video/mp4',
            caption: `> ${titulo} 🍃`
          }, { quoted: msg })
          await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
        } else {
          const sentMsg = await sock.sendMessage(from, {
            document: buffer,
            mimetype: 'video/mp4',
            fileName: `${titulo}.mp4`,
            caption: `> ${titulo} 🍃`
          }, { quoted: msg })
          await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[YT] Error:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}