import { Sticker } from 'wa-sticker-formatter'
import axios from 'axios'

export default {
  command: ['bratvid'],
  tag: 'sticker',
  categoria: 'sticker',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Crea un sticker animado estilo Brat con el texto que desees',

  async execute(sock, msg, { from, text, args }) {
    const prompt = text || args.join(' ')
    const userName = msg.pushName || ''

    if (!prompt) {
      return sock.sendMessage(from, {
        text: '🌸 Escribe el texto que quieres convertir en sticker brat animado. Ejemplo: *.bratvid hola*'
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '📽️', key: msg.key } })

      // Construimos la URL con el texto codificado
      const apiUrl = `https://api.azbry.com/api/maker/bratvid?text=${encodeURIComponent(prompt)}`
      
      // Obtenemos el archivo (animado) como buffer
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data)

      // Creamos el sticker con el nombre del usuario (sin packname)
      const sticker = new Sticker(buffer, {
        pack: '', 
        author: userName,
        type: 'full',
        quality: 70
      })

      await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg })
      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch (err) {
      console.error('[BRATVID STICKER ERROR]:', err.message)

      // Devolvemos los coins si algo falla
      if (global.db?.data?.users?.[msg.sender]) {
        global.db.data.users[msg.sender].coins = (global.db.data.users[msg.sender].coins || 0) + 1
      }

      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { 
        text: '🌸 Hubo un problema al generar el sticker brat animado. He devuelto tus coins.' 
      }, { quoted: msg })
    }
  }
}