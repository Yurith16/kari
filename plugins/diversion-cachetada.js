// plugins/cachetada.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cachetada', 'slap', 'bofetada'],
  tag:       'cachetada',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'cachetada'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😤', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/slap`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡REACCIONA!* @${selfTag} le dio una bofetada épica a @${victimTag} para que se ubique... ¡Eso sonó fuerte! ✋💥🔥`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡POV:* Te das una cachetada sin contexto! @${selfTag} perdió el sentido y se pegó solito. 🤦‍♂️💥`,
          `*¿Todo bien?* @${selfTag} se dio una bofetada a sí mismo solo porque tenía ganas de sentir el drama. ✋🤡`,
          `@${selfTag} se dio un golpe en la cara porque no puede creer lo que acaba de leer... ¡Ubícate! 😤✨`,
          `*Momento épico:* @${selfTag} se dio una cachetada sin razón alguna. ¡Reacciona, hombre! 💥🤕`
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
        await sock.sendMessage(from, { react: { text: targetJid ? '⚡' : '🤔', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}