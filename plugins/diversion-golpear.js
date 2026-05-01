// plugins/golpear.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['golpear', 'golpe', 'patada'],
  tag:       'golpear',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'golpe'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🥊', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kick`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡FIGHT!* @${selfTag} le metió tremendo golpe a @${victimTag}... ¡Eso tuvo que doler! 🥊💥`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¿Y a este qué le dio?* @${selfTag} se dio un golpe a sí mismo sin contexto alguno... 🤡🥊`,
          `*¡Alguien que lo detenga!* @${selfTag} anda tirando golpes al aire porque sí. 💨💥`,
          `*Momento Random:* @${selfTag} se metió un golpe solito para ver si despertaba. 🤕✨`,
          `@${selfTag} le dio un golpe a @${selfTag} solo porque tenía ganas de pelear con alguien. 🥊🥊`
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
        await sock.sendMessage(from, { react: { text: targetJid ? '💥' : '❓', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}