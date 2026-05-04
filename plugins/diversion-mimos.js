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
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'fluff'

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
        txt = `*¡Dosis de ternura!* @${selfTag} se puso súper cariñoso con @${victimTag}... ¡Es demasiado fluff para este grupo! ✨☁️💖`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Alerta de azúcar!* @${selfTag} anda en modo esponjoso sin ninguna razón. ¡Qué lindo! 🌸✨`,
          `@${selfTag} se siente como una nube hoy... ¡Pura ternura y mimos! ☁️🍭`,
          `*Sin contexto:* @${selfTag} está repartiendo vibras esponjosas a todo el que lea esto. ✨🧸`,
          `@${selfTag} entró en modo Fluff. ¡Cuidado, que su dulzura es contagiosa! 🍬🌸`
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
        await sock.sendMessage(from, { react: { text: targetJid ? '🍭' : '✨', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}