// plugins/instagram.js

import axios from 'axios'

export default {
  command:   ['ig', 'instagram'],
  tag:       'instagram',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Instagram*'
      }, { quoted: msg })
      return
    }

    const url = args[0]

    if (!url.includes('instagram.com')) {
      await sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de Instagram*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data?.length) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se pudo descargar 🍃' }, { quoted: msg })
        return
      }

      const media = data.data[0]
      const mediaUrl = media.url
      const tipo = media.type

      if (!mediaUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se encontró contenido 🍃' }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const mediaRes = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const mediaBuffer = Buffer.from(mediaRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = mediaBuffer.length / (1024 * 1024)

      if (tipo === 'image') {
        const sentMsg = await sock.sendMessage(from, {
          image: mediaBuffer
        }, { quoted: msg })
        await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      } else {
        if (sizeMB < 50) {
          const sentMsg = await sock.sendMessage(from, {
            video: mediaBuffer
          }, { quoted: msg })
          await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
        } else {
          const sentMsg = await sock.sendMessage(from, {
            document: mediaBuffer,
            mimetype: 'video/mp4',
            fileName: 'instagram.mp4'
          }, { quoted: msg })
          await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, {
        text: global.messages?.error || '> Error en el sistema 🍃'
      }, { quoted: msg })
    }
  }
}