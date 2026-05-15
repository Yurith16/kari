// test_calidades.js

import axios from 'axios'

const VIDEO_URL = process.argv[2] || 'https://youtu.be/Gqr6Zs2KSlk'
const CALIDADES = ['144', '240', '360', '480', '720', '1080']

async function test() {
  const API_KEY = await axios.get('https://cnv.cx/v2/sanity/key', {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': '*/*',
      'Referer': 'https://iframe.y2meta-uk.com/',
      'Origin': 'https://iframe.y2meta-uk.com'
    }
  }).then(r => r.data.key)

  console.log('🔑 Key:', API_KEY?.slice(0, 10) + '...')
  console.log('🔍 Probando:', VIDEO_URL)
  console.log('')

  for (const calidad of CALIDADES) {
    try {
      const params = new URLSearchParams({
        link: VIDEO_URL,
        format: 'mp4',
        audioBitrate: '128',
        videoQuality: calidad,
        filenameStyle: 'pretty',
        vCodec: 'h264'
      })

      const { data } = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'key': API_KEY,
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://iframe.y2meta-uk.com',
          'Referer': 'https://iframe.y2meta-uk.com/'
        },
        timeout: 15000
      })

      if (data?.status === 'tunnel' && data?.url) {
        console.log(`✅ ${calidad}p → OK`)
      } else {
        console.log(`❌ ${calidad}p → ${data?.status || 'sin respuesta'}`)
      }
    } catch (err) {
      console.log(`⚠️ ${calidad}p → ${err.message}`)
    }
  }
}

test()