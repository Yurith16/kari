// plugins/descarga-aud.js
import fs from 'fs'
import path from 'path'
import yts from 'yt-search'

const tempDir = path.join(process.cwd(), 'temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

export default {
  command: 'aud',
  tag: 'descargas',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga audio de YouTube',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué audio quieres descargar? Ejemplo: *.aud* Sofia Reyes 1 2 3'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    let videoUrl = query
    if (!query.startsWith('http')) {
      const search = await yts(query)
      if (!search.videos.length) {
        return sock.sendMessage(from, { text: '🌸 No encontré nada con ese nombre.' }, { quoted: msg })
      }
      videoUrl = search.videos[0].url
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
      'Accept': '*/*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Referer': 'https://en.loader.to/',
      'Origin': 'https://en.loader.to'
    }

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const apiUrl = `https://p.savenow.to/api/v2/download?format=mp3&url=${encodeURIComponent(videoUrl)}&apikey=dfcb6d76f2f6a9894gjkege8a4ab232222`
      const initRes = await fetch(apiUrl, { headers })
      const init = await initRes.json()

      if (!init.success) {
        return sock.sendMessage(from, { text: '🌸 No pude procesar ese video.' }, { quoted: msg })
      }

      if (init.thumbnail_url) {
        await sock.sendMessage(from, { image: { url: init.thumbnail_url } }, { quoted: msg })
      }

      const progressMsg = await sock.sendMessage(from, { text: '🌸 Preparando... ▱▱▱▱▱▱▱▱▱▱ 0%' })

      let downloadUrl = ''
      for (let i = 0; i < 35; i++) {
        await new Promise(r => setTimeout(r, 1500))
        const progressRes = await fetch(`${init.progress_url}&_=${Date.now()}`, { headers })
        const progress = await progressRes.json()

        const pct = Math.min(i * 3, 90)
        const bar = '▰'.repeat(Math.floor(pct / 10)) + '▱'.repeat(10 - Math.floor(pct / 10))
        await sock.sendMessage(from, {
          edit: progressMsg.key,
          text: `🌸 ${progress.text || 'Procesando'}... ${bar} ${pct}%`
        })

        if (progress.download_url) {
          downloadUrl = progress.download_url
          await sock.sendMessage(from, {
            edit: progressMsg.key,
            text: `🌸 Procesando... ▰▰▰▰▰▰▰▰▰▰ 100%`
          })
          break
        }
      }

      if (!downloadUrl) {
        return sock.sendMessage(from, { text: '🌸 Tardó mucho, intenta de nuevo.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Descargando... 📥' })

      const fileRes = await fetch(downloadUrl)
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      const fileName = `${init.title.replace(/[^a-zA-Z0-9 ]/g, '')}.mp3`
      const filePath = path.join(tempDir, fileName)
      fs.writeFileSync(filePath, buffer)

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Enviando... 📤' })

      await sock.sendMessage(from, {
        document: { url: filePath },
        mimetype: 'audio/mpeg',
        fileName: fileName
      }, { quoted: msg })

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Listo ✨' })
      fs.unlinkSync(filePath)

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: '🌸 Algo salió mal, intenta de nuevo.' }, { quoted: msg })
    }
  }
}