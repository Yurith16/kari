// plugins/gay.js

import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['gay', 'gey', 'homosexual'],
  tag:       'gay',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif gay',

  async execute(sock, msg, { from }) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '🏳️‍🌈', key: msg.key } })

    try {
      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        txt = `*¡Se destapó!* @${selfTag} dice que @${victimTag} es bien gay... ¡Y qué! 🏳️‍🌈💅✨`
        mentions.push(victimJid)
      } else {
        const frasesRandom = [
          `*¡Fuera caretas!* @${selfTag} aceptó que le gusta el arroz con popote... ¡Bien por ti! 🏳️‍🌈🔥`,
          `@${selfTag} salió del clóset con todo... ¡Así se hace, amiga! 💅✨`,
          `*Sin miedo:* @${selfTag} dice que plátano donde sea... ¡Date cuenta! 🍌👨‍❤️‍👨`,
          `@${selfTag} se declaró fan de la salchicha... 🌭💋 ¡Qué viva el amor!`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const gifPath = join(process.cwd(), 'media', 'gay.mp4')
      const gifBuffer = readFileSync(gifPath)

      const enviado = await sock.sendMessage(from, {
        video: gifBuffer,
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '💋' : '🏳️‍🌈', key: enviado.key } })
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}