// plugins/tiktok.js

import axios from 'axios'

export default {
  command: ['tiktok', 'tk', 'tt'],
  tag: 'Tiktok',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de TikTok*'
      }, { quoted: msg })
    }

    const url = args[0]

    if (!url.includes('tiktok.com') && !url.includes('vt.tiktok.com')) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de TikTok*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/tiktok?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar.' }, { quoted: msg })
      }

      const { video, author } = data.data
      const videoUrl = video

      if (!videoUrl) {
        return sock.sendMessage(from, { text: '🌱 No se encontró video.' }, { quoted: msg })
      }

      const autor = author?.nickname || author?.unique_id || ''

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await fetch(videoUrl)
      if (!videoRes.ok) throw new Error('Error al descargar buffer')
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = videoBuffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        await sock.sendMessage(from, {
          video: videoBuffer,
          caption: autor
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: 'tiktok.mp4',
          caption: autor
        }, { quoted: msg })
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}