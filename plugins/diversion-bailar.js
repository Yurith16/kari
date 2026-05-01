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

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'bailar'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🕺', key: msg.key } })

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
        txt = `*¡Sácale brillo al piso!* @${selfTag} está bailando con @${victimTag}... ¡Qué gran ritmo tienen! 💃🕺✨🔥`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Suelten la música!* @${selfTag} se puso a bailar sin contexto porque la vida es bella. 🕺🎶✨`,
          `@${selfTag} tiene los mejores pasos del grupo. ¡Miren cómo se mueve! 💃🔥`,
          `*Modo Fiesta:* @${selfTag} está celebrando solo... ¡No necesita a nadie para brillar! ✨🕺🕺`,
          `@${selfTag} sacó los pasos prohibidos... ¡Cuidado que quema el suelo! 💃💥`
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
        await sock.sendMessage(from, { react: { text: targetJid ? '✨' : '🔥', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}