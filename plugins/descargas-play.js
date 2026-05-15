// plugins/play.js

import axios from 'axios'
import ytSearch from 'yt-search'
import { getBotSignature } from '../utils/formatters.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const BASE = 'https://app.ytdown.to'
const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0'

const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'X-Requested-With': 'XMLHttpRequest',
  'Origin': BASE,
  'Referer': BASE + '/en27/',
  'User-Agent': UA,
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const descargando = new Set()

function parseDuracion(duracion) {
  if (!duracion) return 0
  const partes = duracion.split(':').map(Number)
  if (partes.length === 3) return partes[0] * 60 + partes[1]
  if (partes.length === 2) return partes[0]
  return 0
}

async function postProxy(url) {
  const body = new URLSearchParams({ url }).toString()
  const { data } = await axios.post(`${BASE}/proxy.php`, body, { headers: HEADERS })
  return data?.api
}

export default {
  command: ['play'],
  tag: 'play',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio de YouTube en MP3',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué canción quieres que busque? Dime el nombre o pásame el enlace.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    const userId = msg.key.participant || msg.key.remoteJid

    if (descargando.has(userId)) {
      return sock.sendMessage(from, {
        text: '🌸 Espera a que termine tu descarga actual antes de pedir otra.'
      }, { quoted: msg })
    }

    descargando.add(userId)

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoUrl, title, thumbnail

      if (isUrl) {
        videoUrl = query
        if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
          return sock.sendMessage(from, {
            text: '🌸 Eso no parece un enlace de YouTube. ¿Me pasas uno correcto?'
          }, { quoted: msg })
        }
      } else {
        const search = await ytSearch(query)
        if (!search.videos?.length) {
          return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }
        videoUrl = search.videos[0].url
        title = search.videos[0].title
        thumbnail = search.videos[0].thumbnail
      }

      const api = await postProxy(videoUrl)
      if (!api || api.status !== 'ok') {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      title = title || api.title
      thumbnail = thumbnail || api.imagePreviewUrl

      const audios = api.mediaItems.filter(m => m.type === 'Audio' && m.mediaExtension === 'MP3')
      if (!audios.length) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      // Bloquear videos de más de 30 minutos
      const duracionMin = parseDuracion(audios[0].mediaDuration)
      if (duracionMin > 30) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, {
          text: '🌸 Este audio es muy largo, corazón. Solo puedo con videos de menos de media hora.'
        }, { quoted: msg })
      }

      const elegido = audios.find(a => a.mediaQuality === '128K') || audios[0]

      const signature = getBotSignature(global.bot)
      const caption = 
`  · · ─────── ·🌸· ─────── · ·
  ⊱ *_${title}_* ⊰
  ♡ *Calidad:* _${elegido.mediaQuality}_
  ♡ *Tamaño:* _${elegido.mediaFileSize}_
  · · ─────── ·🌸· ─────── · ·
     ${signature}`

      await sock.sendMessage(from, {
        image: { url: thumbnail },
        caption
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      let status = await postProxy(elegido.mediaUrl)
      let intentos = 0

      while (status?.status !== 'completed' && intentos < 3) {
        await sleep(3000)
        status = await postProxy(elegido.mediaUrl)
        intentos++
      }

      if (status?.status !== 'completed' || !status?.fileUrl) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      const fileRes = await axios.get(status.fileUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA }
      })

      const buffer = Buffer.from(fileRes.data)
      const sizeMB = buffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      const fileName = `${title || 'audio'}.mp3`

      if (sizeMB < 15) {
        await sock.sendMessage(from, {
          audio: buffer,
          mimetype: 'audio/mpeg'
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'audio/mpeg',
          fileName
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    } finally {
      descargando.delete(userId)
    }
  }
}