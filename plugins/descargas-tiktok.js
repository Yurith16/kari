export default {
  command:   'tiktok',
  tag:       'tiktok',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Descarga videos de TikTok sin marca de agua',

  async execute(sock, msg, { from, args }) {
    const url = args[0]

    if (!url || !url.includes('tiktok.com')) {
      await sock.sendMessage(from, {
        text: '✦ Ingresa una URL de TikTok.\n\nEjemplo: *.tiktok https://www.tiktok.com/@user/video/123*'
      }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    try {
      const res  = await fetch('https://panel.apinexus.fun/api/tiktok/descargar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'antbx21e5jhac' },
        body:    JSON.stringify({ url })
      })
      const json = await res.json()

      if (!json.success || !json.data?.videoUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
        return
      }

      const { titulo, autor, likes, reproducciones, videoUrl, thumbnail } = json.data

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes    = await fetch(videoUrl)
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer())
      const sizeMB      = videoBuffer.length / (1024 * 1024)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const caption = `✦ *${titulo}*\n` +
        `✦ ${autor}  ·  ${(reproducciones / 1e6).toFixed(1)}M vistas  ·  ${(likes / 1e3).toFixed(1)}K likes`

      if (sizeMB <= 50) {
        await sock.sendMessage(from, {
          video:   videoBuffer,
          caption
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `${titulo.slice(0, 50).replace(/[\\/:*?"<>|]/g, '')}.mp4`,
          caption,
          ...(thumbnail ? {
            contextInfo: {
              externalAdReply: {
                title:                 titulo,
                body:                  global.bot?.name || 'Bot',
                thumbnailUrl:          thumbnail,
                sourceUrl:             url,
                mediaType:             1,
                renderLargerThumbnail: true
              }
            }
          } : {})
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
    }
  }
}