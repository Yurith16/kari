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
const MEDIA_DIR = join(process.cwd(), 'media', 'audios')

if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
}

async function sourceLempy(videoUrl) {
  const { data } = await axios.get(`https://api.lempi.lat/dl/yta?url=${encodeURIComponent(videoUrl)}&apikey=lem851`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.descarga?.url) throw new Error('Lempy sin audio')
  return { url: data.descarga.url, title: data.titulo }
}

async function sourceAzbry(videoUrl) {
  const { data } = await axios.get(`https://api.azbry.com/api/download/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.result?.download) throw new Error('Azbry sin audio')
  return { url: data.result.download, title: data.result.title }
}

async function sourceMp3yt(videoUrl) {
  const headers = {
    'User-Agent': UA,
    'Accept': '*/*',
    'Origin': 'https://mp3yt.is',
    'Referer': 'https://mp3yt.is/'
  }

  const keyRes = await axios.get('https://cnv.cx/v2/sanity/key', { headers })
  const apiKey = keyRes.data.key

  const params = new URLSearchParams({
    link: videoUrl, format: 'mp3', audioBitrate: '320', videoQuality: '1080', vCodec: 'h264'
  })

  const convertRes = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'key': apiKey },
    timeout: 30000
  })

  if (convertRes.data?.status === 'tunnel' && convertRes.data?.url) {
    return { url: convertRes.data.url, title: convertRes.data.filename || '' }
  }
  throw new Error('mp3yt falló')
}

async function sourceApinexus(videoUrl, version) {
  const urls = {
    v1: 'https://panel.apinexus.fun/api/youtube/mp3',
    v2: 'https://panel.apinexus.fun/api/youtube/v2/mp3',
    v3: 'https://panel.apinexus.fun/api/youtube/v3/mp3',
    v4: 'https://panel.apinexus.fun/api/youtube/v4/mp3'
  }
  const { data } = await axios.post(urls[version], { url: videoUrl }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.data?.audio) throw new Error(`Apinexus ${version} sin audio`)
  return { url: data.data.audio, title: data.data.titulo }
}

async function sourceApinexusV1(videoUrl) { return sourceApinexus(videoUrl, 'v1') }
async function sourceApinexusV2(videoUrl) { return sourceApinexus(videoUrl, 'v2') }
async function sourceApinexusV3(videoUrl) { return sourceApinexus(videoUrl, 'v3') }
async function sourceApinexusV4(videoUrl) { return sourceApinexus(videoUrl, 'v4') }

async function princeGet(endpoint, videoUrl) {
  const { data } = await axios.get(`https://api.princetechn.com/api/download/${endpoint}?apikey=prince&url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success) throw new Error(`PrinceTech ${endpoint} falló`)
  const r = data.result
  return { url: r.download_url || r.audio_url, title: r.title }
}

async function sourcePrinceYta(videoUrl)    { return princeGet('yta', videoUrl) }
async function sourcePrinceYtmp3(videoUrl)  { return princeGet('ytmp3', videoUrl) }
async function sourcePrinceYtdl(videoUrl)   { return princeGet('ytdl', videoUrl) }
async function sourcePrinceYtdlv2(videoUrl) { return princeGet('ytdlv2', videoUrl) }
async function sourcePrinceDlmp3(videoUrl)  { return princeGet('dlmp3', videoUrl) }
async function sourcePrinceYtmusic(videoUrl){ return princeGet('ytmusic', videoUrl) }

async function sourceEliteYtdown(videoUrl) {
  const { data } = await axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(videoUrl)}&format=mp3`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.downloadURL) throw new Error('EliteProTech ytdown sin audio')
  return { url: data.downloadURL, title: data.title }
}

async function sourceEliteYtmp3(videoUrl) {
  const { data } = await axios.get(`https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.result?.download) throw new Error('EliteProTech ytmp3 sin audio')
  return { url: data.result.download, title: data.result.title }
}

async function sourceDeliriusV1(videoUrl) {
  const { data } = await axios.get(`https://api.delirius.store/download/ytmp3?url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.status || !data?.data?.download) throw new Error('Delirius v1 sin audio')
  return { url: data.data.download, title: data.data.title }
}

async function sourceDeliriusV2(videoUrl) {
  const { data } = await axios.get(`https://api.delirius.store/download/ytmp3v2?url=${encodeURIComponent(videoUrl)}`, {
    headers: { 'User-Agent': UA }, timeout: 15000
  })
  if (!data?.success || !data?.data?.download) throw new Error('Delirius v2 sin audio')
  return { url: data.data.download, title: data.data.title }
}

async function sourceFgSenna(videoUrl) {
  const res = await fg.yta(videoUrl)
  if (res && res.dl_url) return { url: res.dl_url, title: res.title }
  throw new Error('FG-Senna falló')
}

