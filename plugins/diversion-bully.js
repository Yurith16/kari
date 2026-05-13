// plugins/bully.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bully', 'molestar', 'humillar'],
  tag:       'bully',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de bully a alguien',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '👊', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/bully`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `👊 ¡F por @${victimTag}! @${selfTag} lo está agarrando de bajada... ¡no le tengan piedad! 😈`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🤡 @${selfTag} se está molestando solito, no tiene a quién más molestar.`,
          `🙊 @${selfTag} se humilló solo sin contexto... qué triste.`,
          `📉 @${selfTag} entró en crisis y se hace bully a sí mismo.`,
          `😈 @${selfTag} se molesta solo para no sentirse ignorado.`
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