// plugins/llorar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['llorar', 'cry', 'triste', 'sad'],
  tag:       'llorar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de llanto',

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'llorar'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🥺', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cry`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡Qué cruel!* @${selfTag} está llorando desconsoladamente por culpa de @${victimTag}... 😭💔🥀`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Inundación!* @${selfTag} se puso a llorar sin contexto alguno... ¡Traigan pañuelos! 😭🌊`,
          `@${selfTag} está llorando solito en un rincón. ¿Quién le rompió el corazón? 💔🥺`,
          `*Momento triste:* @${selfTag} entró en modo depresión extrema. ¡Denle un abrazo! 🫂😭`,
          `@${selfTag} empezó a llorar porque sí. El drama es su pasión. ✨💧`
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
        await sock.sendMessage(from, { react: { text: targetJid ? '💔' : '💧', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}