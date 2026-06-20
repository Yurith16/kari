// test.js YJ-EspinoX -- Hernandez..
// Descargas de videos y musicas de YouTube...
// Es un poco lento, pero seguro...
// Compatible con videos y audios de mas de una hora de duración... 

import fs from 'fs'
import path from 'path'

const videoUrl = 'https://youtu.be/TGtWWb9emYI?si=cCG_hjvCHhoNzun2'
const format = process.argv[2] || 'mp3' // node test.js mp3 | node test.js 360
const outputDir = path.join(process.cwd(), 'pruebas')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

async function download() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
    'Accept': '*/*',
    'Accept-Language': 'es-ES,es;q=0.9',
    'Referer': 'https://en.loader.to/',
    'Origin': 'https://en.loader.to'
  }

  // Iniciar
  const apiUrl = `https://p.savenow.to/api/v2/download?format=${format}&url=${encodeURIComponent(videoUrl)}&apikey=dfcb6d76f2f6a9894gjkege8a4ab232222`
  const initRes = await fetch(apiUrl, { headers })
  const init = await initRes.json()

  if (!init.success) return console.log('✦ Error:', init)

  console.log('✦ Título:', init.title)
  console.log('✦ Formato:', init.format || format)

  // Esperar progreso de descarga pr parte del servidorr
  let downloadUrl = ''
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const progressRes = await fetch(`${init.progress_url}&_=${Date.now()}`, { headers })
    const progress = await progressRes.json()

    if (progress.download_url) {
      downloadUrl = progress.download_url
      break
    }
  }

  if (!downloadUrl) return console.log('✦ Tardó mucho')

  // Descargar el archivo. -- (url directa de la api)
  console.log('✦ Descargando...')
  const fileRes = await fetch(downloadUrl)
  const buffer = Buffer.from(await fileRes.arrayBuffer())

  const ext = format === 'mp3' ? 'mp3' : 'mp4'
  const fileName = `${init.title.replace(/[^a-zA-Z0-9 ]/g, '')}.${ext}`
  const filePath = path.join(outputDir, fileName)
  fs.writeFileSync(filePath, buffer)

  console.log(`✦ Guardado: ${filePath}`)
}

download()