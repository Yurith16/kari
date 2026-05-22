// plugins/mediafire.js

import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { lookup } from 'mime-types'

export default {
  command: ['mediafire', 'mf'],
  tag: 'mediafire',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga archivos de MediaFire',

  async execute(sock, msg, { from, args }) {
    if (!args.length) return sock.sendMessage(from, { 
      text: '🌸 Pásame el enlace de MediaFire que quieres descargar.'
    }, { quoted: msg })

    const url = args[0]

    if (!url.includes('mediafire.com')) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      return await sock.sendMessage(from, { text: '🌸 Eso no parece un enlace de MediaFire.' }, { quoted: msg })
    }

    let tempFile = null

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      // Scraping del enlace directo
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
      })

      const $ = cheerio.load(res.data)
      let downloadLink = $('#downloadButton').attr('href')
      
      if (!downloadLink || downloadLink.includes('javascript:void(0)')) {
        const match = res.data.match(/href="(https:\/\/download\d+\.mediafire\.com[^"]+)"/)
        downloadLink = match ? match[1] : null
      }

      if (!downloadLink) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      const fileName = $('.filename').text().trim() || 'archivo_mediafire'
      const sizeText = $('#downloadButton').text().replace('Download', '').replace(/[()]/g, '').trim() || 'N/A'

      // Verificar tamaño máximo 800MB
      let sizeMB = 0
      const sizeMatch = sizeText.match(/([\d.]+)\s*(KB|MB|GB)/i)
      if (sizeMatch) {
        const num = parseFloat(sizeMatch[1])
        const unit = sizeMatch[2].toUpperCase()
        if (unit === 'KB') sizeMB = num / 1024
        if (unit === 'MB') sizeMB = num
        if (unit === 'GB') sizeMB = num * 1024
      }

      if (sizeMB > 800) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: '🌸 Este archivo pesa más de 800MB, no puedo descargarlo.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      // Descargar
      const mediafireDir = path.join(process.cwd(), 'tmp', 'mediafire')
      if (!fs.existsSync(mediafireDir)) fs.mkdirSync(mediafireDir, { recursive: true })

      const safeFileName = fileName.replace(/[<>:"/\\|?*]/g, '_')
      tempFile = path.join(mediafireDir, `${Date.now()}_${safeFileName}`)

      const writer = fs.createWriteStream(tempFile)
      const response = await axios({
        method: 'GET',
        url: downloadLink,
        responseType: 'stream',
        timeout: 600000
      })

      response.data.pipe(writer)
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      const ext = fileName.split('.').pop()?.toLowerCase()
      const mime = lookup(ext) || 'application/octet-stream'

      const enviado = await sock.sendMessage(from, {
        document: fs.readFileSync(tempFile),
        mimetype: mime,
        fileName: fileName
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      if (enviado) await sock.sendMessage(from, { react: { text: '🌱', key: enviado.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    } finally {
      if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
    }
  }
}