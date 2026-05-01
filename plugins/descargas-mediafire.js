// plugins/mediafire.js

import axios from 'axios'
import * as cheerio from 'cheerio'

export default {
  command:   ['mediafire', 'mf'],
  tag:       'mediafire',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, { text: '> Ingresa un enlace de MediaFire 🍃' }, { quoted: msg })
      return
    }

    const url = args[0]

    if (!url.includes('mediafire.com')) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, { text: '> Ingresa un enlace válido de MediaFire 🍃' }, { quoted: msg })
      return
    }

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

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
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No se pudo obtener el enlace de descarga 🍃' }, { quoted: msg })
        return
      }

      const fileName = $('.filename').text().trim() || 'archivo'
      const sizeText = $('#downloadButton').text().replace(/Download|\(|\)/g, '').trim() || 'Desconocido'

      // Validar tamaño
      let sizeMB = 0
      const sizeMatch = sizeText.match(/([\d.]+)\s*(KB|MB|GB)/i)
      if (sizeMatch) {
        const num = parseFloat(sizeMatch[1])
        const unit = sizeMatch[2].toUpperCase()
        if (unit === 'KB') sizeMB = num / 1024
        if (unit === 'MB') sizeMB = num
        if (unit === 'GB') sizeMB = num * 1024
      }

      if (sizeMB > 500) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        await sock.sendMessage(from, { text: `> El archivo pesa *${sizeText}*, excede el límite de 500 MB 🍃` }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const fileRes = await axios.get(downloadLink, {
        responseType: 'arraybuffer',
        timeout: 600000
      })
      const fileBuffer = Buffer.from(fileRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sentMsg = await sock.sendMessage(from, {
        document: fileBuffer,
        fileName: fileName,
        mimetype: 'application/octet-stream',
        caption: `> ${fileName}\n> ${sizeText} 🍃`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '🍃', key: sentMsg.key } })
      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}