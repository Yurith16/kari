// plugins/tierno.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['tierno', 'cute', 'eevee', 'adorable', 'lindo'],
  tag:       'tierno',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif tierno',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🐾', key: msg.key } })

    try {
      const videoUrl = `http://cdn.delirius.store/v2/reaction/sfw/eevee/PpHuCB0.mp4`

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
          `@${selfTag} se puso tierno con @${victimTag}, qué bonito cuando se le sale lo suave. 🐾`,
          `@${selfTag} le sacó el lado adorable a @${victimTag}, así sin esfuerzo. 🌸`,
          `@${selfTag} anda en modo lindo con @${victimTag}, y se le nota lo natural. 💖`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se puso tierno consigo mismo, a veces hace falta ser dulce con uno. 🐾`,
          `@${selfTag} anda en modo adorable en solitario, el amor propio es primero. 🌸`,
          `@${selfTag} se tiró flores a sí mismo, porque esperar a que otro lo haga cansa. 💖`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, pero yo detecto ternura en el aire. Algo me dice que hay un corazón blandito por ahí. 🐾`,
          `@${selfTag} se puso adorable y no dijo por quién, pero aquí andamos de chismosas queriendo saber. 🌸`,
          `@${selfTag} anda repartiendo dulzura al vacío, alguien le gusta y no lo quiere soltar. 💖`
        ]
        
        txt = frasesMidori[Math.floor(Math.random() * frasesMidori.length)]
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
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
        txt = `@${selfTag} se puso tierno con @${victima}, qué bonito cuando se le sale lo suave. 🐾`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se puso tierno consigo mismo, a veces hace falta ser dulce con uno. 🐾`
      } else {
        txt = `@${selfTag} no mencionó a nadie, pero yo detecto ternura en el aire. Algo me dice que hay un corazón blandito por ahí. 🐾`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}