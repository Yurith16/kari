// plugins/cringe.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cringe', 'pena', 'asco'],
  tag:       'cringe',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😵‍💫', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cringe`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡DIOS MÍO!* @${selfTag} está sintiendo un nivel de cringe extremo por lo que hizo @${victimTag}... 🤮💀`
        mentions.push(victimJid)
      } else {
        txt = `*Nivel de Cringe: 100%* @${selfTag} no puede con tanta pena ajena... ¡Alguien borre eso! 😬🤢`
      }

      const enviado = await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: '🤮', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}