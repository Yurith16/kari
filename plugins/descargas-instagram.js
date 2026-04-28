// plugins/instagram.js

import axios from 'axios'

export default {
  command: ['ig', 'instagram'],
  tag: 'Instagram',
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

      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data?.length) {
        return sock.sendMessage(from, { text: '🌱 No se pudo descargar.' }, { quoted: msg })
      }

      const media = data.data[0]
      const mediaUrl = media.url
      const tipo = media.type

      if (!mediaUrl) {
        return sock.sendMessage(from, { text: '🌱 No se encontró contenido.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const mediaRes = await fetch(mediaUrl)
      if (!mediaRes.ok) throw new Error('Error al descargar buffer')
      const mediaBuffer = Buffer.from(await mediaRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = mediaBuffer.length / (1024 * 1024)

      if (tipo === 'image') {
        await sock.sendMessage(from, {
          image: mediaBuffer,
          caption: '📷 *Instagram*'
        }, { quoted: msg })
      } else {
        if (sizeMB < 50) {
          await sock.sendMessage(from, {
            video: mediaBuffer,
            caption: '🎬 *Instagram*'
          }, { quoted: msg })
        } else {
          await sock.sendMessage(from, {
            document: mediaBuffer,
            mimetype: 'video/mp4',
            fileName: 'instagram.mp4',
            caption: '🎬 *Instagram*'
          }, { quoted: msg })
        }
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}