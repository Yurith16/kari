// plugins/tiktoksearch.js

import axios from 'axios'

export default {
  command: ['tiktoks', 'tks', 'tiktoksearch'],
  tag: 'tiktoksearch',
  categoria: 'busqueda',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca videos en TikTok',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, {
        text: '🌱 *Ingresa lo que deseas buscar en TikTok*'
      }, { quoted: msg })
    }

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } })

      const { data } = await axios.post('https://tikwm.com/api/feed/search',
        new URLSearchParams({
          keywords: query,
          count: '12',
          cursor: '0',
          HD: '1',
          web: '1'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent': 'Mozilla/5.0'
          },
          timeout: 20000
        }
      )

      const videos = data?.data?.videos || []
      if (!videos.length) {
        return sock.sendMessage(from, { text: '🌱 No se encontraron videos.' }, { quoted: msg })
      }

      // Extraer URLs válidas y completar rutas relativas
      const urlsValidas = []
      for (const v of videos) {
        let url = v.play || v.wmplay || v.hdplay
        if (!url) continue
        // Completar URLs relativas
        if (url.startsWith('/')) url = 'https://tikwm.com' + url
        urlsValidas.push({ url, v })
      }

      if (!urlsValidas.length) {
        return sock.sendMessage(from, { text: '🌱 No se encontraron videos.' }, { quoted: msg })
      }

      let albumKey = null
      let enviados = 0
      let intentos = 0

      while (enviados < 5 && intentos < urlsValidas.length) {
        const { url, v } = urlsValidas[intentos]
        intentos++

        try {
          const videoRes = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
          })
          const buffer = Buffer.from(videoRes.data)
          const sizeMB = buffer.length / (1024 * 1024)

          if (sizeMB > 80 || sizeMB === 0) continue

          if (!albumKey) {
            const album = sock.generateWAMessageFromContent(from, {
              messageContextInfo: {},
              albumMessage: {
                expectedImageCount: 0,
                expectedVideoCount: 5,
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
            albumKey = album.key
          }

          const author = v.author?.nickname || 'Usuario'
          const description = v.title ? v.title.slice(0, 100) : ''
          const caption = enviados === 0
            ? `🌱 ${query}`
            : `🌱 ${author}\n${description}`

          const mediaMsg = await sock.generateWAMessage(from, {
            video: buffer,
            caption
          }, { upload: sock.waUploadToServer })

          mediaMsg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: albumKey }
          }

          await sock.relayMessage(from, mediaMsg.message, { messageId: mediaMsg.key.id })
          enviados++

        } catch {
          continue
        }
      }

      if (enviados === 0) {
        return sock.sendMessage(from, { text: '🌱 No se encontraron videos válidos.' }, { quoted: msg })
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