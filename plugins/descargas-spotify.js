// plugins/descarga-spotify.js

const BASE = 'https://spotidown.app'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'

function headers(cookie = '') {
  return { 'User-Agent': UA, 'Origin': BASE, 'Referer': `${BASE}/en3`, ...(cookie && { 'Cookie': cookie }) }
}

export default {
  command: ['spotify', 'sp'],
  tag: 'spotify',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y descarga música de Spotify',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, {
      text: '🌸 ¿Qué canción quieres que busque en Spotify? Pásame el nombre o el enlace.'
    }, { quoted: msg })

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let spotifyUrl = query

      if (!query.includes('spotify.com/track/')) {
        const searchUrl = `https://api.delirius.store/search/spotify?q=${encodeURIComponent(query)}&limit=3`
        const searchRes = await fetch(searchUrl)
        const searchJson = await searchRes.json()

        if (!searchJson?.status || !searchJson.data?.length) {
          await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
          return await sock.sendMessage(from, { text: '🌸 No encontré esa canción en Spotify, corazón.' }, { quoted: msg })
        }

        spotifyUrl = searchJson.data[0].url
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const page = await fetch(`${BASE}/en3`, { headers: headers() })
      const cookie = page.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
      const html = await page.text()
      const csrf = html.match(/<input\s+name="([^"]+)"\s+type="hidden"\s+value="([^"]+)"/)
      if (!csrf) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 No pude acceder al servidor de Spotify.' }, { quoted: msg })
      }

      const r1 = await fetch(`${BASE}/action`, {
        method: 'POST',
        headers: headers(cookie),
        body: new URLSearchParams({ url: spotifyUrl, 'g-recaptcha-response': '', [csrf[1]]: csrf[2] })
      })
      const j1 = await r1.json()
      if (j1.error) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 Error al procesar la canción.' }, { quoted: msg })
      }

      const data = j1.data.match(/name="data"\s+value='([^']+)'/)
      const base = j1.data.match(/name="base"\s+value="([^"]+)"/)
      const token = j1.data.match(/name="token"\s+value="([^"]+)"/)
      if (!data || !base || !token) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 No se pudo extraer la información de la canción.' }, { quoted: msg })
      }

      const r2 = await fetch(`${BASE}/action/track`, {
        method: 'POST',
        headers: headers(cookie),
        body: new URLSearchParams({ data: data[1], base: base[1], token: token[1] })
      })
      const j2 = await r2.json()
      if (j2.error) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 Error al obtener la descarga.' }, { quoted: msg })
      }

      const meta = JSON.parse(Buffer.from(data[1], 'base64').toString())
      const links = [...j2.data.matchAll(/href="(https:\/\/rapid\.spotidown\.app[^"]+)"/g)].map(m => m[1])
      const downloadUrl = links[0]
      if (!downloadUrl) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 No se pudo obtener el enlace de descarga.' }, { quoted: msg })
      }

      const coverUrl = meta.cover || meta.image

      if (coverUrl) {
        const details = ` *「✦」 ${meta.name || meta.title}*\n\n` +
          `> ✦ *Artista:* » ${meta.artist || 'Desconocido'}\n` +
          `> ⴵ *Álbum:* » ${meta.album || 'Desconocido'}\n` +
          `> ✰ *Duración:* » ${meta.duration || '--'}\n` +
          `> ✐ *Año:* » ${meta.date || meta.year || 'Desconocido'}`

        try {
          await sock.sendMessage(from, {
            image: { url: coverUrl },
            caption: details.trim()
          }, { quoted: msg })
        } catch {}
      }

      await sock.sendMessage(from, {
        audio: { url: downloadUrl },
        mimetype: 'audio/mpeg'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[spotify]', err.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: '🌸 Algo salió mal, intenta de nuevo.' }, { quoted: msg })
    }
  }
}