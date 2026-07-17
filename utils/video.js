// utils/video.js

import fs from 'fs'
import axios from 'axios'
import fg from 'fg-senna'
import { execFile, execSync } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import ffmpegPath from 'ffmpeg-static'

const execFileAsync = promisify(execFile)
const API_KEY = 'antbx21e5jhac'
const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0'
const MEDIA_DIR = join(process.cwd(), 'media', 'videos')

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ═══════════════════════════════════════════════════════════════════════════
//  API: Lempy
// ═══════════════════════════════════════════════════════════════════════════

async function sourceLempy(videoUrl) {
  const { data } = await axios.get(`https://api.lempi.lat/dl/ytv?url=${encodeURIComponent(videoUrl)}&apikey=lem851`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.descarga?.url) throw new Error('Lempy sin video')
  return { url: data.descarga.url, title: data.titulo }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCRAPER: y2mate (cnv.cx)
// ═══════════════════════════════════════════════════════════════════════════

async function sourceY2mate(videoUrl) {
  const keyRes = await axios.get('https://cnv.cx/v2/sanity/key', {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Referer': 'https://iframe.y2meta-uk.com/', 'Origin': 'https://iframe.y2meta-uk.com' }
  })
  const apiKey = keyRes.data.key

  const params = new URLSearchParams({
    link: videoUrl, format: 'mp4', audioBitrate: '128', videoQuality: '360',
    filenameStyle: 'pretty', vCodec: 'h264'
  })

  const convertRes = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
    headers: {
      'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', 'key': apiKey,
      'Origin': 'https://iframe.y2meta-uk.com', 'Referer': 'https://iframe.y2meta-uk.com/'
    },
    timeout: 60000
  })

  if (convertRes.data?.status === 'tunnel' && convertRes.data?.url) {
    return { url: convertRes.data.url, title: convertRes.data.filename }
  }
  throw new Error('y2mate falló')
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCRAPER: app.ytdown.to
// ═══════════════════════════════════════════════════════════════════════════

async function sourceYtdownTo(videoUrl) {
  const BASE = 'https://app.ytdown.to'
  const HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest', 'Origin': BASE,
    'Referer': BASE + '/en27/', 'User-Agent': UA
  }

  const body = new URLSearchParams({ url: videoUrl }).toString()
  const { data } = await axios.post(`${BASE}/proxy.php`, body, { headers: HEADERS, timeout: 15000 })
  const api = data?.api

  if (!api || api.status !== 'ok') throw new Error('ytdown.to búsqueda falló')

  const videos = api.mediaItems.filter(m => m.type === 'Video')
  if (!videos.length) throw new Error('Sin videos')

  const elegido = videos.find(v => v.mediaRes?.includes('360')) ||
                  videos.find(v => v.mediaRes?.includes('480')) ||
                  videos.find(v => v.mediaRes?.includes('240')) ||
                  videos[0]

  let status = await axios.post(`${BASE}/proxy.php`,
    new URLSearchParams({ url: elegido.mediaUrl }).toString(),
    { headers: HEADERS, timeout: 15000 }
  ).then(r => r.data?.api)

  let intentos = 0
  while (status?.status !== 'completed' && intentos < 30) {
    await sleep(3000)
    status = await axios.post(`${BASE}/proxy.php`,
      new URLSearchParams({ url: elegido.mediaUrl }).toString(),
      { headers: HEADERS, timeout: 15000 }
    ).then(r => r.data?.api)
    intentos++
  }

  if (status?.status === 'completed' && status?.fileUrl) {
    return { url: status.fileUrl, title: api.title }
  }
  throw new Error('ytdown.to descarga falló')
}

// ═══════════════════════════════════════════════════════════════════════════
//  API: Apinexus v2
// ═══════════════════════════════════════════════════════════════════════════

async function sourceApinexusV2(videoUrl) {
  const { data } = await axios.post('https://panel.apinexus.fun/api/youtube/v2/mp4', { url: videoUrl }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.data?.video) throw new Error('Apinexus v2 sin video')
  return { url: data.data.video, title: data.data.titulo }
}

// ═══════════════════════════════════════════════════════════════════════════
//  API: Apinexus v1
// ═══════════════════════════════════════════════════════════════════════════

async function sourceApinexusV1(videoUrl) {
  const { data } = await axios.post('https://panel.apinexus.fun/api/youtube/mp4', { url: videoUrl }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.data?.video) throw new Error('Apinexus v1 sin video')
  return { url: data.data.video, title: data.data.titulo }
}

