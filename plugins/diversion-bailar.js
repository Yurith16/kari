// plugins/bailar.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bailar', 'dance', 'baile', 'danzar'],
  tag:       'bailar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de baile',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '💃', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/dance`
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
        txt = `💃 ¡Qué ritmo! @${selfTag} y @${victimTag} están bailando juntos, brillan en la pista. ✨`
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `💃 ¡Fiesta! @${selfTag}, @${victim1Tag} y @${victim2Tag} están bailando como si nadie los viera. ✨`
      }
      else {
        const frasesRandom = [
          `🕺 ¡Suelten la música! @${selfTag} se puso a bailar porque la vida es bonita.`,
          `💃 @${selfTag} tiene los mejores pasos, miren cómo se mueve.`,
          `✨ @${selfTag} está celebrando solito, no necesita a nadie para brillar.`,
          `🔥 @${selfTag} sacó los pasos prohibidos, cuidado que quema el suelo.`
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