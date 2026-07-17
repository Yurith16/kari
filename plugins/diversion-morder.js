// plugins/morder.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['morder', 'bite', 'mordisco', 'mordida', 'muerde'],
  tag:       'morder',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de mordida a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🦷', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/bite`
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
          `@${selfTag} le dio una mordida a @${victimTag}, con cuidado se espera. 🦷`,
          `@${selfTag} mordió a @${victimTag}, así de repente y sin avisar. 😬`,
          `@${selfTag} le plantó un mordisco a @${victimTag}, algo habrá hecho para merecerlo. 🫦`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se mordió a sí mismo, a veces la frustración se paga con uno. 🦷`,
          `@${selfTag} se dio un mordisco, todos hemos estado ahí. 😬`,
          `@${selfTag} anda con ganas de morder pero no encontró a nadie. 🫦`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, así que yo recibo la mordida. Pero con cuidado, ¿eh? 🦷`,
          `@${selfTag} se quedó sin a quién morder, pero aquí estoy yo para el sacrificio. 😬`,
          `@${selfTag} tiró el mordisco al aire y yo lo atrapé, no pregunten cómo. 🫦`
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
        txt = `@${selfTag} le dio una mordida a @${victima}, con cuidado se espera. 🦷`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se mordió a sí mismo, a veces la frustración se paga con uno. 🦷`
      } else {
        txt = `@${selfTag} no mencionó a nadie, así que yo recibo la mordida. Pero con cuidado, ¿eh? 🦷`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}