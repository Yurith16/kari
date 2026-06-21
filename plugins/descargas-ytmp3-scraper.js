// plugins/descarga-mp3.js

export default {
  command: ['mp', 'ytmp3'],
  tag: 'descargas',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio MP3 de YouTube',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, {
      text: '🌸 ¿Qué canción quieres que busque en YouTube? Pásame el nombre o el enlace.'
    }, { quoted: msg })

    const query = args.join(' ')
    const isUrl = /^https?:\/\//.test(query)
    let videoUrl = query

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      if (!isUrl) {
        const ytSearch = await import('yt-search')
        const search = await ytSearch.default(query)
        if (!search.videos?.length) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return await sock.sendMessage(from, { text: '🌸 No encontré esa canción en YouTube.' }, { quoted: msg })
        }
        videoUrl = search.videos[0].url
      }

      if (!videoUrl.includes('youtu.be') && !videoUrl.includes('youtube.com')) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 Ese enlace no es de YouTube.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0',
        'Accept': '*/*',
        'Origin': 'https://mp3yt.is',
        'Referer': 'https://mp3yt.is/'
      }

      // Key
      const keyRes = await fetch('https://cnv.cx/v2/sanity/key', { headers })
      const keyData = await keyRes.json()

      // Info
      const infoRes = await fetch('https://cnv.cx/v2/getVideoInfo', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `link=${encodeURIComponent(videoUrl)}`
      })
      const info = await infoRes.json()

      // Convert
      const convertRes = await fetch('https://cnv.cx/v2/converter', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'key': keyData.key
        },
        body: `link=${encodeURIComponent(videoUrl)}&format=mp3&audioBitrate=320`
      })
      const convert = await convertRes.json()

      if (convert.status !== 'tunnel' || !convert.url) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 No pude descargar el audio.' }, { quoted: msg })
      }

      // Portada con detalles
      if (info.thumbnail) {
        const details = ` *「✦」 ${info.title}*\n\n` +
          `> ✦ *Canal:* » ${info.channelTitle || 'YouTube'}\n` +
          `> ⴵ *Duración:* » ${info.videoTime || '--'}\n` +
          `> 🜸 *Enlace:* » ${videoUrl.split('&')[0]}`

        try {
          await sock.sendMessage(from, {
            image: { url: info.thumbnail },
            caption: details.trim()
          }, { quoted: msg })
        } catch {}
      }

      await sock.sendMessage(from, {
        audio: { url: convert.url },
        mimetype: 'audio/mpeg'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[mp3]', err.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: '🌸 Algo salió mal, intenta de nuevo.' }, { quoted: msg })
    }
  }
}