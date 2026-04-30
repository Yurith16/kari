// plugins/imagen.js

import axios from 'axios'

export default {
  command:   'imagen',
  tag:       'imagen',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      await sock.sendMessage(from, {
        text: '🌱 *¿Qué imagen deseas buscar?*'
      }, { quoted: msg })
      return
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.post('https://panel.apinexus.fun/api/imagen/buscar',
        { query },
        { headers: { 'x-api-key': 'antbx21e5jhac' } }
      )

      if (!data.success || !data.data?.imagenes?.length) {
        return await sock.sendMessage(from, {
          text: '🌱 No se encontraron imágenes.'
        }, { quoted: msg })
      }

      const imgs = data.data.imagenes
      const randomImg = imgs[Math.floor(Math.random() * imgs.length)]

      await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } })

      const imgRes = await axios.get(randomImg, {
        responseType: 'arraybuffer',
        timeout: 30000
      })
      const imgBuffer = Buffer.from(imgRes.data)

      await sock.sendMessage(from, { react: { text: '⬆️', key: msg.key } })

      await sock.sendMessage(from, {
        image: imgBuffer
      }, { quoted: msg })

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, {
        text: global.messages?.error || '⚠️ Oh no, hubo un error en mi sistema. Intenta de nuevo.'
      }, { quoted: msg })
    }
  }
}