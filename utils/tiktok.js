// utils/tiktok.js
import axios from 'axios'

/**
 * Extrae la información de medios de TikTok usando TikWM
 */
export async function downloadTikTokMedia(tiktokUrl) {
  try {
    const params = new URLSearchParams()
    params.append('url', tiktokUrl)
    params.append('hd', '1')

    const { data } = await axios.post('https://tikwm.com/api/', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01'
      }
    })

    if (!data || data.code !== 0 || !data.data) {
      throw new Error(data.msg || 'No se pudo procesar el post.')
    }

    const info = data.data
    const title = info.title || 'TikTok Media'

    if (info.images && Array.isArray(info.images)) {
      return { status: true, isVideo: false, title, media: info.images }
    }

    if (info.play) {
      return { status: true, isVideo: true, title, media: [info.hdplay || info.play] }
    }

    return { status: false, isVideo: false, title, media: [] }
  } catch {
    return { status: false, isVideo: false, title: '', media: [] }
  }
}

/**
 * Descarga una URL de medios y la convierte en un Buffer nativo
 */
export async function downloadMediaBuffer(mediaUrl) {
  const response = await axios.get(mediaUrl, {
    responseType: 'arraybuffer',
    timeout: 60000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  })
  return Buffer.from(response.data)
}