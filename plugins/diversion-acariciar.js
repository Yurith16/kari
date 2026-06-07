// plugins/acariciar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['acariciar', 'pat', 'mimar', 'caricia'],
  tag:       'acariciar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de caricias a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🖐️', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/pat`
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
          `🖐️ @${selfTag} acarició suavemente la cabecita de @${victimTag}... Un gesto tan dulce que oculta el miedo latente de perder su atención algún día. ✨`,
          `🌸 @${selfTag} mimó con ternura a @${victimTag}. Intentando calmar un corazón inquieto, recordándole que no todo tiene que terminar en reclamos y distancia.`,
          `✨ Una dulce caricia de @${selfTag} para @${victimTag}... Un pacto silencioso en el chat que desafía el orgullo que tantas veces los aleja.`,
          `💞 @${selfTag} le dio unos mimos a @${victimTag}... Buscando revivir esa complicidad que a veces parece desvanecerse entre el silencio y las dudas.`,
          `🍿 @${selfTag} acarició con delicadeza a @${victimTag}. Un detalle tan íntimo y privado que despierta miradas secretas y un toque de celos en el grupo.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🥺 @${selfTag} se acaricia la cabeza solito... Buscando un consuelo que esa persona especial simplemente no le quiere dar hoy.`,
          `✨ @${selfTag} se da ánimos a sí mismo en silencio. Secando las lágrimas de un desamor y recordándose que vale demasiado.`,
          `💔 @${selfTag} busca desesperadamente un mimo... Pero la persona que le importa prefiere ignorar su tierno llamado.`,
          `🍃 @${selfTag} se dio un cariñito propio para sanar el alma. A veces toca ser fuerte cuando el orgullo ajeno congela el chat.`,
          `📜 @${selfTag} se quedó esperando una caricia sincera... Al final, el vacío de la pantalla fue su única compañía esta noche.`
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