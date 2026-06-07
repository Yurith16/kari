// plugins/morder.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['morder', 'bite', 'mordisco', 'mordida', 'muerde'],
  tag:       'morder',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
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
          `🦷 *¡Ouch!* @${selfTag} le plantó un fuerte mordisco a @${victimTag}... Una marca posesiva nacida del orgullo herido y de unos celos imposibles de contener en el chat. 🫦`,
          `🔥 Un ataque directo: @${selfTag} mordió a @${victimTag} rompiendo la calma. Un impulso salvaje cargado de reclamos guardados y de una complicidad herida.`,
          `💔 @${selfTag} descargó su frustración con una mordida hacia @${victimTag}. El límite se cruzó de nuevo y el drama pasional estalló ante la mirada oculta de todos.`,
          `🎭 @${selfTag} dejó su huella en @${victimTag}. Una mezcla peligrosa de rabia y deseo, rebelándose contra la insoportable indiferencia de esa persona especial.`,
          `📜 Sin pedir permiso, @${selfTag} atacó a @${victimTag}. Un recordatorio doloroso de que las tensiones entre los dos están muy lejos de enfriarse.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🦷 @${selfTag} se mordió los labios en solitario... Intentando ahogar los impulsos de reclamar la atención de un corazón indomable que prefiere ignorarle.`,
          `🤕 @${selfTag} se dio un mordisco a sí mismo de pura frustración. Un frío cable a tierra al notar el silencio eterno de su pantalla vacía.`,
          `😬 @${selfTag} probó su propio orgullo y le supo amargo. Una coraza cínica para ocultar cuánto le duele sentirse distante en el chat.`,
          `🫦 @${selfTag} anda con ganas de morder pero se quedó a solas con su drama, dándose cuenta de que la nostalgia es su única compañía esta noche.`,
          `🩹 @${selfTag} apretó los dientes ante la indiferencia ajena. Un alma rebelde arrepentida de haber bajado la guardia por quien no sabe corresponderle.`
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