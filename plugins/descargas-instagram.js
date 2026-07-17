import axios from 'axios'

export default {
  command:   ['ig', 'instagram', 'igdl'],
  tag:       'instagram',
  categoria: 'descargas',
  descripcion: 'Descarga videos y fotos de Instagram',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url) {
      await sock.sendMessage(from, {
        text: '¿Y se supone que tengo que adivinar el enlace o qué? Pásamelo y dejo de hacerte esperar.'
      }, { quoted: msg })
      return
    }

    if (!url.includes('instagram.com')) {
      await sock.sendMessage(from, {
        text: 'Eso no es un enlace de Instagram. No me hagas perder el tiempo, pásame algo que sirva.'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

    try {
      const apiUrl = `https://api.lempi.lat/dl/ig?url=${encodeURIComponent(url)}&apikey=lem851`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.media?.length) {
        await sock.sendMessage(from, {
          text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
        }, { quoted: msg })
        return
      }

      const media = data.media
      const autor = data.autor?.username || 'Desconocido'
      const caption = data.caption || ''

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      for (const item of media) {
        const mediaRes = await axios.get(item.url, {
          responseType: 'arraybuffer',
          timeout: 120000
        })
        const mediaBuffer = Buffer.from(mediaRes.data)
        const sizeMB = mediaBuffer.length / (1024 * 1024)

        await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

        if (item.tipo === 'image') {
          await sock.sendMessage(from, {
            image: mediaBuffer,
            caption: `*${caption || 'Sin descripción'}*\n*Usuario:* @${autor}`
          }, { quoted: msg })
        } else {
          const videoCaption = `*${caption || 'Sin descripción'}*\n*Usuario:* @${autor}`

          if (sizeMB <= 50) {
            await sock.sendMessage(from, {
              video: mediaBuffer,
              caption: videoCaption
            }, { quoted: msg })
          } else {
            await sock.sendMessage(from, {
              document: mediaBuffer,
              mimetype: 'video/mp4',
              fileName: `instagram_${Date.now()}.mp4`,
              caption: `${videoCaption}\nEl video pesa más de lo que puedo mandar como video normal, así que te lo paso como documento. No es lo ideal, pero es lo que hay.`
            }, { quoted: msg })
          }
        }
      }

      await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })

    } catch {
      await sock.sendMessage(from, {
        text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
      }, { quoted: msg })
    }
  }
}