// plugins/fgtest.js

import fg from 'fg-senna'

export default {
  command: 'fgtest',
  tag: 'fgtest',
  categoria: 'owner',
  owner: true,
  group: false,
  nsfw: false,
  descripcion: 'Test FG-Senna',

  async execute(sock, msg, { from, args }) {
    if (!args[0]) return sock.sendMessage(from, { text: '🌸 Pásame una URL de YouTube.' }, { quoted: msg })

    try {
      const qualities = ['360p', '480p', '720p', '240p', '144p']
      let result = null

      for (const q of qualities) {
        try {
          const res = await fg.ytv(args[0], q)
          if (res && res.dl_url) {
            result = res
            break
          }
        } catch {}
      }

      if (!result) return sock.sendMessage(from, { text: '⚠️ FG-Senna no encontró nada.' }, { quoted: msg })

      await sock.sendMessage(from, {
        text: `🎬 *FG-Senna OK*\n\n♡ *Título:* ${result.title}\n♡ *Calidad:* ${result.quality}\n♡ *URL:* ${result.dl_url}`
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { text: global.messages.error }, { quoted: msg })
    }
  }
}