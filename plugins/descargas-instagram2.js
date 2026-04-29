// plugins/instagram2.js

import axios from 'axios'

export default {
  command: ['instagram2', 'ig2'],
  tag: 'instagram2',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Instagram*'
      }, { quoted: msg })
    }

    const url = args[0]

    if (!url.includes('instagram.com')) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de Instagram*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.get(
        `https://nayan-video-downloader.vercel.app/instagram?url=${encodeURIComponent(url)}`,
        { timeout: 30000 }
      )

      const info = data?.data
      if (!data?.status || !info) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar.' }, { quoted: msg })
      }

      const videos = info.video || []

      if (!videos.length) {
        return sock.sendMessage(from, {
          text: '🌱 Solo se soportan videos de Instagram por ahora.'
        }, { quoted: msg })
      }

      for (const videoUrl of videos) {
        await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

        const videoRes = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 120000
        })
        const videoBuffer = Buffer.from(videoRes.data)

        await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

        const sizeMB = videoBuffer.length / (1024 * 1024)

        if (sizeMB < 50) {
          await sock.sendMessage(from, { video: videoBuffer }, { quoted: msg })
        } else {
          await sock.sendMessage(from, {
            document: videoBuffer,
            mimetype: 'video/mp4',
            fileName: 'instagram.mp4'
          }, { quoted: msg })
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}