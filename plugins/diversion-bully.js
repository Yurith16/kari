// plugins/bully.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bully', 'molestar', 'humillar', 'joder', 'chingar'],
  tag:       'bully',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  descripcion: 'Envía un gif de bully a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👊', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/bully`
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
          `@${selfTag} está molestando a @${victimTag}, algo habrá hecho para merecerlo. 👊`,
          `@${selfTag} se fue con todo contra @${victimTag}, no tuvo piedad. 💢`,
          `@${selfTag} agarró de bajada a @${victimTag}, así sin avisar. 😈`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else if (victima === selfJid) {
        mentions.push(selfJid)
        
        const frasesSolo = [
          `@${selfTag} se está molestando solito, qué raro se está poniendo esto. 👊`,
          `@${selfTag} se hace bully a sí mismo, no sé si reír o preocuparme. 💢`,
          `@${selfTag} entró en modo autodestrucción, alguien que lo detenga. 😈`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }
      else {
        const frasesMidori = [
          `@${selfTag} no mencionó a nadie, pero yo no me meto en peleas ajenas. Busca a alguien más para eso. 👊`,
          `@${selfTag} se quedó sin víctima, y la verdad yo no estoy para que me estén molestando. 💢`,
          `@${selfTag} quería joder a alguien pero no dijo a quién, así que se quedó con las ganas. 😈`
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
        txt = `@${selfTag} está molestando a @${victima}, algo habrá hecho para merecerlo. 👊`
      } else if (victima === selfTag) {
        txt = `@${selfTag} se está molestando solito, qué raro se está poniendo esto. 👊`
      } else {
        txt = `@${selfTag} no mencionó a nadie, pero yo no me meto en peleas ajenas. Busca a alguien más para eso. 👊`
      }

      await sock.sendMessage(from, {
        text: txt,
        mentions: [selfJid].filter(Boolean)
      }, { quoted: msg })
    }
  }
}