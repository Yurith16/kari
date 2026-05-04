// plugins/hentai.js

import axios from 'axios'

export default {
  command:   ['hentai', 'h'],
  tag:       'hentai',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Envía imágenes hentai aleatorias',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🔞', key: msg.key } })

    try {
      const { data: res } = await axios.get('https://panel.apinexus.fun/api/hentai', {
        headers: { 'x-api-key': 'antbx21e5jhac' }
      })

      if (!res.success || !res.data || !res.data.url) throw new Error()

      const sentMsg = await sock.sendMessage(from, { 
        image: { url: res.data.url }
      }, { quoted: msg })

      await sock.sendMessage(from, { 
        react: { text: '🍃', key: sentMsg.key } 
      })

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}