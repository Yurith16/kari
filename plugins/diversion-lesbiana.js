// plugins/lesbiana.js
import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['lesbiana', 'lesbi', 'les', 'tortillera', 'sapatona'],
  tag:       'lesbiana',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif lesbico',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '👩‍❤️‍💋‍👩', key: msg.key } })

    try {
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
          `👩‍❤️‍💋‍👩 Con el orgullo temblando y los celos a flor de piel, @${selfTag} encaró a @${victimTag} delatando sus verdaderas pasiones. Un secreto compartido que quema en el chat. 💅`,
          `🔥 La complicidad estalló: @${selfTag} expuso los deseos ocultos de @${victimTag}... Un reclamo pasional que busca romper el hielo y desafiar la distancia que las separa.`,
          `✨ @${selfTag} dejó en evidencia las miradas prohibidas de @${victimTag}. Una provocación directa nacida del ego herido ante los ojos curiosos de todo el grupo.`,
          `🎭 Ocultando el drama detrás de una frase audaz, @${selfTag} sacudió la tranquilidad de @${victimTag}. Palabras cruzadas que delatan una intensa y confusa conexión.`,
          `📜 Se rompió la tregua en la pantalla: @${selfTag} expuso las indirectas de @${victimTag}, cobrando una vieja deuda de atención con una pizca de malicia.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `👩‍❤️‍💋‍👩 @${selfTag} mandó al diablo las apariencias y aceptó su esencia más libre... Un grito silencioso buscando capturar la atención de un corazón indomable.`,
          `💅 @${selfTag} asumió su faceta más indomable y orgullosa hoy. Una coraza perfecta para camuflar la nostalgia de un chat vacío y frío.`,
          `👑 @${selfTag} se declaró fan de su propia libertad en solitario, demostrando que su amor propio brilla con luz propia frente al desdén ajeno.`,
          `🍎 @${selfTag} prefiere presumir sus gustos sin filtros antes que admitir que extraña los mimos de esa persona que prefiere ignorarle en la pantalla.`,
          `🩹 @${selfTag} levantó sus defensas con cinismo puro. Un alma rebelde que camina sola, ocultando un drama pasional que nadie más comprende.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      const gifPath = join(process.cwd(), 'media', 'lesbiana.mp4')
      const gifBuffer = readFileSync(gifPath)

      await sock.sendMessage(from, {
        video: gifBuffer,
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}