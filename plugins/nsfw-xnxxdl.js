export default {
  command:   'xnxxdl',
  tag:       'xnxxdl',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url || !url.includes('xnxx.com')) {
      await sock.sendMessage(from, {
        text: '✦ Envía la URL del video de XNXX.\n\nEjemplo: *.xnxxdl https://www.xnxx.com/video-xxx/titulo*'
      }, { quoted: msg })
      return
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔥', key: msg.key } })

      const res  = await fetch('https://panel.apinexus.fun/api/xnxx/descargar', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key':    'antbx21e5jhac'
        },
        body: JSON.stringify({ url })
      })

      const json = await res.json()

      if (!json.success || !json.data?.low) {
        await sock.sendMessage(from, {
          text: '⚠️ No se pudo obtener el video. Verifica que la URL sea válida.'
        }, { quoted: msg })
        return
      }

      const { title, thumbnail, low } = json.data

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      // Verificar tamaño antes de descargar completo
      const headRes = await fetch(low, { method: 'HEAD' })
      const size    = parseInt(headRes.headers.get('content-length') || '0')
      const maxSize = 500 * 1024 * 1024 // 500MB

      if (size > maxSize) {
        await sock.sendMessage(from, {
          text: `⚠️ El video pesa ${(size / 1024 / 1024).toFixed(0)}MB y supera el límite de 500MB.`
        }, { quoted: msg })
        return
      }

      // Descargar video
      const videoRes    = await fetch(low)
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer())

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const fileName = `${(title || 'video').replace(/[\\/:*?"<>|]/g, '').slice(0, 50)}.mp4`

      const docMsg = {
        document: videoBuffer,
        mimetype: 'video/mp4',
        fileName,
      }

      // Agregar portada si hay thumbnail
      if (thumbnail) {
        docMsg.contextInfo = {
          externalAdReply: {
            title:                 title || 'XNXX',
            body:                  global.bot?.name || 'Bot',
            thumbnailUrl:          thumbnail,
            sourceUrl:             url,
            mediaType:             1,
            renderLargerThumbnail: true
          }
        }
      }

      await sock.sendMessage(from, docMsg, { quoted: msg })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}