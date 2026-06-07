// plugins/besar.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['besar', 'kiss', 'besito', 'beso'],
  tag:       'besar',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de besos',

  async execute(sock, msg, { from }) {
    console.log('[BESAR] Iniciando comando')
    await sock.sendMessage(from, { react: { text: '💋', key: msg.key } })

    try {
      const apiUrl = `https://api.delirius.store/reactions/kiss`
      console.log('[BESAR] Solicitando a la API:', apiUrl)
      
      const { data: res } = await axios.get(apiUrl, { timeout: 15000 })
      console.log('[BESAR] Respuesta API:', JSON.stringify(res, null, 2))

      if (!res.status || !res.data) {
        console.log('[BESAR] API no devolvió status o data válida')
        throw new Error()
      }

      console.log('[BESAR] URL del video:', res.data.url)

      const selfJid = await getRealJid(sock, msg.key.participant || msg.key.remoteJid, msg)
      const selfTag = selfJid.split('@')[0]
      console.log('[BESAR] Usuario:', selfTag)
      
      const mentions = [selfJid]
      let victima = null

      const contextInfo = msg.message?.extendedTextMessage?.contextInfo
      const quotedParticipant = contextInfo?.participant
      const mentionedJids = contextInfo?.mentionedJid || []
      
      const fullText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
      const textMentions = fullText.match(/@(\d+)/g) || []
      
      console.log('[BESAR] quotedParticipant:', quotedParticipant)
      console.log('[BESAR] mentionedJids:', mentionedJids)
      console.log('[BESAR] textMentions:', textMentions)
      
      if (quotedParticipant) {
        victima = await getRealJid(sock, quotedParticipant, msg)
        console.log('[BESAR] Víctima por respuesta:', victima)
      } 
      else if (mentionedJids.length > 0) {
        victima = await getRealJid(sock, mentionedJids[0], msg)
        console.log('[BESAR] Víctima por mención:', victima)
      } 
      else if (textMentions.length > 0) {
        const num = textMentions[0].replace('@', '')
        victima = `${num}@s.whatsapp.net`
        console.log('[BESAR] Víctima por texto:', victima)
      }

      let txt = ''
      
      if (victima && victima !== selfJid) {
        mentions.push(victima)
        const victimTag = victima.split('@')[0]
        
        const frasesPareja = [
          `💋 En un impulso que desafía todo orgullo, @${selfTag} atrapó los labios de @${victimTag} en un beso apasionado... uniendo los silencios que tanto los distancian. ❤️`,
          `🔥 @${selfTag} le plantó un beso intenso a @${victimTag}. De esos que queman el pecho, despiertan celos en el grupo y dejan en duda si fue por juego o por amor prohibido.`,
          `🌹 Un tierno beso de @${selfTag} para @${victimTag}... rompiendo el hielo, calmando las dudas y deteniendo el tiempo en una complicidad secreta. ✨`,
          `💞 @${selfTag} besó dulcemente a @${victimTag}... intentando reconstruir con caricias una conexión que el chat y la distancia querían enfriar.`,
          `🍿 @${selfTag} selló los labios de @${victimTag} con un beso robado. Un reclamo silencioso de atención que dice muchísimo más de lo que jamás se atreverán a confesar.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `💋 @${selfTag} está lanzando besos al aire con desesperación... buscando en vano calmar el vacío que dejó un corazón indomable y distante.`,
          `✨ @${selfTag} mandó un beso volador cargado de romance, pero la persona en quien pensaba prefirió ignorar la pantalla esta noche.`,
          `💔 @${selfTag} se quedó con los labios listos. Un beso nostálgico que muere en el chat debido al orgullo ajeno.`,
          `💖 @${selfTag} se puso romántico en solitario... presumiendo su amor propio para no admitir que extraña los mimos que ya no le dan.`,
          `🌹 @${selfTag} dejó un beso flotando en el grupo. Una indirecta muy directa que esconde un drama silencioso que pocos logran notar.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      console.log('[BESAR] Mensaje final:', txt)
      console.log('[BESAR] Menciones:', mentions)
      console.log('[BESAR] Enviando video...')

      await sock.sendMessage(from, {
        video: { url: res.data.url },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })
      
      console.log('[BESAR] Comando completado exitosamente')

    } catch (error) {
      console.error('[BESAR] Error:', error.message)
      if (error.response) {
        console.error('[BESAR] Status:', error.response.status)
        console.error('[BESAR] Data:', error.response.data)
      }
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}