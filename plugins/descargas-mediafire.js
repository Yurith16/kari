import axios from 'axios'

export default {
  command:   ['mediafire', 'mf', 'mfire'],
  tag:       'mediafire',
  categoria: 'descargas',
  descripcion: 'Descarga archivos de Mediafire',
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

    if (!url.includes('mediafire.com')) {
      await sock.sendMessage(from, {
        text: 'Eso no es un enlace de Mediafire. No me hagas perder el tiempo, pásame algo que sirva.'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

    try {
      const apiUrl = `https://api.lempi.lat/dl/mediafire?url=${encodeURIComponent(url)}&apikey=lem851`
      const { data } = await axios.get(apiUrl, { timeout: 30000 })

      if (!data.status || !data.resultado) {
        await sock.sendMessage(from, {
          text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
        }, { quoted: msg })
        return
      }

      const resultado = data.resultado
      const fileUrl = resultado.url
      const fileName = resultado.archivo || `mediafire_${Date.now()}`
      const fileSize = resultado.peso || 'Desconocido'

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const fileRes = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 180000
      })
      const fileBuffer = Buffer.from(fileRes.data)
      const sizeMB = fileBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        document: fileBuffer,
        fileName: fileName,
        mimetype: 'application/octet-stream',
        caption: `📦 ${fileName}\n📏 ${fileSize}`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌴', key: msg.key } })

    } catch {
      await sock.sendMessage(from, {
        text: 'No pude descargar eso, y no es por falta de ganas. Revisa el enlace y dime si de verdad funciona.'
      }, { quoted: msg })
    }
  }
}