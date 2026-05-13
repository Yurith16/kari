import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import axios from 'axios'
import { getBotSignature } from '../utils/formatters.js'
import { writeFile, unlink } from 'fs/promises'

const DOWNLOAD_DIR = join('media/tiktok')

if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true })

export default {
  command: ['tiktok', 'tt'],
  tag: 'tiktok',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de TikTok en calidad HD',

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, { text: '🌸 Pásame la URL del video de TikTok que quieres descargar.' }, { quoted: msg })

    const videoUrl = args[0]
    let localFilePath = null

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let titulo, autor, videoDl, thumbnail

      // Intentar API Apinexus primero
      try {
        const { data } = await axios.post('https://panel.apinexus.fun/api/tiktok/descargar', {
          url: videoUrl
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'antbx21e5jhac'
          }
        })

        if (data?.success && data?.data?.videoUrl) {
          titulo = data.data.titulo
          autor = data.data.autor
          videoDl = data.data.videoUrl
          thumbnail = data.data.thumbnail
        }
      } catch {}

      // Fallback a tikwm.com
      if (!videoDl) {
        const { data: json } = await axios.post('https://www.tikwm.com/api/', 
          new URLSearchParams({
            url: videoUrl,
            count: '12',
            cursor: '0',
            web: '1',
            hd: '1'
          }),
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0',
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest',
              'Origin': 'https://www.tikwm.com',
              'Referer': 'https://www.tikwm.com/es/'
            }
          }
        )

        if (json.code !== 0 || !json.data) throw new Error('Error API')

        titulo = json.data.title || ''
        autor = json.data.author?.nickname || ''
        videoDl = json.data.hdplay ? `https://www.tikwm.com${json.data.hdplay}` : `https://www.tikwm.com${json.data.play}`
        thumbnail = json.data.cover ? `https://www.tikwm.com${json.data.cover}` : null
      }

      if (!videoDl) throw new Error('No se pudo obtener el video')

      const signature = getBotSignature(global.bot)

      if (thumbnail) {
        const caption = 
`  · · ────── ·🌸· ────── · ·
  ⊱ *_TikTok_* ⊰
  ♡ *Título:* _${titulo || 'Sin título'}_
  ♡ *Autor:* _${autor || 'Desconocido'}_
  · · ────── ·🌸· ────── · ·
     ${signature}`

        await sock.sendMessage(from, {
          image: { url: thumbnail },
          caption
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      // Descargar con axios
      const videoRes = await axios.get(videoDl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0'
        }
      })

      const videoBuffer = Buffer.from(videoRes.data)
      const sizeMB = videoBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (sizeMB > 80) {
        const fileName = `tiktok_${Date.now()}.mp4`
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: videoBuffer
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch (e) {
      console.error('Error TikTok:', e.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    } finally {
      if (localFilePath && existsSync(localFilePath)) try { unlinkSync(localFilePath) } catch {}
    }
  }
}