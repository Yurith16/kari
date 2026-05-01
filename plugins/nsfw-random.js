// plugins/random.js

import axios from 'axios'

export default {
  command:   ['random'],
  tag:       'random',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👗', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/nsfw/girls`
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' })

      if (!response.data) throw new Error('Sin datos')

      const enviado = await sock.sendMessage(from, {
        image: response.data,
        mimetype: 'image/jpeg'
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

      if (enviado) {
        await sock.sendMessage(from, { 
          react: { text: '🔥', key: enviado.key } 
        })
      }

    } catch (err) {
      console.error('Error Girls-Img:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}