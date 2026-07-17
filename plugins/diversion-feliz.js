// plugins/feliz.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['feliz', 'happy', 'alegre', 'contento', 'dichoso'],
  tag:       'feliz',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de felicidad',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😁', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/happy`
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
          `@${selfTag} está feliz junto a @${victimTag}, qué bonito verlos así. 😁`,
          `@${selfTag} y @${victimTag} comparten una sonrisa, de esas que alegran el día. 🥳`,
          `@${selfTag} encontró la felicidad al lado de @${victimTag}, así da gusto. ☀️`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} está feliz consigo mismo, y eso vale por mil. 😁`,
          `@${selfTag} sonríe sin razón aparente, qué bonito estar así. 🥳`,
          `@${selfTag} anda contento y se le nota, que dure todo el día. ☀️`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, pero yo me alegro por él. Que la felicidad se comparta. 😁`,
          `@${selfTag} está feliz y yo me contagio, así que todos contentos. 🥳`,
          `@${selfTag} anda con una sonrisa y no dijo por qué, pero me alegra verlo así. ☀️`
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
        txt = `@${selfTag} está feliz junto a @${victima}, qué bonito verlos así. 😁`
      } else if (victima === selfTag) {
        txt = `@${selfTag} está feliz consigo mismo, y eso vale por mil. 😁`
      } else {
        txt = `@${selfTag} no mencionó a nadie, pero yo me alegro por él. Que la felicidad se comparta. 😁`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}