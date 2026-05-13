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
  descripcion: 'Envía un gif de cachetada a alguien',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '✋', key: msg.key } })

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
        txt = `✋ ¡Reacciona! @${selfTag} le dio una cachetada a @${victimTag}... ¡eso sonó fuerte! 💥`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🤦 @${selfTag} se dio una cachetada solito, perdió el sentido.`,
          `🤡 @${selfTag} se pegó solo porque tenía ganas de drama.`,
          `😤 @${selfTag} se dio un golpe en la cara, no puede creer lo que leyó.`,
          `💥 @${selfTag} se cacheteó sin razón... ¡reacciona!`
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