// plugins/spotify.js
import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import WebSocket from 'ws'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const execFileAsync = promisify(execFile)
const MEDIA_DIR = join(process.cwd(), 'media')
if (!existsSync(MEDIA_DIR)) {
  await mkdir(MEDIA_DIR, { recursive: true }).catch(() => {})
}

const BASE = 'https://spomp3.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0'

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function downloadWithProgress(sock, from, msg, taskId, fileName, title, artist, cover, duration) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://spomp3.com/ws/status/${taskId}`, {
      headers: {
        'User-Agent': UA,
        'Origin': BASE
      }
    })

    let lastPct = 0

    ws.on('message', async (data) => {
      const res = JSON.parse(data)
      if (res.state === 'PROGRESS') {
        const pct = parseInt(res.current) || 0
        if (pct >= lastPct + 20) { // Reducido para no saturar el log
          lastPct = pct
          await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } }).catch(() => {})
        }
      }
      if (res.state === 'SUCCESS') {
        ws.close()
        const downloadPath = res.songs[0].download_path
        const downloadUrl = `${BASE}/files/${downloadPath}`
        resolve({ downloadUrl, fileName, title, artist, cover, duration })
      }
    })

    ws.on('error', reject)
  })
}

export default {
  command: ['spotify', 'sp'],
  tag: 'spotify',
  categoria: 'descargas',
  descripcion: 'Descarga musicas de spotify',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '✦ Ingresa el nombre de la canción o un enlace de Spotify.'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const cookieJar = new CookieJar()
      const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true, timeout: 30000 }))
      await client.get(`${BASE}/es/`, { headers: { 'User-Agent': UA } })

      const infoRes = await axios.post(`${BASE}/process_input`,
        { url: query },
        { headers: { 'User-Agent': UA, 'origin': BASE, 'referer': `${BASE}/es/` } }
      )
      const info = infoRes.data

      let trackName = 'Spotify Track'
      let artist = 'Desconocido'
      let cover = ''
      let duration = 'N/A'
      let spotifyUrl = query.includes('spotify.com') ? query : 'https://open.spotify.com'

      if (info.type === 'search' && info.tracks?.length > 0) {
        const track = info.tracks[0]
        trackName = track.name
        artist = track.artist
        cover = track.cover
        duration = track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}:${String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}` : 'N/A'
        spotifyUrl = `https://open.spotify.com/track/${track.spotify_id}`
      }

      // Diseño unificado de pre-carga
      if (cover) {
        await sock.sendMessage(from, {
          image: { url: cover },
          caption: `✦ *${trackName}*\n✦ *Artista:* ${artist}\n✦ *Link:* ${spotifyUrl}\n✦ *Duración:* ${duration}\n\n⬇️ *Procesando audio...*`
        }, { quoted: msg })
      }

      const payload = info.type === 'search' && info.tracks?.length > 0
        ? {
            name: trackName,
            artist: artist,
            cover: cover,
            duration_ms: info.tracks[0].duration_ms,
            spotify_id: info.tracks[0].spotify_id,
            source: info.tracks[0].source || 'youtube'
          }
        : { url: query }

      const endpoint = info.type === 'search' ? `${BASE}/download/search-track` : `${BASE}/download/spotify`

      await sleep(2000)

      const dlRes = await axios.post(endpoint, payload, {
        headers: {
          'User-Agent': UA,
          'origin': BASE,
          'referer': `${BASE}/es/`,
          'accept': 'application/json',
          'x-requested-with': 'XMLHttpRequest'
        }
      })

      if (!dlRes.data.task_id) throw new Error('No se pudo iniciar la descarga')

      const { downloadUrl } = await downloadWithProgress(
        sock, from, msg, dlRes.data.task_id, trackName, trackName, artist, cover, duration
      )

      const audioRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 600000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      })

      const rawBuffer = Buffer.from(audioRes.data)

      const tmpInput = join(MEDIA_DIR, `${Date.now()}_in.tmp`)
      const tmpOutput = join(MEDIA_DIR, `${Date.now()}_out.mp3`)

      await writeFile(tmpInput, rawBuffer)
      await execFileAsync('ffmpeg', [
        '-i', tmpInput,
        '-c:a', 'libmp3lame',
        '-b:a', '320k',
        '-q:a', '0',
        '-map_metadata', '-1',
        '-threads', '0',
        '-y',
        tmpOutput
      ])

      const mp3Buffer = await readFile(tmpOutput)
      await unlink(tmpInput).catch(() => {})
      await unlink(tmpOutput).catch(() => {})

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const cleanName = `${trackName.replace(/[<>:"/\\|?*]/g, '')}.mp3`

      // Enviar audio con diseño oficial
      await sock.sendMessage(from, {
        audio: mp3Buffer,
        mimetype: 'audio/mpeg',
        fileName: cleanName,
        ptt: false
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('[SPOTIFY] Error:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}