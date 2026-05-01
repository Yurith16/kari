// plugins/facebook.js

import axios from 'axios'

export default {
  command:   ['facebook', 'fb', 'fbdl'],
  tag:       'facebook',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Facebook*'
      }, { quoted: msg })
      return
    }

    const url = args[0]

    if (!url.includes('facebook.com') && !url.includes('fb.com') && !url.includes('fb.watch')) {
      await sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de Facebook*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se pudo descargar el video 🍃' }, { quoted: msg })
        return
      }

      const videoUrl = data.data.high || data.data.low
      if (!videoUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se encontró video en ese enlace 🍃' }, { quoted: msg })
        return
      }

      const titulo = data.data.title || 'Facebook'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const videoBuffer = Buffer.from(videoRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = videoBuffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        const sentMsg = await sock.sendMessage(from, {
          video: videoBuffer,
          caption: `> ${titulo} 🍃`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      } else {
        const sentMsg = await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${titulo}.mp4`,
          caption: `> ${titulo} 🍃`
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}