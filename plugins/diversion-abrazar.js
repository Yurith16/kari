// plugins/abrazar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['abrazar', 'abrazos', 'abrazo'],
  tag:       'abrazar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de abrazo a alguien',

  async execute(sock, msg, { from, args }) {
    await sock.sendMessage(from, { react: { text: '🫂', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cuddle`
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
          `🫂 @${selfTag} envolvió entre sus brazos a @${victimTag}... Un refugio perfecto donde el orgullo se desarma y las palabras románticas ya no hacen falta. ✨`,
          `🔥 @${selfTag} le dio un abrazo eterno a @${victimTag}... De esos que se sienten en el pecho y dejan la duda de si es un tierno afecto o el inicio de algo prohibido.`,
          `🫂 ¡Qué momento! @${selfTag} se acurrucó con @${victimTag}. Un abrazo tan cálido que logró congelar el tiempo, acallando por un instante todos los celos y los miedos del pasado.`,
          `💞 @${selfTag} abrazó con fuerza a @${victimTag}... Como queriendo unir los pedazos rotos de una historia que se resiste a morir en el olvido.`,
          `✨ @${selfTag} buscó el calor de @${victimTag} en un abrazo... De esos que extrañas en las noches frías y que te recuerdan a quién le pertenece realmente tu atención.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        // Entra aquí si se abraza a sí mismo o si no mencionó a nadie
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `💔 @${selfTag} se abrazó a sí mismo... Hay ausencias que pesan demasiado y verdades en el alma que ni el mejor de los orgullos puede ocultar.`,
          `🧸 @${selfTag} anda buscando un abracito desesperadamente... ¿Alguien se ofrece a calmar ese corazón indomable que se esconde detrás de la pantalla?`,
          `🫂 @${selfTag} se quedó con los brazos abiertos en el chat. A veces, el silencio de esa persona especial duele más que un rechazo directo.`,
          `🥺 @${selfTag} entró en modo cariñoso, pero la persona que habita en sus pensamientos parece no darse cuenta. Le tocó abrazar su almohada hoy.`,
          `🩹 @${selfTag} se dio un auto-abrazo para sanar un poquito. A veces hay que ser el propio refugio cuando los demás solo saben jugar con tus emociones.`
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