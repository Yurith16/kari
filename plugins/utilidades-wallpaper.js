// plugins/wallpaper.js

import axios from 'axios'

export default {
  command: ['wallpaper', 'fondo', 'bestwall'],
  tag: 'wallpaper',
  categoria: 'utilidad',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y envía wallpapers',

  async execute(sock, msg, { from }) {
    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const { data } = await axios.get('https://api.unsplash.com/photos/random', {
        params: { client_id: '72utkjatCBC-PDcx7-Kcvgod7-QOFAm2fXwEeW8b8cc' },
        timeout: 15000
      })

      if (!data?.urls?.regular) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: '🌸 No encontré un fondo bonito, ¿probamos otra vez?' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

      const imgRes = await axios.get(data.urls.regular, {
        responseType: 'arraybuffer',
        timeout: 30000
      })
      const imgBuffer = Buffer.from(imgRes.data)

      await sock.sendMessage(from, { react: { text: '📤', key: msg.key } })

      await sock.sendMessage(from, {
        image: imgBuffer,
        caption: `🌸 Un fondo para ti.`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}