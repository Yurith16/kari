import { execSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import axios from 'axios'

const DOWNLOAD_DIR = join('media/tiktok_img')
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR, { recursive: true })

export default {
  command: ['tikimg', 'ttimg'],
  tag: 'tikimg',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Busca y envía imágenes de TikTok en álbum',

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, { text: global.messages.busquedaEmpty }, { quoted: msg })

    const query = args.join(' ')

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      const Q = encodeURIComponent(query)
      const res = execSync(`curl -s --max-time 20 'https://www.tikwm.com/api/photo/search' \
        -X POST \
        -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: https://www.tikwm.com' \
        -H 'Referer: https://www.tikwm.com/es/' \
        --data-raw 'keywords=${Q}&count=20&cursor=0&web=1&hd=1'`, { encoding: 'utf-8' })

      const json = JSON.parse(res)
      if (json.code !== 0 || !json.data?.videos?.length) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return sock.sendMessage(from, { text: global.messages.busquedaNotFound }, { quoted: msg })
      }

      const allImages = []
      for (const vid of json.data.videos) {
        if (vid.images?.length) allImages.push(vid.images[0])
      }

      const selected = allImages.sort(() => 0.5 - Math.random()).slice(0, 10)
      if (!selected.length) throw new Error('Sin imágenes')

      let albumKey = null
      let enviados = 0

      for (const imgUrl of selected) {
        try {
          const imageResponse = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 10000 })
          const buffer = Buffer.from(imageResponse.data)

          if (!albumKey) {
            const album = sock.generateWAMessageFromContent(from, {
              messageContextInfo: {},
              albumMessage: {
                expectedImageCount: selected.length,
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
            caption: enviados === 0 ? `🎶 ${query}` : ''
          }, { upload: sock.waUploadToServer })

          mediaMsg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: albumKey }
          }

          await sock.relayMessage(from, mediaMsg.message, { messageId: mediaMsg.key.id })
          enviados++
        } catch {}
      }

      if (enviados === 0) throw new Error('No se pudieron procesar las imágenes')
      await sock.sendMessage(from, { react: { text: '✨', key: msg.key } })

    } catch {
      await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
    }
  }
}