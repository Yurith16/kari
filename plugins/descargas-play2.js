import axios from 'axios'
import yts from 'yt-search'
import { getVideo } from '../utils/video-api.js'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)
const activeUsers   = new Map()

async function downloadWithRetry(url, timeout = 600000) {
  const response = await axios.get(url, {
    responseType:     'arraybuffer',
    timeout,
    maxContentLength: Infinity,
    maxBodyLength:    Infinity
  })
  return Buffer.from(response.data)
}

async function splitVideo(inputPath, totalPartes) {
  const chunks = []

  // Obtener duración real con ffprobe
  let duration = 0
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet', '-print_format', 'json', '-show_format', inputPath
    ])
    duration = parseFloat(JSON.parse(stdout).format?.duration) || 0
  } catch {}

  if (duration <= 0) return []

  // Dividir duración en partes iguales — garantiza tamaños similares
  const chunkDuration = duration / totalPartes
  let startTime = 0

  for (let i = 0; i < totalPartes; i++) {
    const outPath = join(tmpdir(), `chunk_${Date.now()}_${i}.mp4`)
    const dur     = i === totalPartes - 1
      ? duration - startTime   // última parte toma el resto exacto
      : chunkDuration

    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-ss', startTime.toFixed(3),
      '-t',  dur.toFixed(3),
      '-c',  'copy',
      '-avoid_negative_ts', 'make_zero',
      '-movflags', '+faststart',
      '-threads', '0',
      '-y',
      outPath
    ])

    chunks.push(outPath)
    startTime += chunkDuration
  }

  return chunks
}

export default {
  command:   'play2',
  tag:       'play2',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const userId = msg.key.participant || from
    if (activeUsers.has(userId)) return

    if (!args[0]) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, {
        text: '✦ Ingresa el nombre o URL del video que deseas descargar.\n\nEjemplo: *.play2 despacito*'
      }, { quoted: msg })
      return
    }

    activeUsers.set(userId, true)
    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

    let tempInput  = null
    let tempOutput = null
    let chunkPaths = []

    try {
      let videoUrl   = args[0]
      let searchData = null

      if (!videoUrl.match(/youtu/gi)) {
        const search = await yts(`${args.join(' ')} video`)
        const video  = search.videos.find(v => v.type === 'video') || search.videos[0]
        if (!video) throw new Error('Video no encontrado')
        videoUrl   = video.url
        searchData = video
      }

      let downloadUrl = null
      let title       = searchData?.title || 'Video de YouTube'
      let videoThumb  = searchData?.thumbnail || global.bot?.defaultImg

      // API 1: Nayan
      try {
        const { data } = await axios.get(
          `https://nayan-video-downloader.vercel.app/ytdown?url=${encodeURIComponent(videoUrl)}`,
          { timeout: 30000 }
        )
        if (data?.status && data?.data?.video) {
          downloadUrl = data.data.video
          title       = data.data.title || title
        }
      } catch {}

      // API 2: video-api.js
      if (!downloadUrl) {
        const result = await getVideo(videoUrl)
        if (result?.url) {
          downloadUrl = result.url
          title       = result.title || title
          videoThumb  = result.thumb || videoThumb
        }
      }

      if (!downloadUrl) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: global.messages?.error }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      tempInput         = join(tmpdir(), `${Date.now()}_in.mp4`)
      const videoBuffer = await downloadWithRetry(downloadUrl)
      await writeFile(tempInput, videoBuffer)

      tempOutput = join(tmpdir(), `${Date.now()}_out.mp4`)
      await execFileAsync('ffmpeg', [
        '-i', tempInput,
        '-c', 'copy',
        '-movflags', '+faststart',
        '-threads', '0',
        '-y',
        tempOutput
      ])

      const finalBuffer = await readFile(tempOutput)
      const finalSizeMB = finalBuffer.length / (1024 * 1024)
      const botName     = global.bot?.name || 'Midori-Hana'

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      if (finalSizeMB <= 400) {
        // Sube directo — WhatsApp lo maneja sin problema
        const cleanName = `${title.substring(0, 30).replace(/[<>:"/\\|?*]/g, '')} - ${botName}.mp4`
        const sentMsg   = await sock.sendMessage(from, {
          document: finalBuffer,
          mimetype: 'video/mp4',
          fileName: cleanName,
          caption:  ' ',
          contextInfo: {
            forwardingScore: 9999999,
            isForwarded:     true,
            externalAdReply: {
              showAdAttribution:    false,
              renderLargerThumbnail: false,
              title,
              body:               botName,
              containsAutoReply:  true,
              mediaType:          1,
              thumbnailUrl:       videoThumb,
              sourceUrl:          videoUrl
            }
          }
        }, { quoted: msg })
        if (sentMsg) await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })

      } else {
        // Calcular partes necesarias para que ninguna supere 300MB
        const partes = Math.ceil(finalSizeMB / 300)

        await sock.sendMessage(from, {
          text: `⚠️ *El video pesa ${finalSizeMB.toFixed(0)} MB y será enviado en ${partes} partes. Un momento... 🌿*`
        }, { quoted: msg })

        await new Promise(r => setTimeout(r, 1500))

        // Pasar partes calculadas para que cada chunk no supere 300MB
        chunkPaths = await splitVideo(tempOutput, partes)

        for (let i = 0; i < chunkPaths.length; i++) {
          const chunkBuffer = await readFile(chunkPaths[i])
          const cleanName   = `${title.substring(0, 20)}_parte${i + 1} - ${botName}.mp4`

          const sentMsg = await sock.sendMessage(from, {
            document: chunkBuffer,
            mimetype: 'video/mp4',
            fileName: cleanName,
            caption:  `✦ ${title}\n✦ Parte ${i + 1} de ${chunkPaths.length} 🌿`,
            contextInfo: {
              forwardingScore: 9999999,
              isForwarded:     true,
              externalAdReply: {
                showAdAttribution:    false,
                renderLargerThumbnail: false,
                title:              `${title} (${i + 1}/${chunkPaths.length})`,
                body:               botName,
                containsAutoReply:  true,
                mediaType:          1,
                thumbnailUrl:       videoThumb,
                sourceUrl:          videoUrl
              }
            }
          }, { quoted: msg })

          if (sentMsg && i === 0) await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
          await new Promise(r => setTimeout(r, 1500))
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('Error en Play2:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    } finally {
      if (tempInput  && existsSync(tempInput))  await unlink(tempInput).catch(() => {})
      if (tempOutput && existsSync(tempOutput)) await unlink(tempOutput).catch(() => {})
      for (const chunk of chunkPaths) {
        if (existsSync(chunk)) await unlink(chunk).catch(() => {})
      }
      activeUsers.delete(userId)
    }
  }
}