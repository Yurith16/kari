// plugins/tiktok.js

import axios from 'axios'

export default {
  command: ['tiktok', 'tt'],
  tag: 'tiktok',
  categoria: 'descargas',
  owner: false,
  group: false,
  nsfw: false,
  descripcion: 'Descarga videos de TikTok en calidad HD',

  async execute(sock, msg, { from, args, prefix }) {
    if (!args.length) return sock.sendMessage(from, { 
  text: '🌸 Pásame el enlace del TikTok que quieres descargar.'
}, { quoted: msg })

    const videoUrl = args[0]

    try {
      await sock.sendMessage(from, { react: { text: '🔎', key: msg.key } })

      let videoDl

      try {
        const { data } = await axios.post('https://panel.apinexus.fun/api/tiktok/descargar', {
          url: videoUrl
        }, {
          headers: { 'Content-Type': 'application/json', 'x-api-key': 'antbx21e5jhac' },
          timeout: 15000
        })

        if (data?.success && data?.data?.videoUrl) {
          videoDl = data.data.videoUrl
        }
      } catch {}

      if (!videoDl) {
        const { data: json } = await axios.post('https://www.tikwm.com/api/', 
          new URLSearchParams({ url: videoUrl, count: '12', cursor: '0', web: '1', hd: '1' }),
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0',
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Requested-With': 'XMLHttpRequest',
              'Origin': 'https://www.tikwm.com',
              'Referer': 'https://www.tikwm.com/es/'
            },
            timeout: 15000
          }
        )

        if (json.code !== 0 || !json.data) throw new Error('Error API')
        videoDl = json.data.hdplay ? `https://www.tikwm.com${json.data.hdplay}` : `https://www.tikwm.com${json.data.play}`
      }

      if (!videoDl) {
        await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
        return await sock.sendMessage(from, { text: global.messages.descargaError }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } })

      const videoRes = await axios.get(videoDl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:150.0) Gecko/20100101 Firefox/150.0' },
        timeout: 120000
      })

      const videoBuffer = Buffer.from(videoRes.data)
      const sizeMB = videoBuffer.length / (1024 * 1024)

      let enviado
      if (sizeMB > 80) {
        enviado = await sock.sendMessage(from, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `tiktok_${Date.now()}.mp4`
        }, { quoted: msg })
      } else {
        enviado = await sock.sendMessage(from, {
          video: videoBuffer,
          mimetype: 'video/mp4'
        }, { quoted: msg })
      }

      await sock.sendMessage(from, { react: { text: '🌸', key: msg.key } })
      if (enviado) await sock.sendMessage(from, { react: { text: '🌱', key: enviado.key } })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}