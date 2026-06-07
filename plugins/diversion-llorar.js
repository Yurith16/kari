// plugins/llorar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['llorar', 'cry', 'triste', 'sad', 'lagrimas'],
  tag:       'llorar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de llanto',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '😭', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/cry`
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
          `😭 Las lágrimas vencieron al orgullo: @${selfTag} se quebró por culpa del desdén de @${victimTag}... Un llanto amargo nacido de celos silenciosos que ya no puede ocultar. 💔`,
          `🔥 @${selfTag} no pudo contener la tristeza ante la fría actitud de @${victimTag}. Un drama pasional que estalla en reproches silenciosos y miradas vacías en el chat.`,
          `💥 Con el ego destrozado, @${selfTag} llora amargamente por @${victimTag}. Las palabras hirientes cruzaron el límite, quebrando una vieja complicidad.`,
          `🎭 Detrás de la máscara de indiferencia, @${selfTag} se desahoga en llanto frente a @${victimTag}... Un ruego desesperado por un poco de atención ante el grupo.`,
          `📜 El silencio de @${victimTag} fue un golpe devastador. @${selfTag} derrama lágrimas esta noche al notar que la distancia se volvió insalvable.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `😭 @${selfTag} se hundió en un llanto silencioso frente a la pantalla vacía... Intentando asimilar el dolor de amar a un corazón indomable y distante.`,
          `💔 El orgullo cayó por completo: @${selfTag} llora a solas en el chat. Una crisis pasional nacida de la dolorosa certeza de no ser correspondido hoy.`,
          `🥺 @${selfTag} entró en modo tristeza profunda y se ahoga en sus propias indirectas. Un alma lastimada que extraña unos mimos que ya no llegarán.`,
          `💧 @${selfTag} empezó a llorar con cinismo para no aceptar el vacío. El drama de la soledad le ganó la partida ante el silencio absoluto de esa persona especial.`,
          `🩹 @${selfTag} abraza sus propios recuerdos con nostalgia. Escondiendo un corazón herido detrás de un llanto amargo que nadie en el grupo logra comprender.`
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