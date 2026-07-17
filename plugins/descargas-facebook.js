import axios from 'axios'

export default {
  command:   ['fb', 'facebook', 'fbdl'],
  tag:       'facebook',
  categoria: 'descargas',
  descripcion: 'Descarga videos de Facebook',
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

    if (!url.includes('facebook.com') && !url.includes('fb.watch') && !url.includes('fb.com')) {
      await sock.sendMessage(from, {
        text: 'Eso no es un enlace de Facebook. No me hagas perder el tiempo, pásame algo que sirva.'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

    try {
      const apiUrl = `https://api.lempi.lat/dl/fb?url=${encodeURIComponent(url)}&apikey=lem851`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.resultado) {
        await sock.sendMessage(from, {
          text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
        }, { quoted: msg })
        return
      }

      const resultado = data.resultado
      const videoUrl = resultado.hd || resultado.sd
      const titulo = resultado.titulo || 'Video de Facebook'

      if (!videoUrl) {
        await sock.sendMessage(from, {
          text: 'Ese enlace no tiene video para descargar. ¿No será una foto o algo que no puedo procesar?'
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

      if (sizeMB <= 50) {
        await sock.sendMessage(from, {
          video: videoBuffer,
          caption: `${titulo}`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `facebook_${Date.now()}.mp4`,
          caption: `${titulo}\nEl video pesa más de lo que puedo mandar como video normal, así que te lo paso como documento. No es lo ideal, pero es lo que hay.`
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