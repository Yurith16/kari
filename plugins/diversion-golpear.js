// plugins/golpear.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['golpear', 'golpe', 'patada', 'pegar', 'madraso'],
  tag:       'golpear',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de golpe a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👊', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kick`
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
          `💥 *¡Fight!* @${selfTag} descargó toda su frustración metiéndole un fuerte golpe a @${victimTag}... Un estallido violento nacido de los celos y del orgullo herido que ya no pudo reprimir.`,
          `🔥 Un impacto seco que dolió en el alma: @${selfTag} arremetió contra @${victimTag} en el chat. Un reclamo pasional envuelto en furia para romper una distancia insoportable.`,
          `💔 @${selfTag} le plantó un golpe certero a @${victimTag}. Destrozando las apariencias y exponiendo las verdades amargas que ambos intentaban ocultar ante el grupo.`,
          `🎭 @${selfTag} atacó a @${victimTag} sin piedad. Una muestra de rabia desatada para no admitir cuánto le quema la maldita indiferencia de esa persona especial.`,
          `📜 Se quebró la tregua: @${selfTag} arrolló con un golpe a @${victimTag}. El límite se cruzó y el drama se apoderó por completo de la pantalla esta noche.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🤡 @${selfTag} se dio un golpe solito contra la realidad... Intentando borrar de su mente el recuerdo constante de un amor indomable que prefiere ignorarle.`,
          `💨 @${selfTag} anda tirando golpes cínicos al aire. Una coraza hostil para ocultar que se siente completamente solo y abandonado en el chat.`,
          `🤕 @${selfTag} se metió un golpe propio para ver si despertaba del letargo, dándose cuenta de que su orgullo cayó buscando una atención que no va a recibir.`,
          `🥊 @${selfTag} quería pelear con todas sus fuerzas pero no encontró contrincante, quedando atrapado en un drama pasional en solitario frente a la pantalla vacía.`,
          `🩹 @${selfTag} se castigó a sí mismo con un frío golpe de realidad. Un alma lastimada que disfraza su nostalgia con una actitud destructiva.`
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