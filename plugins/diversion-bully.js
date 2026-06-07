// plugins/bully.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bully', 'molestar', 'humillar', 'joder', 'chingar'],
  tag:       'bully',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de bully a alguien',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👊', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/bully`
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
          `👊 ¡F por @${victimTag}! @${selfTag} lo está agarrando de bajada... Un ataque directo para ocultar los celos y el drama que callan. 😈`,
          `🔥 @${selfTag} se desquitó con todo su orgullo frente a @${victimTag}... Una humillación fría en el chat que busca romper la tensión acumulada.`,
          `💥 Con el ego al límite, @${selfTag} empezó a joder a @${victimTag}. Palabras que buscan herir para tapar las dudas y secretos que los distancian.`,
          `🎭 @${selfTag} acorraló a @${victimTag} con sus burlas. Una máscara de malicia para no admitir que le duele su maldita indiferencia.`,
          `📜 @${selfTag} no tuvo piedad con @${victimTag} hoy. Destrozando su paciencia ante las miradas secretas de todo el grupo.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🤡 @${selfTag} se está molestando solito en el chat... Buscando desesperadamente llamar la atención de un corazón indomable y distante.`,
          `🙊 @${selfTag} se humilló solo sin contexto... Un drama silencioso de orgullo herido al notar que nadie leyó sus mensajes cariñosos.`,
          `📉 @${selfTag} entró en crisis y se hace bully a sí mismo. Sus defensas cayeron al darse cuenta de que no es correspondido hoy.`,
          `😈 @${selfTag} se jode solo para ocultar el vacío de la pantalla y no aceptar que la soledad le está ganando la partida.`,
          `🩹 @${selfTag} se atacó a sí mismo con cinismo. Escondiendo un alma lastimada detrás de bromas crueles que nadie más comprende.`
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