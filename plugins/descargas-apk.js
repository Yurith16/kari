// plugins/apk.js

import axios from 'axios'

function parseMB(tamaño) {
  if (!tamaño) return 0
  const num = parseFloat(tamaño)
  if (tamaño.includes('GB')) return num * 1024
  return num
}

export default {
  command:   'apk',
  tag:       'apk',
  categoria: 'descargas',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const text = args.join(' ').trim()

    if (!text) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, { text: '> ¿Qué aplicación quieres descargar? 🍃' }, { quoted: msg })
      return
    }

    await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

    try {
      const { data } = await axios.get(`https://api.adoolab.xyz/search/uptodown?q=${encodeURIComponent(text)}&limit=1`, {
        timeout: 15000
      })

      if (!data.status || !data.resultados?.length) {
        throw new Error('Sin resultados')
      }

      const app = data.resultados[0]

      const mb = parseMB(app.tamaño)
      if (mb > 400) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        await sock.sendMessage(from, { text: `> Esta app pesa *${app.tamaño}* — no está permitido descargar archivos tan pesados 🍃` }, { quoted: msg })
        return
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const response = await axios.get(app.url_descarga_directa, {
        responseType: 'arraybuffer',
        timeout: 60000
      })

      const buffer = Buffer.from(response.data)
      const fileName = `${app.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.apk`

      await sock.sendMessage(from, {
        document: buffer,
        mimetype: 'application/vnd.android.package-archive',
        fileName,
        caption: `> *${app.titulo}* v${app.version} — ${app.tamaño} 🍃`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: '> No se encontraron resultados 🍃' }, { quoted: msg })
    }
  }
}