// ═══════════════════════════════════════════════════════════════════════════
//  APIs PrinceTech
// ═══════════════════════════════════════════════════════════════════════════

async function princeGet(endpoint, videoUrl) {
  const { data } = await axios.get(`https://api.princetechn.com/api/download/${endpoint}?apikey=prince&url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 60000
  })
  if (!data?.success) throw new Error(`PrinceTech ${endpoint} falló`)
  const r = data.result
  return { url: r.download_url || r.video_url, title: r.title, quality: r.quality || r.video_quality }
}

async function sourcePrinceYtdl(videoUrl)   { return princeGet('ytdl', videoUrl) }
async function sourcePrinceYtdlv2(videoUrl) { return princeGet('ytdlv2', videoUrl) }
async function sourcePrinceYtvideo(videoUrl){ return princeGet('ytvideo', videoUrl) }
async function sourcePrinceDlmp4(videoUrl)  { return princeGet('dlmp4', videoUrl) }
async function sourcePrinceYtv(videoUrl)    { return princeGet('ytv', videoUrl) }
async function sourcePrinceMp4(videoUrl)    { return princeGet('mp4', videoUrl) }

// ═══════════════════════════════════════════════════════════════════════════
//  API: Delirius
// ═══════════════════════════════════════════════════════════════════════════

async function sourceDelirius(videoUrl) {
  const { data } = await axios.get(`https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(videoUrl)}&format=360p`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.data?.download) throw new Error('Delirius sin video')
  return { url: data.data.download, title: data.data.title }
}

// ═══════════════════════════════════════════════════════════════════════════
//  APIs EliteProTech
// ═══════════════════════════════════════════════════════════════════════════

async function sourceEliteYtmp4(videoUrl) {
  const { data } = await axios.get(`https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 60000
  })
  if (!data?.status || !data?.result?.url) throw new Error('EliteProTech ytmp4 sin video')
  return { url: data.result.url, title: data.result.title }
}

