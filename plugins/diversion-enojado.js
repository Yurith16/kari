// plugins/enojado.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['enojado', 'angry', 'mad', 'furioso', 'rabioso'],
  tag:       'enojado',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de enojo',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😡', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/angry`
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
          `@${selfTag} está enojado con @${victimTag}, algo habrá hecho para que se ponga así. 😡`,
          `@${selfTag} perdió la paciencia con @${victimTag}, la tensión se siente en el chat. 💢`,
          `@${selfTag} arde de rabia contra @${victimTag}, mejor que nadie se meta. 🔥`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} está enojado consigo mismo, a veces uno es su peor enemigo. 😡`,
          `@${selfTag} se levantó furioso y ni él sabe por qué. 💢`,
          `@${selfTag} anda de mal humor, mejor no molestar por ahora. 🔥`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, pero yo ya me enojé por él. Alguien tiene que hacerlo. 😡`,
          `@${selfTag} se quedó sin culpable, aunque la furia se siente igual. 💢`,
          `@${selfTag} está enojado y no dijo con quién, así que me enojo yo también por solidaridad. 🔥`
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
        txt = `@${selfTag} está enojado con @${victima}, algo habrá hecho para que se ponga así. 😡`
      } else if (victima === selfTag) {
        txt = `@${selfTag} está enojado consigo mismo, a veces uno es su peor enemigo. 😡`
      } else {
        txt = `@${selfTag} no mencionó a nadie, pero yo ya me enojé por él. Alguien tiene que hacerlo. 😡`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}