// plugins/twitter.js

import axios from 'axios'

function toNum(number) {
  number = Number(number) || 0
  const abs = Math.abs(number)
  if (abs >= 1_000_000) return (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return (abs / 1_000).toFixed(1) + 'k'
  return number.toString()
}

export default {
  command: ['twitter', 'x', 'tw'],
  tag: 'twitter',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL de Twitter/X*'
      }, { quoted: msg })
    }

    const url = args[0]

    if (!url.includes('twitter.com') && !url.includes('x.com')) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa una URL válida de Twitter/X*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const normalized = url
        .replace(/x\.com/, 'twitter.com')
        .replace('twitter.com', 'api.vxtwitter.com')

      const { data } = await axios.get(normalized, { timeout: 30000 })

      if (!data?.media_extended?.length) {
        return sock.sendMessage(from, { text: '🌱 No se encontró contenido multimedia.' }, { quoted: msg })
      }

      const autor = data.user_name || ''
      const user = data.user_screen_name || ''
      const caption = `🌱 ${autor} (@${user})\n❤️ ${toNum(data.likes)}`

      for (const item of data.media_extended) {
        const isVideo = item.type === 'video' || item.type === 'gif'
        const mediaRes = await axios.get(item.url, { responseType: 'arraybuffer', timeout: 600000 })
        const mediaBuffer = Buffer.from(mediaRes.data)
        const sizeMB = mediaBuffer.length / (1024 * 1024)

        if (isVideo) {
          if (sizeMB < 50) {
            await sock.sendMessage(from, {
              video: mediaBuffer,
              caption
            }, { quoted: msg })
          } else {
            await sock.sendMessage(from, {
              document: mediaBuffer,
              mimetype: 'video/mp4',
              fileName: 'twitter.mp4',
              caption
            }, { quoted: msg })
          }
        } else {
          await sock.sendMessage(from, {
            image: mediaBuffer,
            caption
          }, { quoted: msg })
        }
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