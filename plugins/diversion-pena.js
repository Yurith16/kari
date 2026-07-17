// plugins/sonrojar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['sonrojar', 'blush', 'penita', 'tímido', 'rojito'],
  tag:       'sonrojar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
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
          `@${selfTag} se sonrojó por @${victimTag}, qué bonito cuando pasa eso. 😳`,
          `@${selfTag} se puso rojito con @${victimTag}, el corazón no miente. 🌸`,
          `@${selfTag} sintió timidez ante @${victimTag}, y se le nota lo lindo. 💖`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se sonrojó solito, algo habrá recordado. 😳`,
          `@${selfTag} anda con penita y no dijo por qué, pero se le nota. 🌸`,
          `@${selfTag} se puso rojo sin razón aparente, a todos nos ha pasado. 💖`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, pero algo lo hizo sonrojar y yo quiero saber qué fue. 😳`,
          `@${selfTag} se puso rojito y no dijo por quién, pero aquí andamos de chismosas. 🌸`,
          `@${selfTag} anda con las mejillas rojas, alguien le gusta y no lo quiere decir. 💖`
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
        txt = `@${selfTag} se sonrojó por @${victima}, qué bonito cuando pasa eso. 😳`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se sonrojó solito, algo habrá recordado. 😳`
      } else {
        txt = `@${selfTag} no mencionó a nadie, pero algo lo hizo sonrojar y yo quiero saber qué fue. 😳`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}