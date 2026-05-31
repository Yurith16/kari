// plugins/sonrojar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['sonrojar', 'blush', 'penita', 'tímido', 'rojito'],
  tag:       'sonrojar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de sonrojo',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😳', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/blush`
      const { data: res } = await axios.get(apiUrl)

      if (!res.status || !res.data) throw new Error()

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
        txt = `😳 @${selfTag} se sonrojó por culpa de @${victimTag}... ¡hay amor en el grupo! 💖`
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `😳 @${selfTag} se sonrojó por culpa de @${victim1Tag} y @${victim2Tag}... ¡doble sonrojo! 💖`
      }
      else {
        const frasesRandom = [
          `🍅 @${selfTag} se puso rojo como un tomate sin razón.`,
          `😳 @${selfTag} anda tímido hoy, ¿quién le dijo algo lindo?`,
          `🤫 @${selfTag} se sonrojó solito... tiene un secreto.`,
          `🌸 @${selfTag} está sintiendo mucha penita ahora mismo.`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      await sock.sendMessage(from, {
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