async function sourceCnvmp3(videoUrl) {
  const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)?.[1]

  const checkRes = await axios.post('https://cnvmp3.com/check_database.php', {
    youtube_id: videoId, quality: 4, formatValue: 1
  }, {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Content-Type': 'application/json', 'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54' },
    timeout: 15000
  })

  if (checkRes.data?.success && checkRes.data?.data?.server_path) {
    return {
      url: checkRes.data.data.server_path,
      title: checkRes.data.data.title
    }
  }

  const videoDataRes = await axios.post('https://cnvmp3.com/get_video_data.php', {
    url: `https://www.youtube.com/watch?v=${videoId}`, token: '1234'
  }, {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Content-Type': 'application/json', 'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54' },
    timeout: 15000
  })

  const title = videoDataRes.data?.title

  const downloadRes = await axios.post('https://cnvmp3.com/download_video_ucep.php', {
    url: `https://www.youtube.com/watch?v=${videoId}`, quality: 4, title, formatValue: 1
  }, {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Content-Type': 'application/json', 'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54' },
    timeout: 60000
  })

  if (downloadRes.data?.download_link) {
    return { url: downloadRes.data.download_link, title }
  }
  throw new Error('cnvmp3 falló')
}

async function sourceYtdlp(videoUrl) {
  const initRes = await axios.get('https://ytdlp.online/', { headers: { 'User-Agent': UA } })
  const cookies = initRes.headers['set-cookie']?.join('; ') || ''

  const command = `${videoUrl} -x --audio-format mp3`
  const streamUrl = `https://ytdlp.online/stream?command=${encodeURIComponent(command)}`

  let fileName = ''

  const response = await axios.get(streamUrl, {
    headers: { 'User-Agent': UA, 'Accept': 'text/event-stream', 'Cookie': cookies, 'Referer': 'https://ytdlp.online/' },
    responseType: 'stream', timeout: 240000
  })

  response.data.on('data', (chunk) => {
    const text = chunk.toString()
    let match = text.match(/Destination: download\/(.+\.(mp3|webm|m4a))/)
    if (!match) match = text.match(/\[ExtractAudio\] Destination: download\/(.+\.mp3)/)
    if (!match) match = text.match(/download\/(.+\.mp3) has already been downloaded/)
    if (!match) match = text.match(/download\/(.+\.mp3); file is already in target format/)
    if (match) fileName = match[1]
  })

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => fileName ? resolve() : reject(new Error('timeout')), 240000)
    response.data.on('end', () => { clearTimeout(timeout); resolve() })
    response.data.on('error', (err) => { clearTimeout(timeout); if (fileName) resolve(); else reject(err) })
  })

  if (fileName) {
    return {
      url: `https://ytdlp.online/download/${encodeURIComponent(fileName)}`,
      title: fileName.replace(/\.(mp3|webm|m4a)$/, '')
    }
  }
  throw new Error('ytdlp falló')
}

const sources = [
  { name: 'Lempy',            fn: sourceLempy },
  { name: 'Azbry',            fn: sourceAzbry },
  { name: 'mp3yt.is',         fn: sourceMp3yt },
  { name: 'Apinexus v2',      fn: sourceApinexusV2 },
  { name: 'Apinexus v1',      fn: sourceApinexusV1 },
  { name: 'Apinexus v3',      fn: sourceApinexusV3 },
  { name: 'Apinexus v4',      fn: sourceApinexusV4 },
  { name: 'Prince yta',       fn: sourcePrinceYta },
  { name: 'Prince ytmp3',     fn: sourcePrinceYtmp3 },
  { name: 'Prince ytdl',      fn: sourcePrinceYtdl },
  { name: 'Prince ytdlv2',    fn: sourcePrinceYtdlv2 },
  { name: 'Prince dlmp3',     fn: sourcePrinceDlmp3 },
  { name: 'Prince ytmusic',   fn: sourcePrinceYtmusic },
  { name: 'Elite ytdown',     fn: sourceEliteYtdown },
  { name: 'Elite ytmp3',      fn: sourceEliteYtmp3 },
  { name: 'Delirius v1',      fn: sourceDeliriusV1 },
  { name: 'Delirius v2',      fn: sourceDeliriusV2 },
  { name: 'FG-Senna',         fn: sourceFgSenna },
  { name: 'cnvmp3',           fn: sourceCnvmp3 },
  { name: 'ytdlp.online',     fn: sourceYtdlp },
]

export async function downloadAudio(videoUrl) {
  for (const source of sources) {
    try {
      console.log(`[audio] 🔍 ${source.name}...`)
      const result = await source.fn(videoUrl)
      console.log(`[audio] ✅ ${source.name}`)

      const fileRes = await axios.get(result.url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA },
        timeout: 300000
      })

      const rawBuffer = Buffer.from(fileRes.data)

      if (rawBuffer.length === 0) {
        console.log(`[audio] ⚠️ ${source.name}: archivo vacío`)
        continue
      }

      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.tmp`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}.mp3`)
      fs.writeFileSync(tmpInput, rawBuffer)

      await execFileAsync(ffmpegPath, [
        '-i', tmpInput,
        '-codec:a', 'libmp3lame',
        '-b:a', '320k',
        '-q:a', '0',
        '-y', tmpOutput
      ])

      const buffer = fs.readFileSync(tmpOutput)
      fs.unlinkSync(tmpInput)
      fs.unlinkSync(tmpOutput)

      return {
        buffer,
        title: result.title || 'audio',
        sizeMB: buffer.length / (1024 * 1024)
      }

    } catch (err) {
      console.log(`[audio] ❌ ${source.name}: ${err.message}`)
    }
  }

  throw new Error('Todas las fuentes fallaron')
}