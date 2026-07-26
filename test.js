import axios from 'axios'
import ytSearch from 'yt-search'
import readline from 'readline'
import fs from 'fs'
import path from 'path'

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0'
const DOWNLOAD_DIR = path.join(process.cwd(), 'descargas')

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true })

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const pregunta = texto => new Promise(resolve => rl.question(texto, resolve))

function sanitizar(nombre) {
  return nombre.replace(/[<>:"/\\|?*]/g, '').substring(0, 80)
}

async function descargarArchivo(url, filePath) {
  const fileRes = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': UA },
    timeout: 300000
  })
  const buffer = Buffer.from(fileRes.data)
  if (buffer.length === 0) throw new Error('Archivo vacio')
  fs.writeFileSync(filePath, buffer)
  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2)
  console.log(`Descargado: ${filePath} (${sizeMB} MB)`)
}

async function y2mate(videoUrl, titulo) {
  const keyRes = await axios.get('https://cnv.cx/v2/sanity/key', {
    headers: { 'User-Agent': UA, 'Accept': '*/*', 'Referer': 'https://iframe.y2meta-uk.com/', 'Origin': 'https://iframe.y2meta-uk.com' }
  })
  const apiKey = keyRes.data.key

  const params = new URLSearchParams({
    link: videoUrl, format: 'mp3', audioBitrate: '320', videoQuality: '1080', vCodec: 'h264'
  })

  const convertRes = await axios.post('https://cnv.cx/v2/converter', params.toString(), {
    headers: {
      'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', 'key': apiKey,
      'Origin': 'https://iframe.y2meta-uk.com', 'Referer': 'https://iframe.y2meta-uk.com/'
    },
    timeout: 60000
  })

  if (convertRes.data?.status === 'tunnel' && convertRes.data?.url) {
    const filePath = path.join(DOWNLOAD_DIR, `${sanitizar(titulo)}.mp3`)
    await descargarArchivo(convertRes.data.url, filePath)
    return
  }
  throw new Error('y2mate fallo')
}

async function main() {
  console.log('\nDESCARGADOR DE AUDIO - Y2MATE\n')

  while (true) {
    const query = await pregunta('\nQue buscas? (o "salir"): ')
    
    if (!query) continue
    if (query.toLowerCase() === 'salir') {
      console.log('Chao.')
      rl.close()
      process.exit(0)
    }

    try {
      console.log('Buscando...')
      const search = await ytSearch(query)
      
      if (!search.videos?.length) {
        console.log('No encontre nada.')
        continue
      }

      console.log('\nResultados:')
      search.videos.slice(0, 5).forEach((v, i) => {
        console.log(`${i + 1}. ${v.title} - ${v.duration?.timestamp || v.duration} - ${v.author?.name || v.author}`)
      })

      const opcion = await pregunta('\nElegi un numero (1-5): ')
      const idx = parseInt(opcion) - 1
      
      if (isNaN(idx) || idx < 0 || idx >= 5) {
        console.log('Numero invalido.')
        continue
      }

      const video = search.videos[idx]
      console.log(`\nDescargando: ${video.title}`)
      await y2mate(video.url, video.title)

    } catch (err) {
      console.error('Error:', err.message)
    }
  }
}

main()
