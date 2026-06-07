// plugins/bailar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bailar', 'dance', 'baile', 'danzar'],
  tag:       'bailar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de baile',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '💃', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/dance`
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
          `💃 ¡Qué ritmo! @${selfTag} sacó a bailar a @${victimTag}... Sus pasos se coordinan tan bien que por un momento logran olvidar la tensión y los celos que ocultan. ✨`,
          `🔥 @${selfTag} y @${victimTag} dominan la pista de baile. Una conexión tan intensa que despierta miradas secretas y murmullos en todo el grupo.`,
          `✨ @${selfTag} comparte un baile suave con @${victimTag}... Dejándose llevar por la música para romper el hielo y ese orgullo que a veces los mantiene distantes.`,
          `💞 @${selfTag} gira en la pista sosteniendo a @${victimTag}. Un vaivén perfecto que intenta revivir viejos sentimientos que se resisten a apagarse.`,
          `🎵 En medio de las luces, @${selfTag} guía a @${victimTag} en un baile cerrado. Una tregua romántica perfecta donde las palabras ya no hacen falta.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🕺 ¡Suelten la música! @${selfTag} se puso a bailar con toda la actitud... Intentando ahogar las penas de un amor que no sabe corresponderle.`,
          `💃 @${selfTag} sacó los pasos prohibidos en solitario. Demostrando que tiene el control y que no necesita la atención de nadie más para brillar.`,
          `✨ @${selfTag} está celebrando en medio de la pista solo. Su orgullo brilla tanto como sus movimientos, aunque su mirada busque discretamente a alguien.`,
          `💔 @${selfTag} baila con su propia sombra. La música suena fuerte, pero el vacío que dejó esa persona especial en el chat se nota en cada paso.`,
          `🎵 @${selfTag} se deja llevar por el ritmo a solas. Un refugio perfecto para despejar la mente y sanar un corazón indomable.`
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