// utils/video.js

import fs from 'fs'
import axios from 'axios'
import fg from 'fg-senna'
import { execFile } from 'child_process'
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
//  SCRAPER 2: y2mate (cnv.cx)
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
    timeout: 30000
  })

  if (convertRes.data?.status === 'tunnel' && convertRes.data?.url) {
    return { url: convertRes.data.url, title: convertRes.data.filename }
  }
  throw new Error('y2mate falló')
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCRAPER 3: app.ytdown.to
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
//  API 4: Apinexus v2
// ═══════════════════════════════════════════════════════════════════════════

async function sourceApinexusV2(videoUrl) {
  const { data } = await axios.post('https://panel.apinexus.fun/api/youtube/v2/mp4', { url: videoUrl }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.data?.video) throw new Error('Apinexus v2 sin video')
  return { url: data.data.video, title: data.data.titulo }
}

// ═══════════════════════════════════════════════════════════════════════════
//  API 5: Apinexus v1
// ═══════════════════════════════════════════════════════════════════════════

async function sourceApinexusV1(videoUrl) {
  const { data } = await axios.post('https://panel.apinexus.fun/api/youtube/mp4', { url: videoUrl }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.data?.video) throw new Error('Apinexus v1 sin video')
  return { url: data.data.video, title: data.data.titulo }
}

// ═══════════════════════════════════════════════════════════════════════════
//  APIs PrinceTech (6-11)
// ═══════════════════════════════════════════════════════════════════════════

async function princeGet(endpoint, videoUrl) {
  const { data } = await axios.get(`https://api.princetechn.com/api/download/${endpoint}?apikey=prince&url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
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
//  API 12: Delirius
// ═══════════════════════════════════════════════════════════════════════════

async function sourceDelirius(videoUrl) {
  const { data } = await axios.get(`https://api.delirius.store/download/ytmp4?url=${encodeURIComponent(videoUrl)}&format=360p`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.data?.download) throw new Error('Delirius sin video')
  return { url: data.data.download, title: data.data.title }
}

// ═══════════════════════════════════════════════════════════════════════════
//  API 13-14: EliteProTech
// ═══════════════════════════════════════════════════════════════════════════

async function sourceEliteYtmp4(videoUrl) {
  const { data } = await axios.get(`https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.result?.url) throw new Error('EliteProTech ytmp4 sin video')
  return { url: data.result.url, title: data.result.title }
}

async function sourceEliteYtdown(videoUrl) {
  const { data } = await axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(videoUrl)}&format=mp4`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.downloadURL) throw new Error('EliteProTech ytdown sin video')
  return { url: data.downloadURL, title: data.title }
}

// ═══════════════════════════════════════════════════════════════════════════
//  API 15: FG-Senna
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
//  FUENTES ORDENADAS
// ═══════════════════════════════════════════════════════════════════════════

const sources = [
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
//  FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export async function downloadVideo(videoUrl) {
  for (const source of sources) {
    try {
      console.log(`[video] 🔍 ${source.name}...`)
      const result = await source.fn(videoUrl)
      console.log(`[video] ✅ ${source.name}`)

      // Descargar
      const fileRes = await axios.get(result.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA },
        timeout: 300000
      })

      const rawBuffer = Buffer.from(fileRes.data)

      // Verificar tamaño máximo 600MB
      const rawSizeMB = rawBuffer.length / (1024 * 1024)
      if (rawSizeMB > 600) {
        console.log(`[video] ⚠️ ${source.name}: ${rawSizeMB.toFixed(0)}MB > 600MB, probando otra...`)
        continue
      }

      // Procesar con ffmpeg
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