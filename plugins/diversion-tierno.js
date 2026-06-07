// plugins/tierno.js
import axios from 'axios'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['tierno', 'cute', 'eevee', 'adorable', 'lindo'],
  tag:       'tierno',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif tierno',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🐾', key: msg.key } })

    try {
      const videoUrl = `http://cdn.delirius.store/v2/reaction/sfw/eevee/PpHuCB0.mp4`

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
          `🐾 Mirando de reojo por puros celos, @${selfTag} decidió bajarse el orgullo y ponerse tierno solo con @${victimTag}... Aprovecha que esto no pasa seguido. 💖`,
          `🔥 Para que veas que no todo es pelea, @${selfTag} te tira un gesto lindo @${victimTag}. A ver si dejas la cobardía y respondes el chat.`,
          `💥 @${selfTag} se tragó su orgullo herido y te trata con dulzura @${victimTag}... Aunque te encante jugar al tipo duro e indiferente ante el grupo.`,
          `🎭 Dejando el drama de lado por cinco minutos, @${selfTag} intenta ablandar el corazón de piedra de @${victimTag}. Rompe esa distancia ya.`,
          `📜 Menos indirectas y más verdades: @${selfTag} se pone lindo con @${victimTag} para cobrar una vieja deuda de atención en este chat.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🐾 @${selfTag} anda en modo tierno con la pantalla vacía... Qué payaso/a te ves esperando mimos de quien prefiere ignorarte.`,
          `🌸 El colmo del cinismo: @${selfTag} se pone adorable en solitario. Una táctica inútil para llamar la atención de un corazón indomable.`,
          `🍬 Con el ego tocado pero la frente en alto, @${selfTag} se tira flores a sí mismo en el chat. Cansado/a de rogarle atención a los demás.`,
          `🧸 @${selfTag} activó su modo lindo solo para curarse la nostalgia. Al menos su amor propio es más fuerte que tu maldito silencio.`,
          `🩹 @${selfTag} reparte dulzura al aire en el grupo. Una coraza perfecta para ocultar que se muere de celos por alguien que no escribe.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: txt,
        gifPlayback: true,
        mentions: mentions
      }, { quoted: msg })

    } catch {
      await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } })
    }
  }
}