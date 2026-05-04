// plugins/boobs.js

import axios from 'axios'

export default {
  command:   ['tetas', 'pechos'],
  tag:       'tetas',
  categoria: 'nsfw',
  owner:     false,
  group:     true,
  nsfw:      true,
  descripcion: 'Envía imágenes +18 aleatorias',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🍒', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/nsfw/boobs`
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
      console.error('Error Boobs:', err.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
    }
  }
}