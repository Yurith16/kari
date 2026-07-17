import axios from 'axios'

export default {
  command:   ['tiktok', 'tt', 'ttdl'],
  tag:       'tiktok',
  categoria: 'descargas',
  descripcion: 'Descarga videos de TikTok',
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

    if (!url.includes('tiktok.com') && !url.includes('vt.tiktok.com')) {
      await sock.sendMessage(from, {
        text: 'Eso no es un enlace de TikTok. No me hagas perder el tiempo, pásame algo que sirva.'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

    try {
      const apiUrl = `https://api.lempi.lat/dl/tiktok?url=${encodeURIComponent(url)}&apikey=lem851`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.resultado) {
        await sock.sendMessage(from, {
          text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
        }, { quoted: msg })
        return
      }

      const resultado = data.resultado

      if (resultado.tipo === 'imagen' && resultado.imagenes?.length) {
        await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

        for (const img of resultado.imagenes) {
          const imgRes = await axios.get(img, { responseType: 'arraybuffer', timeout: 60000 })
          await sock.sendMessage(from, {
            image: Buffer.from(imgRes.data),
            caption: `${resultado.titulo || ''}`
          }, { quoted: msg })
        }

        await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })
        return
      }

      const videoUrl = resultado.video?.sin_marca_agua || resultado.video?.hd || resultado.video?.con_marca_agua

      if (!videoUrl) {
        await sock.sendMessage(from, {
          text: 'No encontré video en ese enlace. ¿Seguro que no es otra cosa?'
        }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const videoRes = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const videoBuffer = Buffer.from(videoRes.data)
      const sizeMB = videoBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      const caption = `*${resultado.titulo || 'Sin título'}*\n*Usuario:* ${resultado.autor?.nombre || 'Desconocido'} (@${resultado.autor?.usuario || 'N/A'})\n*Likes:* ${resultado.me_gusta?.toLocaleString() || 0} | *Comentarios:* ${resultado.comentarios?.toLocaleString() || 0} | *Compartidos:* ${resultado.compartidos?.toLocaleString() || 0}`

      if (sizeMB <= 50) {
        await sock.sendMessage(from, {
          video: videoBuffer,
          caption: caption
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `tiktok_${Date.now()}.mp4`,
          caption: `${caption}\nEl video pesa más de lo que puedo mandar como video normal, así que te lo paso como documento. No es lo ideal, pero es lo que hay.`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })

    } catch {
      await sock.sendMessage(from, {
        text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
      }, { quoted: msg })
    }
  }
}