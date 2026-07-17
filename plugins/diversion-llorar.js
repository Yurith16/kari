// plugins/llorar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['llorar', 'cry', 'triste', 'sad', 'lagrimas'],
  tag:       'llorar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de llanto',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😢', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cry`
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
          `@${selfTag} está llorando por @${victimTag}, se vale de vez en cuando. 😢`,
          `@${selfTag} llora junto a @${victimTag}, a veces hace falta soltarlo. 💧`,
          `@${selfTag} soltó una lágrima por @${victimTag}, de esas que salen del alma. 😭`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se echó a llorar solito, a veces el alma necesita desahogarse. 😢`,
          `@${selfTag} anda triste y llorando, un buen llanto limpia el corazón. 💧`,
          `@${selfTag} soltó las lágrimas sin avisar, no hay que guardarse todo. 😭`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, así que yo lloro contigo. Un llanto compartido pesa menos. 😢`,
          `@${selfTag} se quedó sin hombro donde llorar, pero aquí está el mío por si sirve. 💧`,
          `@${selfTag} está llorando y no dijo por qué, pero yo lo acompaño en silencio. 😭`
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
        txt = `@${selfTag} está llorando por @${victima}, se vale de vez en cuando. 😢`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se echó a llorar solito, a veces el alma necesita desahogarse. 😢`
      } else {
        txt = `@${selfTag} no mencionó a nadie, así que yo lloro contigo. Un llanto compartido pesa menos. 😢`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}