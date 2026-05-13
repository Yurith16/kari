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
  descripcion: 'Envía un gif de bastardo',

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
          txt = `😈 @${selfTag} le dijo bastarda a @${victimTag}... ¡se armó el drama, amiga! 💅`
        } else {
          txt = `😈 @${selfTag} le dijo bastardo a @${victimTag}... ¡se armó el drama, compa!`
        }
        mentions.push(victimJid)
      } else {
        if (esFemenino) {
          const frasesRandom = [
            `💅 @${selfTag} se puso en modo villana, cuidado con ella.`,
            `🔥 @${selfTag} anda de bastarda hoy, nadie la detiene.`,
            `👑 @${selfTag} se declaró la más bastarda del grupo.`,
            `😈 @${selfTag} sacó su lado bastardo y lo presume.`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        } else {
          const frasesRandom = [
            `😈 @${selfTag} se puso en modo villano, cuidado con él.`,
            `🔥 @${selfTag} anda de bastardo hoy, nadie lo detiene.`,
            `👑 @${selfTag} se declaró el más bastardo del grupo.`,
            `😈 @${selfTag} sacó su lado bastardo y lo presume.`
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

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}