// creditos a YJ-EspinoX
import axios from 'axios'
import * as cheerio from 'cheerio'
import { writeFileSync, mkdirSync, existsSync, unlinkSync, statSync } from 'fs'
import { resolve, join } from 'path'

const DOWNLOAD_DIR = resolve('media/facebook')
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true })

export default {
  command:   ['fb', 'facebook'],
  tag:       'facebook',
  categoria: 'descargas',
  descripcion: 'Descarga videos de facebook',
  owner:     false,
  group:     false,

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, { 
      text: `✦ *Ingresa la URL del video de Facebook que deseas descargar.*` 
    }, { quoted: msg })

    const videoUrl = args[0]
    const tokens = {
      k_exp: '1778102017',
      k_token: 'b18328949b1526bc79a252a6349c50592012597e248a980baca8bd3169415413',
      cftoken: '0.qx-vbirN_rCItbzzgSPCejt7etbh1SowgCz8mG-ylqqNBMPyeGCbN42FWZiiPNldcwORxlNBVkt9_rc6BBJ4FhrCAO_wvSXDKJZp2rRO-Pq9c8XRo3DdvOBPtFJvxwHS1cqy-jhk6VFkkLGMEBjAVFWzB4n-DY1EOel_VJheM6aE9Df1CNx-p-LDUypvJnV9iebgOGIXl2jB5kL4P08RNldDQLD0PIEVsijSpEniqSIUbFxFADNGxXr8RPGc5ZMV5Q0rArRFdJ9QCgLyiqQhFpCE3iInZLGC75zBTnBfFWKzIJEzurNbbAAQUXDxuyD8SPFvoQZq4a-CaH1wOsiLN8XjzicKBaBBHulZ-6cw5A3Ug77JXvRdzhlW7hgEQa5GbMex2Z3OkiFicXusEjbMhJF0AscBljxg0BBYcUOVKNv8QKVREq2G3Mwc140liyotXPQDSLnfMJOGVtFucbbKq1GtoURORlogd1_7B6RtCnUPhLJPDqfR9hRskmB-YMFKGrA-IVR3CCzxcs5_EVQ2JRL_YRwI4-CZ9XW959uJemLzmudkvwjrNY0zQ014kvfXr1WR8jtIE0sXTyerWo6PXw7wo_XLWLoGgF6ZA_5yjH1_-KqYtJodkIiZtL02y57e85nUY9evM_8bmsd3XW3Sy84k-r-srirGvOS7XdsDiiXl-_iFVF6BU54DzqR-LSfUikvtZG2NHuLTkrBTgseATTfgATYgDWEBggkGtpPKdpX5tQLWLToSKy4JXAT7mfaM62tEG_5kDKCJY1s5eVsCvhG1t9eCwuYrchJHjXuiVfARH1jb4hkIT7nqVrzxDmdw_9aOASca4mEOYBE4TKJyi625d0PzWcJRXH66NoxYftMPedDDanVBHCbrYQAXXLnmpJE8xnwr3zT13b3pZ3OFwf0Rkmdk12v98SyPiWC8LqF8u7UDAWRefFt7xH_ncigc.QD_hy0lR8fKtjb_iMXvIAA.5b69d95eb58f0468ff626d459cc1ebda61bcaaa865c0dfb32dd71e7f0faf2b91'
    }

    let localFilePath = null

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const payload = new URLSearchParams({
        ...tokens,
        'q': videoUrl,
        'lang': 'es',
        'web': 'fdownloader.net',
        'v': 'v2'
      })

      const { data } = await axios.post('https://v3.fdownloader.net/api/ajaxSearch', payload, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
          'Referer': 'https://fdownloader.net/'
        }
      })

      if (data.status !== 'ok') throw new Error('Invalid Token')

      const $ = cheerio.load(data.data)
      const results = []
      $('table tbody tr').each((i, el) => {
        const url = $(el).find('a.download-link-fb').attr('href') || $(el).find('button').attr('data-videourl')
        if (url) results.push(url)
      })

      if (results.length === 0) throw new Error('No links')
      const directUrl = results[0]

      // Descargar el archivo localmente
      const fileName = `fb_video_${Date.now()}.mp4`
      localFilePath = join(DOWNLOAD_DIR, fileName)

      const videoResponse = await axios.get(directUrl, { 
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0'
        }
      })

      writeFileSync(localFilePath, Buffer.from(videoResponse.data))

      // Analizar el peso del archivo descargado
      const stats = statSync(localFilePath)
      const sizeInMB = stats.size / (1024 * 1024)

      const caption = `🌿 *Descarga completada.*`

      // Si el video pesa más de 80MB, enviar como documento
      if (sizeInMB > 80) {
        await sock.sendMessage(from, {
          document: { url: localFilePath },
          mimetype: 'video/mp4',
          fileName: fileName,
          caption: caption + `\n> 📦 *Nota:* Enviado como documento (${sizeInMB.toFixed(2)} MB)`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          video: { url: localFilePath },
          caption: caption
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (e) {
      console.error(e)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: `✦ *Error:* No se pudo procesar la descarga.` }, { quoted: msg })
    } finally {
      // Limpiar archivo temporal después de enviar
      if (localFilePath && existsSync(localFilePath)) {
        try {
          unlinkSync(localFilePath)
        } catch (cleanupError) {
          console.error('Error al limpiar archivo temporal:', cleanupError)
        }
      }
    }
  }
}