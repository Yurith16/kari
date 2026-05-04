// plugins/coreanas.js

import axios from 'axios'

export default {
  command:   'coreanas',
  tag:       'coreanas',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Envía fotos de chicas coreanas',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/nsfw/corean`
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' })

      if (!response.data) throw new Error('Sin datos')

      await sock.sendMessage(from, {
        image: response.data,
        mimetype: 'image/jpeg',
        caption: `> 🌸 Chica coreana\n> 🍃 ${global.bot?.name || 'Midori-Hana'}`
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error('Error Coreanas:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}