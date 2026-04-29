// plugins/tiktok2.js

import axios from 'axios'

export default {
  command: ['tiktok2', 'tt2'],
  tag: 'tiktok2',
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

    if (!url.includes('tiktok.com')) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de TikTok*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.get(
        `https://nayan-video-downloader.vercel.app/tikdown?url=${encodeURIComponent(url)}`,
        { timeout: 30000 }
      )

      const info = data?.data
      if (!data?.status || !info?.video) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar el video.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await axios.get(info.video, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const videoBuffer = Buffer.from(videoRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = videoBuffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        await sock.sendMessage(from, {
          video: videoBuffer
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: 'tiktok.mp4'
        }, { quoted: msg })
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