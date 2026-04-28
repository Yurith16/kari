// plugins/facebook.js

import axios from 'axios'

export default {
  command: ['fb', 'facebook'],
  tag: 'Facebook',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Facebook*'
      }, { quoted: msg })
    }

    const url = args[0]

    if (!url.includes('facebook.com') && !url.includes('fb.com') && !url.includes('fb.watch')) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de Facebook*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el video.' }, { quoted: msg })
      }

      const videoUrl = data.data.high || data.data.low
      if (!videoUrl) {
        return sock.sendMessage(from, { text: '🌱 No se encontró video en ese enlace.' }, { quoted: msg })
      }

      const titulo = data.data.title || 'Facebook'

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await fetch(videoUrl)
      if (!videoRes.ok) throw new Error('Error al descargar buffer')
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = videoBuffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        // Video nativo
        await sock.sendMessage(from, {
          video: videoBuffer,
          caption: `🎬 *${titulo}*`
        }, { quoted: msg })
      } else {
        // Documento
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${titulo}.mp4`,
          caption: `🎬 *${titulo}*`
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