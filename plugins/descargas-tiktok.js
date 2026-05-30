// plugins/tiktok.js
import axios from 'axios'

/**
 * Extrae la información de medios de TikTok usando la API de TikWM
 */
async function getTikTokInfo(tiktokUrl) {
  const params = new URLSearchParams()
  params.append('url', tiktokUrl)
  params.append('hd', '1')

  const { data } = await axios.post('https://tikwm.com/api/', params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01'
    },
    timeout: 20000
  })

  if (!data || data.code !== 0 || !data.data) {
    throw new Error(data.msg || 'No se pudo procesar el post.')
  }

  return data.data
}

export default {
  command: ['tiktok', 'tt', 'ttphoto', 'dltt'],
  tag: 'download',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: '🌸 Descarga videos HD o álbumes de imágenes de TikTok',

  async execute(sock, msg, { from, args }) {
    if (!args.length) {
      return sock.sendMessage(from, { 
        text: `🌸 *¿Y el enlace, corazón?*\nNecesito que me pases un link válido de TikTok para ir a buscar tus cosas.` 
      }, { quoted: msg })
    }

    const url = args[0]
    if (!/tiktok\.com/i.test(url)) {
      return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const info = await getTikTokInfo(url)
      const title = info.title ? info.title.slice(0, 100) : 'TikTok Media'
      const author = info.author?.nickname || 'Usuario'

      // ─── CASO A: GALERÍA DE IMÁGENES (ÁLBUM NATIVO) ───
      if (info.images && Array.isArray(info.images) && info.images.length > 0) {
        await sock.sendMessage(from, { 
          text: `📸 *Encontré una galería de imágenes de ${author}* \nPreparando el álbum nativo... 🤭` 
        }, { quoted: msg })
        
        await sock.sendMessage(from, { react: { text: '📥', key: msg.key } })

        const images = info.images
        let albumKey = null
        let enviados = 0

        const album = sock.generateWAMessageFromContent(from, {
          messageContextInfo: {},
          albumMessage: {
            expectedImageCount: images.length,
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
        albumKey = album.key

        for (let i = 0; i < images.length; i++) {
          try {
            const imgRes = await axios.get(images[i], {
              responseType: 'arraybuffer',
              timeout: 30000
            })
            const buffer = Buffer.from(imgRes.data)

            const caption = i === 0 
              ? `✨ *Galería de ${author}*\n${title}` 
              : `✨ *Foto [${i + 1}/${images.length}]*`

            const mediaMsg = await sock.generateWAMessage(from, {
              image: buffer,
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
          return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
        }

        await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })
        return
      }

      // ─── CASO B: VIDEO ───
      const videoUrl = info.hdplay || info.play
      if (!videoUrl) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const videoRes = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' },
        timeout: 120000
      })

      const videoBuffer = Buffer.from(videoRes.data)
      const sizeMB = videoBuffer.length / (1024 * 1024)

      let enviado
      if (sizeMB > 50) {
        enviado = await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `tiktok_${author}_${Date.now()}.mp4`,
          caption: `✨ *Video de ${author}*\n${title}`
        }, { quoted: msg })
      } else {
        enviado = await sock.sendMessage(from, {
          video: videoBuffer,
          mimetype: 'video/mp4',
          caption: `✨ *Video de ${author}*\n${title}`
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      if (enviado) await sock.sendMessage(from, { react: { text: '🌱', key: enviado.key } })

    } catch (error) {
      console.error('[TikTok] Error:', error.message)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}