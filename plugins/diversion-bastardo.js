// plugins/bastardo.js

import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bastarda', 'bastardo', 'bstrd'],
  tag:       'bastardo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,

  async execute(sock, msg, { from, args }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1).toLowerCase() || 'bastardo'
    const esFemenino = usedCommand === 'bastarda'

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    const targetJid = contextInfo?.participant || contextInfo?.mentionedJid?.[0]

    await sock.sendMessage(from, { react: { text: '😈', key: msg.key } })

    try {
      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]

      let txt = ''
      let mentions = [selfJid]

      if (targetJid) {
        const victimJid = await getRealJid(sock, targetJid, msg)
        const victimTag = victimJid.split('@')[0]
        if (esFemenino) {
          txt = `*¡Qué bastarda!* @${selfTag} le está diciendo bastarda a @${victimTag}... ¡Se armó el drama, amiga! 😈🔥💅`
        } else {
          txt = `*¡Qué bastardo!* @${selfTag} le está diciendo bastardo a @${victimTag}... ¡Se armó el drama, compa! 😈🔥`
        }
        mentions.push(victimJid)
      } else {
        if (esFemenino) {
          const frasesRandom = [
            `*¡Ay, qué bastarda!* @${selfTag} se puso en modo villana... ¡Cuidado con esa morra! 😈💅`,
            `@${selfTag} anda de bastarda hoy... ¡Nadie la detiene, amiga! 🔥`,
            `*Sin contexto:* @${selfTag} se declaró la más bastarda del grupo. 👑😈`,
            `@${selfTag} sacó su lado bastardo... ¡Y lo presume! 💋🔥`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        } else {
          const frasesRandom = [
            `*¡Ay, qué bastardo!* @${selfTag} se puso en modo villano... ¡Cuidado con ese wey! 😈`,
            `@${selfTag} anda de bastardo hoy... ¡Nadie lo detiene, compa! 🔥`,
            `*Sin contexto:* @${selfTag} se declaró el más bastardo del grupo. 👑😈`,
            `@${selfTag} sacó su lado bastardo... ¡Y lo presume! 🔥`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        }
      }

      const gifPath = join(process.cwd(), 'media', 'bastardo.mp4')
      const gifBuffer = readFileSync(gifPath)

      const enviado = await sock.sendMessage(from, {
        video: gifBuffer,
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

      if (enviado) {
        await sock.sendMessage(from, { react: { text: targetJid ? '👑' : '😈', key: enviado.key } })
      }

    } catch (err) {
      console.error(err)
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}