// plugins/cachetada.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['cachetada', 'slap', 'bofetada', 'manotazo'],
  tag:       'cachetada',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de cachetada a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '✋', key: msg.key } })

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
          `💥 ¡Reacciona! @${selfTag} le cruzó la cara de una cachetada a @${victimTag}... Un golpe seco nacido del orgullo herido y los celos que ya no pudo contener. ✋`,
          `🔥 El impacto de @${selfTag} dejó mudo a @${victimTag}. Una bofetada cargada de verdades amargas y de reclamos guardados en lo más profundo del pecho.`,
          `💔 @${selfTag} descargó toda su frustración en un manotazo hacia @${victimTag}... Destrozando la tregua en el chat y exponiendo lo mucho que aún le duele su distancia.`,
          `🎭 @${selfTag} le dio una cachetada a @${victimTag} ante las miradas secretas de todos. Un drama pasional que estalló de la peor forma posible.`,
          `📜 Una bofetada rotunda de @${selfTag} para @${victimTag}. El límite se cruzó, el orgullo ganó y la complicidad se quebró por completo esta noche.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🤦 @${selfTag} se dio una fuerte cachetada solito... Intentando reaccionar y borrar de su mente el recuerdo de un amor que prefiere ignorarlo.`,
          `🤡 @${selfTag} se pegó a sí mismo en la cara por culpa del drama. Una coraza cínica para ocultar que se siente completamente solo en el chat.`,
          `😤 @${selfTag} se dio un manotazo en la frente. No puede creer hasta dónde ha caído su orgullo buscando la atención de un corazón indomable.`,
          `💥 @${selfTag} se cacheteó para despertar del letargo. Su mente le exige olvidar a quien habita en sus pensamientos y no sabe corresponderle.`,
          `🩹 @${selfTag} se dio un golpe propio, un frío cable a tierra al notar que la pantalla vacía y el silencio ajeno son su única realidad.`
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