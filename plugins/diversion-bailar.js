// plugins/bailar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bailar', 'dance', 'baile'],
  tag:       'bailar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de baile',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '💃', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/dance`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `💃 ¡Qué ritmo! @${selfTag} y @${victimTag} están bailando juntos, brillan en la pista. ✨`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🕺 ¡Suelten la música! @${selfTag} se puso a bailar porque la vida es bonita.`,
          `💃 @${selfTag} tiene los mejores pasos, miren cómo se mueve.`,
          `✨ @${selfTag} está celebrando solito, no necesita a nadie para brillar.`,
          `🔥 @${selfTag} sacó los pasos prohibidos, cuidado que quema el suelo.`
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