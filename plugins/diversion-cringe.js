// plugins/cringe.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cringe', 'pena', 'asco'],
  tag:       'cringe',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de cringe',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😬', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cringe`
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
          `@${selfTag} sintió cringe por lo que hizo @${victimTag}, qué pena ajena. 😬`,
          `@${selfTag} no puede con la vergüenza que le dio @${victimTag}, alguien que lo ayude. 🤢`,
          `@${selfTag} vio a @${victimTag} y le dio un escalofrío de esos incómodos. 💀`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} recordó algo que hizo y le dio cringe nivel experto. 😬`,
          `@${selfTag} se avergonzó solito, a todos nos ha pasado. 🤢`,
          `@${selfTag} sintió pena ajena de sí mismo, tranquilo no eres el único. 💀`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, pero yo ya sentí el cringe por él. 😬`,
          `@${selfTag} se quedó sin culpable, aunque la pena ajena se siente igual. 🤢`,
          `@${selfTag} no señaló a nadie, pero algo incómodo pasó y todos lo sabemos. 💀`
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
        txt = `@${selfTag} sintió cringe por lo que hizo @${victima}, qué pena ajena. 😬`
      } else if (victima === selfTag) {
        txt = `@${selfTag} recordó algo que hizo y le dio cringe nivel experto. 😬`
      } else {
        txt = `@${selfTag} no mencionó a nadie, pero yo ya sentí el cringe por él. 😬`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}