// plugins/pendejo.js
import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['pendeja', 'pendejo', 'pndjo', 'idiota', 'tonto'],
  tag:       'pendejo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de pendejo/a',

  async execute(sock, msg, { from }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1).toLowerCase() || 'pendejo'
    const esFemenino = usedCommand === 'pendeja'

    await sock.sendMessage(from, { react: { text: '🤪', key: msg.key } })

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
      const insulto = esFemenino ? 'pendeja' : 'pendejo'
      
      if (victima && victima !== selfJid) {
        mentions.push(victima)
        const victimTag = victima.split('@')[0]
        
        const frasesPareja = [
          `🤪 @${selfTag} se cansó de callar y te lo dice en la cara: @${victimTag} eres tremendo/a ${insulto}. ¡Ya bájale a tu ego de cuarta! 💥`,
          `🔥 ¿Te crees muy listo/a? @${selfTag} deja en evidencia lo ${insulto} que eres @${victimTag}. El orgullo te quedó grande para la poca atención que das.`,
          `💔 A @${selfTag} le dolió aceptar que bajó la guardia por alguien tan ${insulto} como @${victimTag}... Sigue jugando al indiferente en el chat.`,
          `🎭 Qué buen drama te armas, pero @${selfTag} ya te pilló el juego. @${victimTag} actúas como un/a completo/a ${insulto} solo por puro capricho.`,
          `📜 Se acabó la tregua: @${selfTag} expuso públicamente lo ${insulto} que eres @${victimTag}. Se te nota de lejos que te mueres de celos.`
        ]
        
        txt = frasesPareja[Math.floor(Math.random() * frasesPareja.length)]
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        const frasesSolo = [
          `🤪 @${selfTag} se siente el/la más ${insulto} del grupo hoy... Por andar esperando el mensaje de alguien que ni se acuerda de su existencia.`,
          `🤡 El orgullo por el suelo: @${selfTag} admite que hizo una tremenda pendejada por una persona fría que prefiere ignorarle.`,
          `😂 @${selfTag} se corona oficialmente como el/la ${insulto} del chat. Una coraza de cinismo para no aceptar que le duele la distancia.`,
          `💥 @${selfTag} se insulta en solitario frente a la pantalla vacía. ¡Ya ubícate y deja de rogarle atención a quien no la merece!`,
          `🩹 Con el corazón lastimado y cara de payaso, @${selfTag} camina solo. Cansado/a de actuar como un/a ${insulto} por puros celos mudos.`
        ]
        
        txt = frasesSolo[Math.floor(Math.random() * frasesSolo.length)]
      }

      const gifPath = join(process.cwd(), 'media', 'pendejo.mp4')
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