// plugins/abrazar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['abrazar', 'cuddle', 'abrazo'],
  tag:       'abrazar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'acurrucar'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🫂', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cuddle`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡Qué romántico!* @${selfTag} se acurrucó tiernamente con @${victimTag}... El tiempo se detuvo para ellos. ✨🧸💖`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Alerta de soledad!* @${selfTag} se está acurrucando con su almohada porque nadie le hace caso... 🧸💔`,
          `@${selfTag} anda buscando un abracito desesperadamente. ¿Alguien se ofrece? 🫂✨`,
          `*Sin contexto:* @${selfTag} se acurrucó con el aire. El drama de la soltería es real. ✨🤡`,
          `@${selfTag} entró en modo cariñoso, pero no encontró a nadie... ¡Qué triste! 🥺🍃`
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
        await sock.sendMessage(from, { react: { text: targetJid ? '💖' : '🧸', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}