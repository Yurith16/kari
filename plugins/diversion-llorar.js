// plugins/llorar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['llorar', 'cry', 'triste', 'sad'],
  tag:       'llorar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de llanto',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😭', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cry`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `😭 @${selfTag} está llorando por culpa de @${victimTag}... ¡qué cruel! 💔`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `😭 @${selfTag} se puso a llorar sin razón, traigan pañuelos.`,
          `💔 @${selfTag} está llorando solito, ¿quién le rompió el corazón?`,
          `🥺 @${selfTag} entró en modo tristeza, denle un abrazo.`,
          `💧 @${selfTag} empezó a llorar porque sí, el drama es su pasión.`
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