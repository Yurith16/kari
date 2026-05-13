// plugins/mimo.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['mimo', 'esponjoso', 'ternura', 'mimos'],
  tag:       'mimo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de mimos a alguien',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '☁️', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/fluff`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `☁️ @${selfTag} se puso cariñoso con @${victimTag}... ¡demasiada ternura para este grupo! 💖`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🌸 @${selfTag} anda en modo esponjoso, ¡qué lindo!`,
          `☁️ @${selfTag} se siente como una nube hoy, pura ternura.`,
          `🧸 @${selfTag} está repartiendo vibras bonitas a todos.`,
          `🍬 @${selfTag} entró en modo dulce, cuidado que se contagia.`
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