// plugins/acariciar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['acariciar', 'pat'],
  tag:       'acariciar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de caricias a alguien',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🖐️', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/pat`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `🖐️ @${selfTag} acarició la cabecita de @${victimTag}... todo estará bien. ✨`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🥺 @${selfTag} se acaricia solito, ¿alguien quiere darle un cariño?`,
          `✨ @${selfTag} se está dando ánimos, tú puedes con todo.`,
          `🌸 @${selfTag} se dio un cariñito en la cabeza por ser buen chico.`,
          `🫂 @${selfTag} busca mimos pero no encontró a nadie.`
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