// test-yt1d.js
import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'

async function getTokens() {
  const response = await axios.get('https://yt1d.io/en08yu/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0'
    }
  })
  
  const $ = cheerio.load(response.data)
  
  // Buscar el nonce en el formulario
  const yt1Nonce = $('#yt1_nonce').val()
  const wpHttpReferer = $('input[name="_wp_http_referer"]').val()
  
  // También buscar token y nonce para admin-ajax
  // (pueden estar en el JS o en data-attributes)
  
  console.log('yt1_nonce:', yt1Nonce)
  console.log('_wp_http_referer:', wpHttpReferer)
  
  return { yt1Nonce, wpHttpReferer }
}

async function searchVideo(url, yt1Nonce) {
  const formData = new URLSearchParams()
  formData.append('yt1_nonce', yt1Nonce)
  formData.append('_wp_http_referer', '/en08yu/')
  formData.append('yt_video_url', url)
  
  const response = await axios.post('https://yt1d.io/results/', formData.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://yt1d.io/en08yu/',
      'Origin': 'https://yt1d.io',
      'Cookie': 'pll_language=en'
    }
  })
  
  return response.data
}

const videoUrl = 'https://youtu.be/1a3REFH83WA'

console.log('1️⃣ Obteniendo tokens...')
const { yt1Nonce } = await getTokens()

if (!yt1Nonce) {
  console.log('❌ No se pudo obtener el nonce')
  process.exit(1)
}

console.log('2️⃣ Enviando video...')
const result = await searchVideo(videoUrl, yt1Nonce)
console.log('✅ Respuesta:', result.substring(0, 500))