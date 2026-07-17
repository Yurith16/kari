import axios from 'axios'

export default {
  command:     ['tiktoksearch', 'ttsearch', 'ttdl'],
  tag:         'tiktoksearch',
  categoria:   'media',
  owner:       false,
  group:       false,
  descripcion: 'Busca videos en TikTok',

  async execute(sock, msg, { from, args }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('media'), key: msg.key } })

    const query = args.join(' ')
    if (!query) {
      await sock.sendMessage(from, { text: 'debes ingresar un término de búsqueda.' }, { quoted: msg })
      return
    }

    try {
      const { data } = await axios.get(`https://api.azbry.com/api/search/ttsearch?q=${encodeURIComponent(query)}`)

      if (!data.status || !data.result?.length) {
        await sock.sendMessage(from, { text: 'no se encontraron videos para tu búsqueda.' }, { quoted: msg })
        return
      }

      const selectedVideos = data.result.slice(0, 10)
      let albumKey = null
      let enviados = 0

      for (const video of selectedVideos) {
        try {
          let videoUrl = video.link

          // Corrige el bug de enlaces pegados en la API
          if (videoUrl.includes('https://tikwm.comhttps://')) {
            videoUrl = videoUrl.replace('https://tikwm.comhttps://', 'https://')
          }

          // Descarga local en memoria
          let videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            timeout: 25000
          })
          let buffer = Buffer.from(videoResponse.data)

          if (!albumKey) {
            const album = sock.generateWAMessageFromContent(from, {
              messageContextInfo: {},
              albumMessage: {
                expectedImageCount: 0,
                expectedVideoCount: selectedVideos.length,
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

          const mediaMsg = await sock.generateWAMessage(from, {
            video:   buffer,
            caption: video.title || ''
          }, { upload: sock.waUploadToServer })

          mediaMsg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: albumKey }
          }

          await sock.relayMessage(from, mediaMsg.message, { messageId: mediaMsg.key.id })
          enviados++

        } catch {
          // Segundo intento con la URL de respaldo si la principal falla
          try {
            let fallbackUrl = video.watermark_link
            if (fallbackUrl.includes('https://tikwm.comhttps://')) {
              fallbackUrl = fallbackUrl.replace('https://tikwm.comhttps://', 'https://')
            }

            let videoResponse = await axios.get(fallbackUrl, {
              responseType: 'arraybuffer',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
              },
              timeout: 25000
            })
            let buffer = Buffer.from(videoResponse.data)

            if (!albumKey) {
              const album = sock.generateWAMessageFromContent(from, {
                messageContextInfo: {},
                albumMessage: {
                  expectedImageCount: 0,
                  expectedVideoCount: selectedVideos.length,
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

            const mediaMsg = await sock.generateWAMessage(from, {
              video:   buffer,
              caption: video.title || ''
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
      }

      if (enviados === 0) {
        await sock.sendMessage(from, { text: 'no se pudo descargar ningún video del álbum.' }, { quoted: msg })
      }

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}