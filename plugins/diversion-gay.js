// plugins/gay.js
import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['gay', 'gey', 'homosexual', 'marica', 'loca'],
  tag:       'gay',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif gay',

  async execute(sock, msg, { from }) {
    await sock.sendMessage(from, { react: { text: '🏳️‍🌈', key: msg.key } })

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
          `🏳️‍🌈 Con una mirada que delata celos silenciosos, @${selfTag} señaló a @${victimTag} y le soltó un crudo: ¡eres bien gay! Un juego peligroso que esconde deseos reprimidos. 💅`,
          `🔥 La tensión entre @${selfTag} y @${victimTag} estalló en el chat. Una provocación directa nacida del orgullo herido y de secretos que ambos callan ante el grupo.`,
          `✨ @${selfTag} expuso las verdaderas inclinaciones de @${victimTag}... Un reclamo apasionado que busca romper el hielo y revivir una vieja complicidad.`,
          `🎭 @${selfTag} catalogó a @${victimTag} con picardía, ocultando detrás de una broma el drama y las dudas que le carcomen el pecho por su fría distancia.`,
          `📜 Rompiendo la tregua, @${selfTag} dejó en evidencia a @${victimTag}. Palabras cruzadas que despiertan murmullos y agitan pasiones prohibidas.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🏳️‍🌈 @${selfTag} mandó al diablo el orgullo y liberó su esencia más auténtica... Un grito desesperado buscando la atención de un corazón indomable.`,
          `💅 @${selfTag} asumió su faceta más libre y desatada hoy. Una coraza perfecta para tapar la nostalgia de un mensaje que nunca llegó a su pantalla.`,
          `👑 @${selfTag} se declaró la reina indiscutible del drama en solitario, demostrando que su amor propio brilla con luz propia, sin importar los silencios ajenos.`,
          `🌈 @${selfTag} prefiere presumir sus gustos extravagantes antes que admitir que se muere por los mimos de esa persona que prefiere ignorarle.`,
          `🩹 @${selfTag} levantó sus defensas con cinismo. Un alma libre y rebelde que camina sola frente al vacío del chat.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      const gifPath = join(process.cwd(), 'media', 'gay.mp4')
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