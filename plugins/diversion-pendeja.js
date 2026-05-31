// plugins/pendejo.js

import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['pendeja', 'pendejo', 'pndjo', 'idiota', 'tonto'],
  tag:       'pendejo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de pendeja',

  async execute(sock, msg, { from, args }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1).toLowerCase() || 'pendejo'
    const esFemenino = usedCommand === 'pendeja'

    await sock.sendMessage(from, { react: { text: '🤪', key: msg.key } })

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
      const insulto = esFemenino ? 'pendeja' : 'pendejo'
      
      if (victimas.length === 1) {
        const victimTag = victimas[0].split('@')[0]
        if (esFemenino) {
          txt = `🤪 @${selfTag} dice que @${victimTag} es bien ${insulto}... ¡aguas con las burlas! 💅`
        } else {
          txt = `🤪 @${selfTag} dice que @${victimTag} es bien ${insulto}... ¡aguas con las burlas!`
        }
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        if (esFemenino) {
          txt = `🤪 @${selfTag} dice que @${victim1Tag} y @${victim2Tag} son bien ${insulto}s... ¡doble burla! 💅`
        } else {
          txt = `🤪 @${selfTag} dice que @${victim1Tag} y @${victim2Tag} son bien ${insulto}s... ¡doble burla!`
        }
      }
      else {
        if (esFemenino) {
          const frasesRandom = [
            `💅 @${selfTag} anda en modo ${insulto} hoy, ¿quién le baja?`,
            `🤪 @${selfTag} hizo una pendejada tan grande que hasta le aplaudieron.`,
            `🤡 @${selfTag} se declaró oficialmente la ${insulto} del grupo.`,
            `😂 @${selfTag} está haciendo cada pendejada, ¡ya ubícate!`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        } else {
          const frasesRandom = [
            `🤪 @${selfTag} anda en modo ${insulto} hoy, ¿quién le baja?`,
            `😂 @${selfTag} hizo una pendejada tan grande que hasta le aplaudieron.`,
            `🤡 @${selfTag} se declaró oficialmente el ${insulto} del grupo.`,
            `👏 @${selfTag} está haciendo cada pendejada, ¡ya ubícate!`
          ]
          txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
        }
      }

      const gifPath = join(process.cwd(), 'media', 'pendejo.mp4')
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