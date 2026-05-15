// plugins/play2.js

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
const sesiones = new Map()
const descargando = new Set()

function parsePeso(peso) {
  if (!peso) return 0
  const lower = peso.toLowerCase()
  const num = parseFloat(peso.replace(/[^0-9.]/g, '')) || 0
  
  if (lower.includes('gb')) return num * 1024
  if (lower.includes('mb')) return num
  if (lower.includes('kb')) return num / 1024
  return num
}

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
  command: ['play2'],
  tag: 'play2',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de YouTube en MP4 con calidad seleccionable',

  async onMessage(sock, msg, { from, text, userNum }) {
    if (!userNum) return

    const sesion = sesiones.get(userNum)
    if (!sesion) return

    const respuesta = text?.trim()
    if (!respuesta) return

    if (!/^\d+$/.test(respuesta)) return

    const idx = parseInt(respuesta) - 1
    if (isNaN(idx) || idx < 0 || idx >= sesion.videos.length) {
      await sock.sendMessage(from, {
        text: '🌸 Usa el numerito de la calidad que quieres, corazón. Ejemplo: *2*'
      }, { quoted: msg })
      return
    }

    const elegido = sesion.videos[idx]
    const urlLimpia = sesion.videoUrl.split('&')[0]
    sesiones.delete(userNum)

    if (descargando.has(userNum)) return
    descargando.add(userNum)

    try {
      await sock.sendMessage(from, {
        text: '🌸 Estoy descargando tu video, ya casi está.'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      let status = await postProxy(elegido.mediaUrl)
      let intentos = 0
      let estancado = 0

      while (status?.status !== 'completed' && intentos < 45) {
        await sleep(3000)
        const nuevo = await postProxy(elegido.mediaUrl)
        intentos++

        if (nuevo?.status === status?.status && nuevo?.percent === status?.percent) {
          estancado++
        } else {
          estancado = 0
        }

        if (estancado >= 5 && status?.status === 'queued') break
        status = nuevo
      }

      if (status?.status !== 'completed' || !status?.fileUrl) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, {
          text: `🌸 Este video no se dejó descargar. A veces los videos musicales se resisten. Pero no te preocupes, prueba con *.ytmp4*.\n\nAquí te dejo la URL lista:\n${urlLimpia}`
        }, { quoted: msg })
      }

      const fileRes = await axios.get(status.fileUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA }
      })

      const buffer = Buffer.from(fileRes.data)
      const sizeMB = buffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      const fileName = status.fileName || 'video.mp4'

      if (sizeMB < 80) {
        await sock.sendMessage(from, {
          video: buffer,
          mimetype: 'video/mp4'
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, {
        text: `🌸 No pude descargarlo. ¿Probamos con *.ytmp4*?\n\nAquí te dejo la URL lista:\n${urlLimpia}`
      }, { quoted: msg })
    } finally {
      descargando.delete(userNum)
    }
  },

  async execute(sock, msg, { from, args, sender }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué video quieres que busque? Dime el nombre o pásame el enlace.'
      }, { quoted: msg })
    }

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)

    const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
    const userNum = cleanNumber(selfJid)

    if (descargando.has(userNum)) {
      return sock.sendMessage(from, {
        text: '🌸 Espera a que termine tu descarga actual antes de pedir otra.'
      }, { quoted: msg })
    }

    let videoUrl, urlLimpia

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

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
      }

      urlLimpia = videoUrl.split('&')[0]

      const api = await postProxy(videoUrl)
      if (!api || api.status !== 'ok') {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, {
          text: `🌸 No encontré ese video. ¿Está bien el enlace? Si no, prueba con *.ytmp4*.\n\nAquí te dejo la URL:\n${urlLimpia}`
        }, { quoted: msg })
      }

      let videos = api.mediaItems.filter(m => m.type === 'Video')
      if (!videos.length) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, {
          text: `🌸 No encontré videos para descargar. Prueba con *.ytmp4*, ese no se rinde.\n\nAquí te dejo la URL:\n${urlLimpia}`
        }, { quoted: msg })
      }

      const duracionMin = parseDuracion(videos[0].mediaDuration)
      if (duracionMin > 60) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, {
          text: `🌸 Este video es muy largo, corazón, y el servidor no puede con tanto. Prueba con *.ytmp4*, ese es más rápido y no tiene límite.\n\nAquí te dejo la URL:\n${urlLimpia}`
        }, { quoted: msg })
      }

      const pesoMaximo = parsePeso(videos[0].mediaFileSize)

      if (pesoMaximo > 400) {
        videos = videos.filter(v => parsePeso(v.mediaFileSize) <= 400)
      }

      if (!videos.length) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, {
          text: `🌸 Todas las calidades pesan más de 400MB. Prueba con *.ytmp4*.\n\nAquí te dejo la URL:\n${urlLimpia}`
        }, { quoted: msg })
      }

      const signature = getBotSignature(global.bot)

      let txt = `  · · ─────── ·🌸· ─────── · ·\n`
      txt += `  ⊱ *_${api.title}_* ⊰\n\n`

      if (pesoMaximo > 400) {
        txt += `🌸 Este video es pesadito en alta calidad. Mejor te muestro las más ligeras:\n\n`
      } else {
        txt += `🌸 Estas son las calidades que encontré, dime cuál te gusta:\n\n`
      }

      videos.forEach((v, i) => {
        txt += `*${i + 1}.* ${v.mediaQuality} (${v.mediaRes}) — ${v.mediaFileSize}\n`
      })

      txt += `\n_Responde con el número de la opción._\n`
      txt += `  · · ─────── ·🌸· ─────── · ·\n`
      txt += `     ${signature}`

      await sock.sendMessage(from, {
        image: { url: api.imagePreviewUrl },
        caption: txt
      }, { quoted: msg })

      sesiones.set(userNum, { videos, videoUrl })

    } catch {
      await sock.sendMessage(from, {
        text: `🌸 No pude descargarlo. ¿Probamos con *.ytmp4*?\n\nAquí te dejo la URL lista:\n${urlLimpia}`
      }, { quoted: msg })
    }
  }
}