async function sourceEliteYtdown(videoUrl) {
  const { data } = await axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(videoUrl)}&format=mp4`, {
    headers: { 'User-Agent': UA }, timeout: 60000
  })
  if (!data?.success || !data?.downloadURL) throw new Error('EliteProTech ytdown sin video')
  return { url: data.downloadURL, title: data.title }
}

// ═══════════════════════════════════════════════════════════════════════════
//  API: FG-Senna
// ═══════════════════════════════════════════════════════════════════════════

async function sourceFgSenna(videoUrl) {
  const qualities = ['360p', '480p', '720p', '240p', '144p']
  for (const q of qualities) {
    try {
      const res = await fg.ytv(videoUrl, q)
      if (res && res.dl_url) return { url: res.dl_url, title: res.title }
    } catch {}
  }
  throw new Error('FG-Senna falló')
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUENTES PARA VIDEOS LARGOS
// ═══════════════════════════════════════════════════════════════════════════

const LARGE_SOURCES = [
  { name: 'Lempy',           fn: sourceLempy },
  { name: 'Elite ytdown',   fn: sourceEliteYtdown },
  { name: 'y2mate',         fn: sourceY2mate },
  { name: 'ytdown.to',      fn: sourceYtdownTo },
  { name: 'Prince ytdl',    fn: sourcePrinceYtdl },
  { name: 'Prince ytdlv2',  fn: sourcePrinceYtdlv2 },
  { name: 'Prince ytvideo', fn: sourcePrinceYtvideo },
  { name: 'Prince dlmp4',   fn: sourcePrinceDlmp4 },
  { name: 'Prince ytv',     fn: sourcePrinceYtv },
  { name: 'Prince mp4',     fn: sourcePrinceMp4 },
  { name: 'Elite ytmp4',    fn: sourceEliteYtmp4 },
  { name: 'FG-Senna',       fn: sourceFgSenna },
]

// ═══════════════════════════════════════════════════════════════════════════
//  FUNCIÓN PARA VIDEOS LARGOS
// ═══════════════════════════════════════════════════════════════════════════

export async function downloadVideoLarge(videoUrl) {
  for (const source of LARGE_SOURCES) {
    try {
      console.log(`[video-large] 🔍 ${source.name}...`)
      const result = await source.fn(videoUrl)
      console.log(`[video-large] ✅ ${source.name}`)

      const safeTitle = (result.title || 'video')
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50)
      const fileName = `${Date.now()}_${safeTitle}.mp4`
      const localPath = join(MEDIA_DIR, fileName)

      console.log(`[video-large] 📥 Descargando a ${localPath}...`)
      
      const writer = fs.createWriteStream(localPath)
      const response = await axios({
        method: 'GET',
        url: result.url,
        responseType: 'stream',
        headers: { 'User-Agent': UA },
        timeout: 600000
      })

      response.data.pipe(writer)
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      const stats = fs.statSync(localPath)
      const sizeMB = stats.size / (1024 * 1024)
      console.log(`[video-large] 📦 Descargado: ${sizeMB.toFixed(2)} MB`)

      // Procesar con ffmpeg
      const processedPath = join(MEDIA_DIR, `proc_${fileName}`)
      try {
        execSync(`"${ffmpegPath}" -i "${localPath}" -c copy -movflags +faststart -y "${processedPath}"`, { stdio: 'pipe' })
      } catch {
        console.log(`[video-large] ⚠️ ffmpeg falló, usando archivo original`)
        const origStats = fs.statSync(localPath)
        return {
          filePath: localPath,
          title: result.title || 'video',
          sizeMB: origStats.size / (1024 * 1024),
          duration: 0
        }
      }
      
      const processedStats = fs.statSync(processedPath)
      const processedSizeMB = processedStats.size / (1024 * 1024)

      let duration = 0
      try {
        const probe = execSync(`"${ffmpegPath}" -i "${processedPath}" 2>&1 | grep Duration`, { encoding: 'utf-8' })
        const match = probe.match(/Duration: (\d+):(\d+):(\d+\.\d+)/)
        if (match) {
          duration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])
        }
      } catch {}

      fs.unlinkSync(localPath)

      return {
        filePath: processedPath,
        title: result.title || 'video',
        sizeMB: processedSizeMB,
        duration
      }

    } catch (err) {
      console.log(`[video-large] ❌ ${source.name}: ${err.message}`)
    }
  }

  throw new Error('Todas las fuentes para videos largos fallaron')
}

// ═══════════════════════════════════════════════════════════════════════════
//  FUENTES NORMALES
// ═══════════════════════════════════════════════════════════════════════════

const sources = [
  { name: 'Lempy',           fn: sourceLempy },
  { name: 'y2mate',         fn: sourceY2mate },
  { name: 'ytdown.to',      fn: sourceYtdownTo },
  { name: 'Apinexus v2',    fn: sourceApinexusV2 },
  { name: 'Apinexus v1',    fn: sourceApinexusV1 },
  { name: 'Prince ytdl',    fn: sourcePrinceYtdl },
  { name: 'Prince ytdlv2',  fn: sourcePrinceYtdlv2 },
  { name: 'Prince ytvideo', fn: sourcePrinceYtvideo },
  { name: 'Prince dlmp4',   fn: sourcePrinceDlmp4 },
  { name: 'Prince ytv',     fn: sourcePrinceYtv },
  { name: 'Prince mp4',     fn: sourcePrinceMp4 },
  { name: 'Delirius',       fn: sourceDelirius },
  { name: 'Elite ytmp4',    fn: sourceEliteYtmp4 },
  { name: 'Elite ytdown',   fn: sourceEliteYtdown },
  { name: 'FG-Senna',       fn: sourceFgSenna },
]

// ═══════════════════════════════════════════════════════════════════════════
//  FUNCIÓN PARA VIDEOS NORMALES
// ═══════════════════════════════════════════════════════════════════════════

export async function downloadVideo(videoUrl) {
  for (const source of sources) {
    try {
      console.log(`[video] 🔍 ${source.name}...`)
      const result = await source.fn(videoUrl)
      console.log(`[video] ✅ ${source.name}`)

      const fileRes = await axios.get(result.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA },
        timeout: 300000
      })

      const rawBuffer = Buffer.from(fileRes.data)

      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.tmp`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}.mp4`)
      fs.writeFileSync(tmpInput, rawBuffer)

      await execFileAsync(ffmpegPath, [
        '-i', tmpInput, '-c', 'copy', '-movflags', '+faststart', '-y', tmpOutput
      ])

      const buffer = fs.readFileSync(tmpOutput)
      fs.unlinkSync(tmpInput)
      fs.unlinkSync(tmpOutput)

      return {
        buffer,
        title: result.title || 'video',
        sizeMB: buffer.length / (1024 * 1024)
      }

    } catch (err) {
      console.log(`[video] ❌ ${source.name}: ${err.message}`)
    }
  }

  throw new Error('Todas las fuentes fallaron')
}