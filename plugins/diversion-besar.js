// plugins/besar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['besar', 'kiss', 'besito', 'beso'],
  tag:       'besar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de besos',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '💋', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kiss`
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
          `@${selfTag} le dio un beso a @${victimTag}, así de repente y sin avisar. 💋`,
          `@${selfTag} besó a @${victimTag}, qué bonito cuando pasa eso. 😚`,
          `@${selfTag} le robó un beso a @${victimTag}, y no parece que haya queja. 🌸`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} lanza besos al aire, a veces uno necesita practicar. 💋`,
          `@${selfTag} se manda un beso a sí mismo, amor propio ante todo. 😚`,
          `@${selfTag} está repartiendo besos al vacío, alguien que le corresponda. 🌸`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, así que yo te doy un beso para que no te quedes sin. 💋`,
          `@${selfTag} se quedó sin quién besar, ven que yo te correspondo con cariño. 😚`,
          `@${selfTag} nadie más se animó, pero aquí estoy yo para darte tu besito. 🌸`
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
        txt = `@${selfTag} le dio un beso a @${victima}, así de repente y sin avisar. 💋`
      } else if (victima === selfTag) {
        txt = `@${selfTag} lanza besos al aire, a veces uno necesita practicar. 💋`
      } else {
        txt = `@${selfTag} no mencionó a nadie, así que yo te doy un beso para que no te quedes sin. 💋`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}