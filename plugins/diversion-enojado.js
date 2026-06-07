// plugins/enojado.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['enojado', 'angry', 'mad', 'furioso', 'rabioso'],
  tag:       'enojado',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de enojo',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😡', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/angry`
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
          `😡 @${selfTag} perdió la paciencia por completo con @${victimTag}... Un estallido de furia nacido de verdades reprimidas y de celos que ya no se pueden ocultar. 💢`,
          `🔥 La tensión estalló: @${selfTag} arde de rabia ante las actitudes de @${victimTag}. El orgullo dolió tanto que las palabras dulces se transformaron en reclamos.`,
          `💥 @${selfTag} se cansó del silencio y arremetió furioso contra @${victimTag}... Destrozando la poca paciencia que quedaba entre los dos esta noche.`,
          `🎭 @${selfTag} no pudo contener su ira frente a @${victimTag}. Un drama pasional que dejó en evidencia cuánto le afecta lo que pasa con esa persona especial.`,
          `📜 Con el ego herido y el corazón inquieto, @${selfTag} le declaró la guerra en el chat a @${victimTag}. Una desconexión total que quema el suelo.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `💢 @${selfTag} está que explota de rabia en solitario... Intentando ahogar la frustración de esperar a quien simplemente prefiere ignorarle.`,
          `🤬 @${selfTag} entró en modo furia frente a la pantalla vacía. Una coraza de enojo para no admitir que le duele demasiado esa maldita distancia.`,
          `😤 @${selfTag} se enojó con el mundo entero hoy. Un alma indomable que prefiere quemar el chat antes de mostrar un segundo de debilidad.`,
          `💥 @${selfTag} reventó de la ira al recordar que bajó la guardia por alguien frío. Su orgullo le exige bloquear los pensamientos nostálgicos.`,
          `🩹 @${selfTag} camina furioso y a solas. Escondiendo un corazón lastimado detrás de una actitud destructiva que nadie en el grupo comprende.`
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