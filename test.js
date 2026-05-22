// test_cnvmp3.js

import axios from 'axios'
import fs from 'fs'

const UA = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'

async function test() {
  const videoUrl = process.argv[2] || 'https://youtu.be/VMp55KH_3wo'
  const videoId = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?]|$)/)?.[1]
  
  console.log('🎯 Video ID:', videoId)

  try {
    // Paso 1: check_database
    console.log('\n📤 check_database...')
    const checkRes = await axios.post('https://cnvmp3.com/check_database.php', {
      youtube_id: videoId, quality: 360, formatValue: 0
    }, {
      headers: {
        'User-Agent': UA, 'Accept': '*/*', 'Content-Type': 'application/json',
        'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54'
      },
      timeout: 15000
    })

    console.log('📦 check_database:', checkRes.data?.success ? 'EXISTE' : 'NO EXISTE')

    if (checkRes.data?.success && checkRes.data?.data?.server_path) {
      const downloadUrl = checkRes.data.data.server_path.replace(/&/g, '%26').replace(/#/g, '%23').replace(/\+/g, '%2B')
      console.log('✅ Ya existe en caché')
      console.log('🔗 URL:', downloadUrl)
      
      // Descargar y verificar
      console.log('\n📥 Descargando...')
      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA, 'Referer': 'https://cnvmp3.com/' },
        timeout: 60000
      })

      const buffer = Buffer.from(fileRes.data)
      console.log('📦 Tamaño:', (buffer.length / (1024 * 1024)).toFixed(2), 'MB')
      console.log('🔍 Primeros bytes:', buffer.slice(0, 10).toString('hex'))
      
      // Verificar si es HTML (error) o video
      const firstBytes = buffer.slice(0, 20).toString()
      if (firstBytes.includes('<html') || firstBytes.includes('<!DOCTYPE')) {
        console.log('❌ El archivo es HTML, no un video!')
      } else if (buffer.length < 50000) {
        console.log('❌ Archivo muy pequeño, probablemente no es video')
      } else {
        console.log('✅ Parece un video válido')
        fs.writeFileSync('test_cnvmp3.mp4', buffer)
        console.log('💾 Guardado como test_cnvmp3.mp4')
      }
      return
    }

    // Paso 2: get_video_data
    console.log('\n📤 get_video_data...')
    const videoDataRes = await axios.post('https://cnvmp3.com/get_video_data.php', {
      url: `https://www.youtube.com/watch?v=${videoId}`, token: '1234'
    }, {
      headers: {
        'User-Agent': UA, 'Accept': '*/*', 'Content-Type': 'application/json',
        'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54'
      },
      timeout: 15000
    })

    console.log('📝 Título:', videoDataRes.data?.title || 'NO TÍTULO')

    if (!videoDataRes.data?.title) {
      console.log('❌ No se obtuvo título')
      return
    }

    const title = videoDataRes.data.title

    // Paso 3: download_video_ucep
    console.log('\n📤 download_video_ucep...')
    const downloadRes = await axios.post('https://cnvmp3.com/download_video_ucep.php', {
      url: `https://www.youtube.com/watch?v=${videoId}`, quality: 360, title, formatValue: 0
    }, {
      headers: {
        'User-Agent': UA, 'Accept': '*/*', 'Content-Type': 'application/json',
        'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54'
      },
      timeout: 60000
    })

    console.log('📦 download_link:', downloadRes.data?.download_link ? 'SÍ' : 'NO')

    if (downloadRes.data?.download_link) {
      const downloadUrl = downloadRes.data.download_link.replace(/&/g, '%26').replace(/#/g, '%23').replace(/\+/g, '%2B')
      console.log('🔗 URL:', downloadUrl)

      // Descargar y verificar
      console.log('\n📥 Descargando...')
      const fileRes = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA, 'Referer': 'https://cnvmp3.com/' },
        timeout: 60000
      })

      const buffer = Buffer.from(fileRes.data)
      console.log('📦 Tamaño:', (buffer.length / (1024 * 1024)).toFixed(2), 'MB')
      console.log('🔍 Primeros bytes:', buffer.slice(0, 10).toString('hex'))

      const firstBytes = buffer.slice(0, 20).toString()
      if (firstBytes.includes('<html') || firstBytes.includes('<!DOCTYPE')) {
        console.log('❌ El archivo es HTML, no un video!')
      } else if (buffer.length < 50000) {
        console.log('❌ Archivo muy pequeño, probablemente no es video')
      } else {
        console.log('✅ Parece un video válido')
        fs.writeFileSync('test_cnvmp3.mp4', buffer)
        console.log('💾 Guardado como test_cnvmp3.mp4')
      }
    } else {
      console.log('❌ No download_link')
    }

  } catch (err) {
    console.error('❌ Error:', err.response?.status, err.message)
    if (err.response?.data) {
      console.error('Data:', typeof err.response.data === 'string' ? err.response.data.slice(0, 300) : JSON.stringify(err.response.data).slice(0, 300))
    }
  }
}

test()