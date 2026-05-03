import axios from 'axios'

export default {
  command:   ['ig', 'instagram'],
  tag:       'instagram',
  categoria: 'descargas',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url || !url.includes('instagram.com')) {
      await sock.sendMessage(from, {
        text: '✦ Ingresa una URL de Instagram.\n\nEjemplo: *.ig https://www.instagram.com/reel/abcde123*'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.data?.length) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: global.messages?.error || '✦ No se pudo obtener el contenido.' }, { quoted: msg })
        return
      }

      const media = data.data[0]
      const mediaUrl = media.url
      const tipo = media.type

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const mediaRes = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const mediaBuffer = Buffer.from(mediaRes.data)
      const sizeMB = mediaBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

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

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages?.error || '✦ Error al procesar la descarga.' }, { quoted: msg })
    }
  }
}