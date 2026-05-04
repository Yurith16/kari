// plugins/morder.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['morder', 'bite'],
  tag:       'morder',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de mordida a alguien',

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1) || 'morder'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🫦', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/bite`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡Ouch!* @${selfTag} mordió a @${victimTag}... ¿Fue con cariño o con hambre? 🦷💥`
        mentions.push(victimJid)
      } else {
        txt = `*¿Todo bien en casa?* @${selfTag} se mordió a sí mismo... ¡Eso debió doler! 🦷🤕`
      }

      const enviado = await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '🦴' : '🚑', key: enviado.key } })
      }

    } catch (err) {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}