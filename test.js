// test_mp4.js

import axios from 'axios'

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
const TOKEN = 'dIXJ7vL4KZ2Rrg6t'

async function test() {
  const videoUrl = 'https://youtu.be/wHOFramVAs0'
  const videoId = 'wHOFramVAs0'

  try {
    // Init
    const initRes = await axios.get('https://eta.etacloud.org/api/v1/init?_=' + Date.now(), {
      headers: {
        'User-Agent': UA,
        'Authorization': `Bearer ${TOKEN}`,
        'Origin': 'https://v3.y2mate.nu',
        'Referer': 'https://v3.y2mate.nu/'
      }
    })

    const convertURL = initRes.data.convertURL
    const sig = convertURL.match(/sig=([^&]+)/)?.[1]
    if (!sig) return console.log('❌ No sig')

    // Extraer el subdominio del convertURL para usarlo en progress y download
    const domain = new URL(convertURL).hostname
    console.log('🌐 Dominio:', domain)
    console.log('🔐 Sig:', sig.slice(0, 30) + '...')

    // Disparar convert
    console.log('🔄 Iniciando...')
    await axios.get(`${convertURL}&v=${videoId}&f=mp4`, {
      headers: {
        'User-Agent': UA,
        'Origin': 'https://v3.y2mate.nu',
        'Referer': 'https://v3.y2mate.nu/'
      }
    })

    // Esperar progress usando el mismo dominio
    console.log('⏳ Esperando...')
    let completed = false
    for (let i = 0; i < 15 && !completed; i++) {
      await new Promise(r => setTimeout(r, 3000))
      
      const progressUrl = `https://${domain}/api/v1/progress?sig=${encodeURIComponent(sig)}&_=${Date.now()}`
      try {
        const progRes = await axios.get(progressUrl, {
          headers: {
            'User-Agent': UA,
            'Origin': 'https://v3.y2mate.nu',
            'Referer': 'https://v3.y2mate.nu/'
          }
        })
        console.log(`⏳ ${i + 1}: progress=${progRes.data.progress}`)
        if (progRes.data.progress >= 3) completed = true
      } catch (e) {
        console.log(`   ⚠️ Error progress: ${e.response?.status}`)
      }
    }

    if (!completed) {
      console.log('⚠️ No se completó, intentando descargar igual...')
    }

    // Descargar usando el mismo dominio
    const downloadUrl = `https://${domain}/api/v1/download?sig=${encodeURIComponent(sig)}&v=${videoId}&f=mp4&r=y2mate.nu`
    console.log('🔗 URL:', downloadUrl.slice(0, 80) + '...')
    console.log('📥 Descargando...')

    const fileRes = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': UA, 'Referer': 'https://v3.y2mate.nu/' },
      timeout: 120000
    })

    const fs = await import('fs')
    fs.writeFileSync('test_y2mate.mp4', Buffer.from(fileRes.data))
    console.log('✅ Guardado:', (fileRes.data.length / (1024 * 1024)).toFixed(2), 'MB')

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

test()