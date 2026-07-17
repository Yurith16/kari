// plugins/cachetada.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cachetada', 'slap', 'bofetada', 'manotazo'],
  tag:       'cachetada',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de cachetada a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👋', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/slap`
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
          `@${selfTag} le dio una cachetada a @${victimTag}, no fue tan fuerte, creo. 👋`,
          `@${selfTag} le plantó una bofetada a @${victimTag}, algo habrá hecho para merecerlo. 💢`,
          `@${selfTag} soltó un manotazo a @${victimTag}, se ve que se lo tenía guardado. ✋`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se dio una cachetada a sí mismo, a veces hace falta reaccionar. 👋`,
          `@${selfTag} se pegó solito, debe estar procesando algo. 💢`,
          `@${selfTag} se dio un manotazo en la frente, todos hemos estado ahí. ✋`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, así que yo te doy la cachetada. No preguntes por qué, algo habrás hecho. 👋`,
          `@${selfTag} se quedó sin víctima, pero aquí estoy yo para darte tu merecido. 💢`,
          `@${selfTag} nadie se ganó la bofetada, así que te la llevas tú por no mencionar a nadie. ✋`
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
        txt = `@${selfTag} le dio una cachetada a @${victima}, no fue tan fuerte, creo. 👋`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se dio una cachetada a sí mismo, a veces hace falta reaccionar. 👋`
      } else {
        txt = `@${selfTag} no mencionó a nadie, así que yo te doy la cachetada. No preguntes por qué, algo habrás hecho. 👋`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}