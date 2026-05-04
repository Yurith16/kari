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
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'bully'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😈', key: msg.key } })

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
        txt = `*¡F por @${victimTag}!* @${selfTag} lo está agarrando de bajada... ¡No le tengan piedad! 😈🔥👊`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¿Auto-Bullying?* @${selfTag} se está molestando a sí mismo porque no tiene a quién más molestar. 🤡📉`,
          `@${selfTag} se está humillando solo sin contexto alguno... ¡Qué triste situación! 🙊💔`,
          `*Momento de crisis:* @${selfTag} empezó a hacerse bully solito. ¿Ocupas un abrazo? 🫂📉`,
          `*Nivel de soledad:* @${selfTag} se está molestando a sí mismo para no sentirse ignorado. 😈🤣`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const enviado = await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '🤣' : '🤡', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}