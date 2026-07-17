// plugins/bailar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bailar', 'dance', 'baile', 'danzar'],
  tag:       'bailar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
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
      let victima = null

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      if (quotedParticipant) {
        victima = await getRealJid(sock, quotedParticipant, msg)
      } 
      else if (mentionedJids.length > 0) {
        victima = await getRealJid(sock, mentionedJids[0], msg)
      } 
      else if (textMentions.length > 0) {
        const num = textMentions[0].replace('@', '')
        victima = `${num}@s.whatsapp.net`
      }

      let txt = ''
      
      if (victima && victima !== selfJid) {
        mentions.push(victima)
        const victimTag = victima.split('@')[0]
        
        const frasesPareja = [
          `@${selfTag} sacó a bailar a @${victimTag}, qué bien se ven juntos en la pista. 💃`,
          `@${selfTag} y @${victimTag} están bailando, esa conexión no se ensaya. ✨`,
          `@${selfTag} se lanzó a bailar con @${victimTag}, así sin avisar y sin vergüenza. 🕺`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se puso a bailar solito, con toda la actitud. 💃`,
          `@${selfTag} sacó los pasos prohibidos, no necesita a nadie para brillar. 🕺`,
          `@${selfTag} está bailando con su propia sombra, y lo hace bien. ✨`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, así que yo bailo contigo para que no estés solo. 💃`,
          `@${selfTag} se quedó sin pareja, ven que yo te acompaño en la pista. 🕺`,
          `@${selfTag} nadie más se animó, pero yo sí. Vamos a bailar juntos. ✨`
        ]
        
        txt = frasesMidori[Math.floor(Math.random() * frasesMidori.length)]
      }

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg).catch(() => null)
      const selfTag = selfJid ? selfJid.split('@')[0] : 'Alguien'
      
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      let victima = null
      if (quotedParticipant) {
        victima = quotedParticipant.split('@')[0]
      } else if (mentionedJids.length > 0) {
        victima = mentionedJids[0].split('@')[0]
      } else if (textMentions.length > 0) {
        victima = textMentions[0].replace('@', '')
      }

      let txt = ''
      if (victima && victima !== selfTag) {
        txt = `@${selfTag} sacó a bailar a @${victima}, qué bien se ven juntos en la pista. 💃`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se puso a bailar solito, con toda la actitud. 💃`
      } else {
        txt = `@${selfTag} no mencionó a nadie, así que yo bailo contigo para que no estés solo. 💃`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}