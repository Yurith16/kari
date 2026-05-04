// creditos a YJ-EspinoX
import axios from 'axios'

export default {
  command: ['pinterest', 'pin'],
  tag: 'pinterest',
  categoria: 'descargas',
  descripcion: 'Busca y descarga un álbum de 10 imágenes de Pinterest',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args, prefix }) {
    const query = args.join(' ')
    if (!query) return sock.sendMessage(from, { 
      text: `✦ Hernández, debes ingresar un término de búsqueda.\n\nEjemplo: *${prefix}pin anime wallpaper*` 
    }, { quoted: msg })

    try {
      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      // Paso 1: Obtener sesión y CSRF
      const session = await axios.get('https://es.pinterest.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      })

      const cookies = session.headers['set-cookie']?.join('; ') || ''
      const csrfToken = cookies.match(/csrftoken=([^;]+)/)?.[1] || 'e6336e00000000000000000000000000'

      const searchUrl = 'https://es.pinterest.com/resource/BaseSearchResource/get/'
      const params = new URLSearchParams({
        'source_url': `/search/pins/?q=${encodeURIComponent(query)}`,
        'data': JSON.stringify({
          "options": { "query": query, "scope": "pins", "count": 50 },
          "context": {}
        })
      })

      // Paso 2: Búsqueda de Pines
      const { data } = await axios.post(searchUrl, params, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': csrfToken,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://es.pinterest.com/',
          'Cookie': cookies
        }
      })

      const results = data.resource_response?.data?.results || []
      if (results.length === 0) {
        await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
        return sock.sendMessage(from, { text: '✦ No encontré resultados para tu búsqueda.' }, { quoted: msg })
      }

      const shuffled = results.sort(() => 0.5 - Math.random())
      const selectedPins = shuffled.slice(0, 10)

      let albumKey = null
      let enviados = 0

      // Paso 3: Generar y enviar el Álbum
      for (const pin of selectedPins) {
        try {
          const imageUrl = pin.images.orig.url
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          })
          const buffer = Buffer.from(imageResponse.data)

          // Inicializar el contenedor del álbum en el primer envío exitoso
          if (!albumKey) {
            const album = sock.generateWAMessageFromContent(from, {
              messageContextInfo: {},
              albumMessage: {
                expectedImageCount: selectedPins.length,
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
          }

          // Preparar cada imagen para asociarla al álbum
          const mediaMsg = await sock.generateWAMessage(from, {
            image: buffer,
            caption: enviados === 0 ? `✦ *Pinterest:* ${query}` : ''
          }, { upload: sock.waUploadToServer })

          mediaMsg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: albumKey }
          }

          await sock.relayMessage(from, mediaMsg.message, { messageId: mediaMsg.key.id })
          enviados++

        } catch {
          // Si falla una imagen, la saltamos silenciosamente
          continue
        }
      }

      if (enviados === 0) {
        return sock.sendMessage(from, { text: '✦ No se pudieron procesar las imágenes del álbum.' }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

    } catch (error) {
      console.error('[PINTEREST ERROR]:', error.message)
      await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
      await sock.sendMessage(from, { text: '✦ Ocurrió un error inesperado al generar el álbum.' }, { quoted: msg })
    }
  }
}