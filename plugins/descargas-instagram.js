import axios from 'axios'

export default {
  command:   ['ig', 'instagram'],
  tag:       'instagram',
  categoria: 'descargas',
  descripcion: 'Descarga videos y fotos de instagram',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url || !url.includes('instagram.com')) {
      await sock.sendMessage(from, {
        text: '🌸 Ay, necesito una URL de Instagram para poder descargar. ¿Me la pasas?'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

    try {
      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data?.length) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
        return
      }

      const media = data.data[0]
      const mediaUrl = media.url
      const tipo = media.type

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const mediaRes = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const mediaBuffer = Buffer.from(mediaRes.data)
      const sizeMB = mediaBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      if (tipo === 'image') {
        await sock.sendMessage(from, {
          image: mediaBuffer
        }, { quoted: msg })
      } else {
        if (sizeMB <= 50) {
          await sock.sendMessage(from, {
            video: mediaBuffer
          }, { quoted: msg })
        } else {
          await sock.sendMessage(from, {
            document: mediaBuffer,
            mimetype: 'video/mp4',
            fileName: `instagram_${Date.now()}.mp4`
          }, { quoted: msg })
        }
      }

      await sock.sendMessage(from, { react: { text: '🌿', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}