// plugins/pinterest.js

import axios from 'axios'

export default {
  command:   ['pinterest', 'pin'],
  tag:       'pinterest',
  categoria: 'busqueda',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa lo que deseas buscar en Pinterest*'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.post('https://panel.apinexus.fun/api/pinterest/buscar',
        { query },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'antbx21e5jhac'
          },
          timeout: 20000
        }
      )

      if (!data?.success || !data?.data?.imagenes?.length) {
        return sock.sendMessage(from, { text: '🌱 No se encontraron imágenes.' }, { quoted: msg })
      }

      const imagenes = data.data.imagenes.slice(0, 5)

      // Crear álbum
      const album = sock.generateWAMessageFromContent(from, {
        messageContextInfo: {},
        albumMessage: {
          expectedImageCount: imagenes.length,
          expectedVideoCount: 0,
          contextInfo: {
            remoteJid: msg.key.remoteJid,
            fromMe: msg.key.fromMe,
            stanzaId: msg.key.id,
            participant: msg.key.participant || msg.key.remoteJid,
            quotedMessage: msg.message
          }
        }
      }, {})

      await sock.relayMessage(from, album.message, { messageId: album.key.id })

      // Enviar imágenes al álbum
      for (let i = 0; i < imagenes.length; i++) {
        const imgUrl = imagenes[i]
        const imgRes = await axios.get(imgUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        })
        const imgBuffer = Buffer.from(imgRes.data)

        const mediaMsg = await sock.generateWAMessage(from, {
          image: imgBuffer,
          caption: i === 0 ? `🌱 ${query}` : ''
        }, { upload: sock.waUploadToServer })

        mediaMsg.message.messageContextInfo = {
          messageAssociation: { associationType: 1, parentMessageKey: album.key }
        }

        await sock.relayMessage(from, mediaMsg.message, { messageId: mediaMsg.key.id })
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