// plugins/tierno.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['tierno', 'cute', 'eevee'],
  tag:       'tierno',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'tierno'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🥺', key: msg.key } })

    try {
      const videoUrl = `http://cdn.delirius.store/v2/reaction/sfw/eevee/PpHuCB0.mp4`

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡Ataque de ternura!* @${selfTag} está siendo demasiado adorable con @${victimTag}... ¡No podemos con tanta dulzura! ✨🐾💖`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Alerta de ternura!* @${selfTag} apareció en modo súper adorable sin avisar. 🐾✨`,
          `@${selfTag} está irradiando pura dulzura hoy... ¡Miren qué lindo se ve! 🌸🥺`,
          `*Sin contexto:* @${selfTag} decidió que hoy es un día para ser adorable. 🍬✨`,
          `@${selfTag} activó su modo tierno. ¡Imposible no querer darle un abrazo! 🧸💖`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const enviado = await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '💖' : '🐾', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}