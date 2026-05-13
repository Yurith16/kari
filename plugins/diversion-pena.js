// plugins/sonrojar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['sonrojar', 'blush', 'penita', 'tímido'],
  tag:       'sonrojar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de sonrojo',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😳', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/blush`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `😳 @${selfTag} se sonrojó por culpa de @${victimTag}... ¡hay amor en el grupo! 💖`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🍅 @${selfTag} se puso rojo como un tomate sin razón.`,
          `😳 @${selfTag} anda tímido hoy, ¿quién le dijo algo lindo?`,
          `🤫 @${selfTag} se sonrojó solito... tiene un secreto.`,
          `🌸 @${selfTag} está sintiendo mucha penita ahora mismo.`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const enviado = await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}