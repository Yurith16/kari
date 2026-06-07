// plugins/sonrojar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['sonrojar', 'blush', 'penita', 'tímido', 'rojito'],
  tag:       'sonrojar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
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
          `😳 @${selfTag} se sonrojó por culpa de @${victimTag}... Un color carmín que delata unos celos silenciosos y un afecto que el orgullo ya no puede seguir ocultando. 💖`,
          `🔥 Las defensas cayeron: las palabras de @${victimTag} hicieron que @${selfTag} se pusiera completamente rojo. Un instante de drama pasional que expone su vieja complicidad ante el grupo.`,
          `✨ @${selfTag} sintió una timidez profunda bajo la mirada de @${victimTag}. Delatando con su sonrojo cuánto le quema la atención de esa persona especial.`,
          `🎭 Intentando fingir desinterés, @${selfTag} no pudo evitar sonrojarse ante @${victimTag}. Una dulce traición de su propio cuerpo que aviva las dudas del chat.`,
          `📜 Con el ego temblando, @${selfTag} se puso rojito al notar que @${victimTag} rompía la distancia. Una conexión indomable que se niega a morir.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🍅 @${selfTag} se puso rojo como un tomate a solas frente a la pantalla... Recordando un viejo mensaje nostálgico de un corazón distante que prefiere ignorarle.`,
          `😳 @${selfTag} anda con mucha penita en el chat hoy. Una coraza tímida para ocultar el drama pasional de sentirse completamente solo en el grupo.`,
          `🤫 @${selfTag} se sonrojó solito porque guarda un secreto. Un alma indomable que prefiere callar antes que admitir que extraña unos mimos del pasado.`,
          `🌸 @${selfTag} sintió un repentino calor de timidez en la soledad de su pantalla vacía, arrepentido de haber bajado la guardia por quien no sabe corresponderle.`,
          `🩹 El orgullo herido y las mejillas rojas: @${selfTag} sonríe con timidez cínica, disimulando una dolorosa falta de atención con un silencio absoluto.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}