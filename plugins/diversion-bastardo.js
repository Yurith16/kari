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

    await sock.sendMessage(from, { react: { text: '😈', key: msg.key } })

    try {
      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      
      const mentions = [selfJid]
      let victimas = []

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      if (quotedParticipant) {
        const victimJid = await getRealJid(sock, quotedParticipant, msg)
        victimas.push(victimJid)
        mentions.push(victimJid)
      }
      
      for (const jid of mentionedJids) {
        if (victimas.length >= 2) break
        const victimJid = await getRealJid(sock, jid, msg)
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
        }
      }
      
      for (const match of textMentions) {
        if (victimas.length >= 2) break
        const num = match.replace('@', '')
        const victimJid = `${num}@s.whatsapp.net`
        if (!victimas.some(v => v === victimJid)) {
          victimas.push(victimJid)
          mentions.push(victimJid)
        }
      }

      let txt = ''
      
      if (victimas.length === 1) {
        const victimTag = victimas[0].split('@')[0]
        if (esFemenino) {
          txt = `😈 @${selfTag} le dijo bastarda a @${victimTag}... ¡se armó el drama, amiga! 💅`
        } else {
          txt = `😈 @${selfTag} le dijo bastardo a @${victimTag}... ¡se armó el drama, compa!`
        }
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        if (esFemenino) {
          txt = `😈 @${selfTag} les dijo bastarda a @${victim1Tag} y @${victim2Tag}... ¡se viene la trifulca!`
        } else {
          txt = `😈 @${selfTag} les dijo bastardo a @${victim1Tag} y @${victim2Tag}... ¡se viene la trifulca!`
        }
      }
      else {
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

      await sock.sendMessage(from, {
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