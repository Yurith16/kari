// plugins/pinvideo.js

import axios from 'axios'

export default {
  command:   ['pinvideo', 'pinterestmp4'],
  tag:       'pinvideo',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa lo que deseas buscar en Pinterest (videos)*'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.get(
        `https://api.delirius.store/search/pinterestvideo?query=${encodeURIComponent(query)}`,
        { timeout: 15000 }
      )

      if (!data.status || !data.data || !data.data.video) {
        return await sock.sendMessage(from, {
          text: '🌱 No se encontraron videos.'
        }, { quoted: msg })
      }

      const r = data.data
      const txt = `🌱 *${r.title || 'Pinterest'}*\n` +
        `✦ *Autor:* ${r.author?.full_name || r.author?.username || 'Desconocido'}\n` +
        `✦ *Likes:* ${r.likes || 0}\n` +
        `✦ *Descripción:* ${r.description || 'Sin descripción'}`

      // Enviar miniatura primero
      if (r.thumbnail) {
        try {
          const imgRes = await axios.get(r.thumbnail, {
            responseType: 'arraybuffer',
            timeout: 10000
          })
          await sock.sendMessage(from, {
            image: Buffer.from(imgRes.data),
            caption: txt + '\n\n⬇️ *Descargando video...*'
          }, { quoted: msg })
        } catch {
          await sock.sendMessage(from, { text: txt }, { quoted: msg })
        }
      }

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const videoRes = await axios.get(r.video, {
        responseType: 'arraybuffer',
        timeout: 120000
      })
      const videoBuffer = Buffer.from(videoRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      const sizeMB = videoBuffer.length / (1024 * 1024)

      if (sizeMB < 50) {
        await sock.sendMessage(from, {
          video: videoBuffer,
          caption: `🌱 *${r.title || 'Pinterest'}*`
        }, { quoted: msg })
      } else {
        await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: 'pinterest.mp4',
          caption: `🌱 *${r.title || 'Pinterest'}*`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}