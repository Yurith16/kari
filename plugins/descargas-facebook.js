// plugins/facebook.js
import fs from 'fs'
import axios from 'axios'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, unlinkSync, statSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import ffmpegPath from 'ffmpeg-static'
import { execSync } from 'child_process'

const execFileAsync = promisify(execFile)
const API_KEY = 'antbx21e5jhac'
const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0'
const MEDIA_DIR = join(process.cwd(), 'media', 'facebook')

if (!existsSync(MEDIA_DIR)) {
  mkdirSync(MEDIA_DIR, { recursive: true })
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUENTE 1: Apinexus
// ═══════════════════════════════════════════════════════════════════════════

async function sourceApinexus(url) {
  const { data } = await axios.post('https://panel.apinexus.fun/api/facebook/descargar', { url }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'User-Agent': UA },
    timeout: 30000
  })
  if (!data?.success || !data?.data) throw new Error('Apinexus sin datos')
  const { hd, sd, duracion, titulo } = data.data
  const duracionMin = (duracion || 0) / 60
  const videoUrl = duracionMin <= 30 ? (hd || sd) : (sd || hd)
  if (!videoUrl) throw new Error('Apinexus sin URL')
  return { url: videoUrl, title: titulo }
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUENTE 2: YOSOYYO
// ═══════════════════════════════════════════════════════════════════════════

async function sourceYosoyyo(url) {
  const { data } = await axios.get(`https://yosoyyo-api-ofc.onrender.com/api/facebook?url=${encodeURIComponent(url)}&apiKey=YJ-EspinoX`, {
    headers: { 'User-Agent': UA }, timeout: 30000
  })
  const videoUrl = data?.result?.media?.video_hd || data?.result?.media?.video_sd
  if (!videoUrl) throw new Error('YOSOYYO sin video')
  return { url: videoUrl, title: data.result.info?.title }
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUENTE 3: kfvid.com
// ═══════════════════════════════════════════════════════════════════════════

async function sourceKfvid(url) {
  const params = new URLSearchParams({ url, ajax: '1', lang: 'en' })
  const res = execSync(`curl -s --max-time 25 'https://kfvid.com/mates/en/analyze/ajax?retry=undefined&platform=facebook&mhash=ca44ba3bf448c126' \
    -X POST \
    -H 'User-Agent: ${UA}' \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -H 'X-Requested-With: XMLHttpRequest' \
    -H 'Origin: https://kfvid.com' \
    -H 'Referer: https://kfvid.com/' \
    --data-raw '${params.toString()}'`, { encoding: 'utf-8' })

  const json = JSON.parse(res)
  if (json.status !== 'success') throw new Error('kfvid falló')

  const durMatch = json.result.match(/<p>(\d{2}):(\d{2}):(\d{2})<\/p>/)
  let duracionMin = 0
  if (durMatch) duracionMin = parseInt(durMatch[1]) * 60 + parseInt(durMatch[2])

  let match
  if (duracionMin > 60) {
    match = json.result.match(/href='(https:\/\/video-[^']*?tag=sve_sd[^']*?)'/)
    if (!match) match = json.result.match(/href='(https:\/\/video-[^']*?tag=[^']*?)'/)
  } else {
    match = json.result.match(/720p[^<]*<a[^>]*href='(https:\/\/video-[^']*?)'/)
    if (!match) match = json.result.match(/href='(https:\/\/video-[^']*?tag=sve_sd[^']*?)'/)
    if (!match) match = json.result.match(/href='(https:\/\/video-[^']*?tag=[^']*?)'/)
  }
  if (!match) throw new Error('kfvid sin enlace')
  return { url: match[1].replace(/&amp;/g, '&'), title: '' }
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUENTES ORDENADAS
// ═══════════════════════════════════════════════════════════════════════════

const sources = [
  { name: 'Apinexus', fn: sourceApinexus },
  { name: 'YOSOYYO',  fn: sourceYosoyyo },
  { name: 'kfvid',    fn: sourceKfvid },
]

// ═══════════════════════════════════════════════════════════════════════════
//  COMANDO
// ═══════════════════════════════════════════════════════════════════════════

export default {
  command: ['fb', 'facebook','fbdl'],
  tag: 'facebook',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de Facebook',

  async execute(sock, msg, { from, args, prefix }) {
    if (!args.length) return sock.sendMessage(from, { 
      text: '🌸 Pásame el enlace del video de Facebook que quieres descargar.'
    }, { quoted: msg })

    const url = args[0]

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let result = null
      for (const source of sources) {
        try {
          console.log(`[fb] 🔍 ${source.name}...`)
          result = await source.fn(url)
          console.log(`[fb] ✅ ${source.name}`)
          break
        } catch (err) {
          console.log(`[fb] ❌ ${source.name}: ${err.message}`)
        }
      }

      if (!result?.url) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      // Descargar
      const fileRes = await axios.get(result.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA },
        timeout: 300000
      })

      const rawBuffer = Buffer.from(fileRes.data)

      if (rawBuffer.length === 0) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      // Procesar con ffmpeg
      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.tmp`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}.mp4`)
      writeFileSync(tmpInput, rawBuffer)

      await execFileAsync(ffmpegPath, [
        '-i', tmpInput, '-c', 'copy', '-movflags', '+faststart', '-y', tmpOutput
      ])

      const buffer = fs.readFileSync(tmpOutput)
      const sizeMB = statSync(tmpOutput).size / (1024 * 1024)

      unlinkSync(tmpInput)
      unlinkSync(tmpOutput)

      const title = result.title || 'Facebook'
      let enviado

      if (sizeMB < 50) {
        enviado = await sock.sendMessage(from, {
          video: buffer,
          mimetype: 'video/mp4'
        }, { quoted: msg })
      } else {
        enviado = await sock.sendMessage(from, {
          document: buffer,
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      if (enviado) await sock.sendMessage(from, { react: { text: '🌱', key: enviado.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}