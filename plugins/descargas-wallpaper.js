// creditos a YJ-EspinoX
import axios from 'axios'
import * as cheerio from 'cheerio'
import { getBotSignature } from '../utils/formatters.js'

export default {
  command: ['paper','wallhaven'],
  tag: 'wallhaven',
  categoria: 'descargas',
  descripcion: 'Busca y descarga un álbum de 10 wallpapers de Wallhaven',
  owner: false,
  group: false,
  nsfw: false,

  async execute(sock, msg, { from, args }) {
    const query = args.join(' ')
    if (!query) return sock.sendMessage(from, { text: global.messages.busquedaEmpty }, { quoted: msg })

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const url = `https://wallhaven.cc/search?q=${encodeURIComponent(query)}&categories=110&purity=100&sorting=relevance&order=desc`

      const { data } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      })

      const $ = cheerio.load(data)
      const resultados = []

      $('figure.thumb').each((i, el) => {
        const id = $(el).attr('data-wallpaper-id')
        const res = $(el).find('.wall-res').text().trim()
        const esPng = $(el).find('.png').length > 0

        if (id) {
          const carpeta = id.substring(0, 2)
          const extension = esPng ? 'png' : 'jpg'
          const linkDirecto = `https://w.wallhaven.cc/full/${carpeta}/wallhaven-${id}.${extension}`

          resultados.push({
            id,
            res,
            url: linkDirecto
          })
        }
      })

      if (resultados.length === 0) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
      }

      const selectedWalls = resultados.slice(0, 10)

      let albumKey = null
      let enviados = 0

      const signature = getBotSignature(global.bot)

      for (const wall of selectedWalls) {
        try {
          const imageResponse = await axios.get(wall.url, {
            responseType: 'arraybuffer',
            timeout: 15000
          })
          const buffer = Buffer.from(imageResponse.data)

          if (!albumKey) {
            const album = sock.generateWAMessageFromContent(from, {
              messageContextInfo: {},
              albumMessage: {
                expectedImageCount: selectedWalls.length,
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

          const caption = enviados === 0
            ? `  · · ─────── ·🌸· ─────── · ·
  ⊱ *_Wallhaven_* ⊰
  ♡ *Búsqueda:* _${query}_
  ♡ *Resolución:* _${wall.res}_
  · · ─────── ·🌸· ─────── · ·
     ${signature}`
            : ''

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

      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      return await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}