// plugins/feliz.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['feliz', 'happy', 'alegre'],
  tag:       'feliz',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de felicidad',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😁', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/happy`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `✨ @${selfTag} está feliz junto a @${victimTag}... ¡qué bonito verlos así! 🥳`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `🌈 @${selfTag} se siente la persona más feliz del mundo hoy.`,
          `😁 @${selfTag} anda con una sonrisa que no le cabe en la cara.`,
          `🎊 @${selfTag} decidió ser feliz y lo está logrando.`,
          `☀️ @${selfTag} está irradiando pura felicidad, nada puede salir mal.`
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