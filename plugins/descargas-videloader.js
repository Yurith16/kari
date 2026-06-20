// plugins/descarga-vid.js
import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import ffmpegPath from 'ffmpeg-static'
import yts from 'yt-search'

const execFileAsync = promisify(execFile)
const tempDir = path.join(process.cwd(), 'temp')
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

export default {
  command: 'vid',
  tag: 'descargas',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga video de YouTube',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌸 ¿Qué video quieres descargar? Ejemplo: *.vid* Sofia Reyes 1 2 3'
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

      const apiUrl = `https://p.savenow.to/api/v2/download?format=360&url=${encodeURIComponent(videoUrl)}&apikey=dfcb6d76f2f6a9894gjkege8a4ab232222`
      const initRes = await fetch(apiUrl, { headers })
      const init = await initRes.json()

      if (!init.success) {
        return sock.sendMessage(from, { text: '🌸 No pude procesar ese video.' }, { quoted: msg })
      }

      const duration = init.video_duration
        ? `${Math.floor(init.video_duration / 60)}:${String(init.video_duration % 60).padStart(2, '0')}`
        : ''

      let caption = `✦ *${init.title}*`
      if (duration) caption += `\n✦ Duración: ${duration}`

      if (init.thumbnail_url) {
        await sock.sendMessage(from, {
          image: { url: init.thumbnail_url },
          caption: caption
        }, { quoted: msg })
      }

      const progressMsg = await sock.sendMessage(from, {
        text: '🌸 Esto puede tardar un poco, ten paciencia...'
      })

      let downloadUrl = ''
      for (let i = 0; i < 35; i++) {
        await new Promise(r => setTimeout(r, 1500))
        const progressRes = await fetch(`${init.progress_url}&_=${Date.now()}`, { headers })
        const progress = await progressRes.json()
        if (progress.download_url) {
          downloadUrl = progress.download_url
          break
        }
      }

      if (!downloadUrl) {
        return sock.sendMessage(from, { text: '🌸 Tardó mucho, intenta de nuevo.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Descargando video... 📥' })

      const fileRes = await fetch(downloadUrl)
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      const rawPath = path.join(tempDir, `${Date.now()}_in.tmp`)
      const finalPath = path.join(tempDir, `${Date.now()}.mp4`)
      fs.writeFileSync(rawPath, buffer)

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Procesando... 🔄' })

      await execFileAsync(ffmpegPath, [
        '-i', rawPath,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-y',
        finalPath
      ])

      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Enviando... 📤' })

      const finalName = `${init.title.replace(/[^a-zA-Z0-9 ]/g, '')}.mp4`

      await sock.sendMessage(from, {
        document: { url: finalPath },
        mimetype: 'video/mp4',
        fileName: finalName
      }, { quoted: msg })

      await sock.sendMessage(from, { edit: progressMsg.key, text: '🌸 Listo ✨' })
      fs.unlinkSync(finalPath)

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { text: '🌸 Algo salió mal, intenta de nuevo.' }, { quoted: msg })
    }
  }
}