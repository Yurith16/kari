// plugins/feliz.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['feliz', 'happy', 'alegre', 'contento', 'dichoso'],
  tag:       'feliz',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
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
          `✨ @${selfTag} desborda felicidad al estar junto a @${victimTag}... Una alegría tan intensa que por fin logra derribar los muros del orgullo y alejar los celos. 🥳`,
          `💖 La complicidad volvió: @${selfTag} sonríe de verdad cuando habla con @${victimTag}. Un instante perfecto donde los dramas del chat parecen quedar en el olvido.`,
          `☀️ @${selfTag} encontró un motivo para celebrar al lado de @${victimTag}. Olvidando las dudas del pasado en un cálido abrazo digital.`,
          `🎈 @${selfTag} comparte un momento dichoso con @${victimTag}... Presumiendo una conexión única ante las miradas indiscretas de todo el grupo.`,
          `🎭 En medio de tantas discusiones, @${selfTag} recupera la paz y la alegría al ver que @${victimTag} por fin le presta atención.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🌈 @${selfTag} decidió ser feliz y sonreírle a la vida hoy... Intentando convencerse de que no necesita la atención de nadie para brillar.`,
          `😁 @${selfTag} anda con una sonrisa enorme en el chat. Una coraza de orgullo para ocultar que se cansó de esperar a quien prefiere ignorarle.`,
          `🎊 @${selfTag} celebra en solitario con la frente en alto. Un alma indomable que festeja su libertad, aunque su mirada busque discretamente a alguien.`,
          `☀️ @${selfTag} irradia luz propia y se declara dichoso... Un refugio perfecto para sanar un corazón que estuvo demasiado expuesto al drama.`,
          `🩹 @${selfTag} ríe a solas frente a la pantalla vacía. Demostrando que su amor propio es mucho más fuerte que el silencio de esa persona especial.`
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