// plugins/yts.js

import yts from 'yt-search'
import axios from 'axios'

const activeUsers = new Map()

export default {
  command:   ['yts', 'ytsearch', 'buscar'],
  tag:       'yts',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Busca videos en YouTube',

  async execute(sock, msg, { from, args }) {
    const userId = msg.key.participant || from

    if (activeUsers.has(userId)) return

    if (!args[0]) {
      await sock.sendMessage(from, { react: { text: '🫢', key: msg.key } })
      await sock.sendMessage(from, { text: '> ¿Qué deseas buscar en YouTube? 🍃' }, { quoted: msg })
      return
    }

    activeUsers.set(userId, true)
    await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

    try {
      const query = args.join(' ')
      const results = await yts(query)

      if (!results?.videos?.length) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        await sock.sendMessage(from, { text: '> No encontré nada oíste 🫢' }, { quoted: msg })
        return
      }

      const videos = results.videos.slice(0, 5)

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]
        const { title, author, duration, views, ago, url, thumbnail } = video

        const videoDetails = `> 🎵 *「🌱」 ${title}*\n\n` +
          `> 🍃 *Canal:* » ${author.name}\n` +
          `> ⚘ *Duración:* » ${duration.timestamp}\n` +
          `> 🌼 *Vistas:* » ${(views || 0).toLocaleString()}\n` +
          `> 🍀 *Publicado:* » ${ago || 'Reciente'}\n` +
          `> 🌿 *Enlace:* » ${url}`

        try {
          await sock.sendMessage(from, {
            image: { url: thumbnail },
            caption: videoDetails
          }, { quoted: msg })

          if (i < videos.length - 1) {
            await new Promise(r => setTimeout(r, 1500))
          }
        } catch (err) {
          console.log(`Error enviando video: ${err.message}`)
        }
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('Error YTS:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    } finally {
      activeUsers.delete(userId)
    }
  }
}