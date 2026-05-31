// plugins/gay.js

import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['gay', 'gey', 'homosexual', 'marica', 'loca'],
  tag:       'gay',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif gay',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🏳️‍🌈', key: msg.key } })

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
        txt = `🏳️‍🌈 @${selfTag} dice que @${victimTag} es bien gay... ¡y qué! 💅`
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `🏳️‍🌈 @${selfTag} dice que @${victim1Tag} y @${victim2Tag} son bien gay... ¡y qué! 💅`
      }
      else {
        const frasesRandom = [
          `🏳️‍🌈 @${selfTag} salió del clóset con todo, ¡así se hace!`,
          `💅 @${selfTag} aceptó que le gusta el arroz con popote, bien por ti.`,
          `✨ @${selfTag} dice que plátano donde sea, ¡date cuenta!`,
          `🌈 @${selfTag} se declaró fan de la salchicha, ¡qué viva el amor!`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      const gifPath = join(process.cwd(), 'media', 'gay.mp4')
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