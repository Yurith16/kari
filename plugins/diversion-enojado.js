// plugins/enojado.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['enojado', 'angry', 'mad'],
  tag:       'enojado',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de enojo',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😡', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/angry`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `😡 ¡Corran! @${selfTag} perdió la paciencia con @${victimTag}... ¡que alguien los separe! 💢`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `💢 @${selfTag} está que explota de rabia, mejor no digan nada.`,
          `🤬 @${selfTag} entró en modo furia, no se le acerquen.`,
          `😤 @${selfTag} está enojado con el mundo entero.`,
          `💥 @${selfTag} reventó de la ira, aguas con esa persona.`
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