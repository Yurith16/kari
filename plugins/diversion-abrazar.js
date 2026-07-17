// plugins/abrazar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['abrazar', 'abrazos', 'abrazo'],
  tag:       'abrazar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de abrazo a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🫂', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cuddle`
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
          `@${selfTag} le dio un abrazo a @${victimTag}, de esos que se sienten bonito. 🤗`,
          `@${selfTag} se acercó y abrazó a @${victimTag}, porque a veces hace falta sin razón. 🫂`,
          `@${selfTag} envolvió a @${victimTag} en un abrazo, así sin avisar y sin pretextos. 🌴`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se abrazó a sí mismo, porque a veces uno necesita su propio cariño. 🤗`,
          `@${selfTag} se dio un abrazo, no hay que esperar a que otro lo haga. 🫂`,
          `@${selfTag} se envolvió en sus propios brazos, a veces toca. 🌴`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, así que yo te abrazo. Ven aquí, no digas que no te quiero. 🤗`,
          `@${selfTag} se quedó sin abrazo, pero aquí estoy yo. Toma tu abrazo de Midori, no es mucho pero es con cariño. 🫂`,
          `@${selfTag} nadie se ofreció a abrazarte, así que me toca a mí. No te quejes, es con buena intención. 🌴`
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
        txt = `@${selfTag} le dio un abrazo a @${victima}, de esos que se sienten bonito. 🤗`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se abrazó a sí mismo, porque a veces uno necesita su propio cariño. 🤗`
      } else {
        txt = `@${selfTag} no mencionó a nadie, así que yo te abrazo. Ven aquí, no digas que no te quiero. 🤗`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}