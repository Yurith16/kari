export default {
  command:   ['fb', 'facebook'],
  tag:       'facebook',
  categoria: 'descargas',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url || (!url.includes('facebook.com') && !url.includes('fb.watch'))) {
      await sock.sendMessage(from, {
        text: '✦ Ingresa una URL de Facebook.\n\nEjemplo: *.fb https://www.facebook.com/watch?v=123*'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      const res = await fetch('https://panel.apinexus.fun/api/facebook/descargar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'antbx21e5jhac' },
        body:    JSON.stringify({ url })
      })
      const json = await res.json()

      if (!json.success || !json.data) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: global.messages?.error || '✦ No se pudo obtener el video.' }, { quoted: msg })
        return
      }

      const { titulo, duracion, hd, sd } = json.data
      const duracionMinutos = duracion / 60

      const videoUrl = duracionMinutos > 30 ? (sd || hd) : (hd || sd)

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await fetch(videoUrl)
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
      const sizeMB = videoBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      if (sizeMB > 80) {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${titulo.slice(0, 30)}.mp4`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: videoBuffer
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages?.error || '✦ Error en el servidor de Facebook.' }, { quoted: msg })
    }
  }
}