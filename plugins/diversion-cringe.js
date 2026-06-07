// plugins/cringe.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cringe', 'pena', 'asco'],
  tag:       'cringe',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de cringe',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😬', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cringe`
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
          `😬 @${selfTag} sintió un cringe profundo por la actitud de @${victimTag}... Un intento desesperado de llamar la atención que solo dejó expuesto su orgullo herido. 💀`,
          `🤢 @${selfTag} vio la escena de @${victimTag} y prefirió desviar la mirada. Hay textos en el chat que dan pena ajena y delatan unos celos imposibles de ocultar.`,
          `✨ @${selfTag} vio cómo @${victimTag} rogaba afecto y sintió un escalofrío. El drama pasional se volvió ridículo ante las miradas secretas del grupo.`,
          `🎭 Qué amargo momento... @${selfTag} presenció el espectáculo de @${victimTag} y se le congeló la sonrisa. Hay silencios que salvan, pero esto dio puro cringe.`,
          `📜 El ego por los suelos: @${selfTag} no pudo ocultar su incomodidad ante las palabras de @${victimTag}. Una desconexión total que enterró los recuerdos de su vieja complicidad.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `😬 @${selfTag} recordó sus propios mensajes del pasado y sufrió de cringe nivel experto... El precio de haber bajado la guardia por alguien indiferente.`,
          `🤢 @${selfTag} no puede con tanta pena ajena consigo mismo. Su orgullo le exige borrar el chat para no aceptar que se humilló buscando atención.`,
          `💀 @${selfTag} entró en crisis total y se ahoga en su propio drama. Un alma indomable arrepentida de haber mostrado un segundo de vulnerabilidad.`,
          `🙈 @${selfTag} se tapó los ojos ante la pantalla vacía. Le da cringe recordar cuánto esperó un mensaje de esa persona que habita en sus pensamientos.`,
          `🩹 @${selfTag} se arrepintió de sus indirectas románticas. El silencio del chat transformó su gran declaración en un incómodo momento de soledad.`
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