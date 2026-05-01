// plugins/puta.js

import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['puta', 'puto', 'pxta'],
  tag:       'puta',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🔥', key: msg.key } })

    try {
      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡Se prendió!* @${selfTag} le está diciendo puta a @${victimTag}... ¡Qué atrevido! 🔥😈`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Qué fuego!* @${selfTag} está buscando atención de la mala... ¿Quién se apunta? 🔥😏`,
          `@${selfTag} se soltó el pelo y nadie lo va a detener... ¡Aguas con los comentarios! 🔥`,
          `*Sin contexto:* @${selfTag} anda suelto y sin filtro... ¡Cuidado a quién le tiras! 😈`,
          `@${selfTag} entró en modo peligroso. ¡Alguien que lo calme! 🔥💅`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const gifPath = join(process.cwd(), 'media', 'puta.mp4')
      const gifBuffer = readFileSync(gifPath)

      const enviado = await sock.sendMessage(from, {
        video: gifBuffer,
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '💋' : '✨', key: enviado.key } })
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}