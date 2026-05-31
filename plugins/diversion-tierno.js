// plugins/tierno.js

import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['tierno', 'cute', 'eevee', 'adorable', 'lindo'],
  tag:       'tierno',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif tierno',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🐾', key: msg.key } })

    try {
      const videoUrl = `http://cdn.delirius.store/v2/reaction/sfw/eevee/PpHuCB0.mp4`

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
        txt = `🐾 @${selfTag} está siendo demasiado adorable con @${victimTag}... ¡no podemos con tanta dulzura! 💖`
      } 
      else if (victimas.length >= 2) {
        const victim1Tag = victimas[0].split('@')[0]
        const victim2Tag = victimas[1].split('@')[0]
        txt = `🐾 @${selfTag} está siendo demasiado adorable con @${victim1Tag} y @${victim2Tag}... ¡dosis doble de dulzura! 💖`
      }
      else {
        const frasesRandom = [
          `🐾 @${selfTag} apareció en modo súper adorable sin avisar.`,
          `🌸 @${selfTag} está irradiando pura dulzura hoy.`,
          `🍬 @${selfTag} decidió que hoy es un día para ser adorable.`,
          `🧸 @${selfTag} activó su modo tierno, imposible no querer abrazarlo.`
        ]
        txt = frasesRandom[Math.floor(Math.random() * frasesRandom.length)]
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}