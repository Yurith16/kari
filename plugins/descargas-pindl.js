// creditos a YJ-EspinoX
import axios from 'axios'

export default {
  command:     ['pinterest', 'pin', 'pindl'],
  tag:         'pinterest',
  categoria:   'media',
  descripcion: 'Busca y descarga un álbum de 10 imágenes de Pinterest',
  owner:       false,
  group:       false,

  async execute(sock, msg, { from, args }) {
    await sock.sendMessage(from, { react: { text: global.getRandomReaction('media'), key: msg.key } })

    const query = args.join(' ')
    if (!query) {
      await sock.sendMessage(from, { text: 'Dime que deseas buscar en pinterest' }, { quoted: msg })
      return
    }

    try {
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
        await sock.sendMessage(from, { text: 'no se encontraron resultados para tu búsqueda.' }, { quoted: msg })
        return
      }

      const shuffled = results.sort(() => 0.5 - Math.random())
      const selectedPins = shuffled.slice(0, 10)

      let albumKey = null
      let enviados = 0

      for (const pin of selectedPins) {
        try {
          const imageUrl = pin.images.orig.url
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          })
          const buffer = Buffer.from(imageResponse.data)

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

          const mediaMsg = await sock.generateWAMessage(from, {
            image: buffer,
            caption: ''
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
        await sock.sendMessage(from, { text: 'no se pudo descargar ninguna imagen del álbum.' }, { quoted: msg })
      }

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}