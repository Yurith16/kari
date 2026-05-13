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
  descripcion: 'Envía un gif de golpe a alguien',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '👊', key: msg.key } })

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
        txt = `👊 ¡Fight! @${selfTag} le metió un golpe a @${victimTag}... ¡eso tuvo que doler! 💥`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🤡 @${selfTag} se dio un golpe solito, ¿y a este qué le dio?`,
          `💨 @${selfTag} anda tirando golpes al aire porque sí.`,
          `🤕 @${selfTag} se metió un golpe para ver si despertaba.`,
          `🥊 @${selfTag} quería pelear pero no encontró contrincante.`
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