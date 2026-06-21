
// Descargador de audio y videos de YouTube
//Creditos: YJ-EspinoX
// ..........................................
// ------------- USO EN CONSOLA ------------
//...........................................
/*
node test.js https://youtu.be/1a3REFH83WA mp3
node test.js https://youtu.be/1a3REFH83WA mp4
*/


const videoUrl = process.argv[2] || 'https://youtu.be/1a3REFH83WA'
const format = process.argv[3] || 'mp3'

async function cnvcx(url, format) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0',
    'Accept': '*/*',
    'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://mp3yt.is',
    'Referer': 'https://mp3yt.is/'
  }

  const keyRes = await fetch('https://cnv.cx/v2/sanity/key', { headers })
  const keyData = await keyRes.json()

  const infoRes = await fetch('https://cnv.cx/v2/getVideoInfo', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `link=${encodeURIComponent(url)}`
  })
  const info = await infoRes.json()
  console.log('✦ Título:', info.title)
  console.log('✦ Canal:', info.channelTitle)
  console.log('✦ Duración:', info.videoTime)
  console.log('✦ Portada:', info.thumbnail)

  const convertRes = await fetch('https://cnv.cx/v2/converter', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'key': keyData.key },
    body: `link=${encodeURIComponent(url)}&format=${format}&audioBitrate=320&videoQuality=1080&vCodec=h264`
  })
  const convert = await convertRes.json()

  if (convert.status === 'tunnel' && convert.url) {
    console.log('✦ Descarga:', convert.url)
    console.log('✦ Archivo:', convert.filename)
  } else {
    console.log('✦ Error:', convert)
  }
}

cnvcx(videoUrl, format)