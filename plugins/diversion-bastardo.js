// plugins/bastardo.js
import { readFileSync } from 'fs'
import { join } from 'path'
import { getRealJid } from '../utils/jid.js'

export default {
  command:   ['bastarda', 'bastardo', 'bstrd'],
  tag:       'bastardo',
  categoria: 'diversion',
  owner:     false,
  group:     false,
  nsfw:      false,
  descripcion: 'Envía un gif de bastardo',

  async execute(sock, msg, { from, args }) {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const usedCommand = textMsg.split(' ')[0].slice(1).toLowerCase() || 'bastardo'
    const esFemenino = usedCommand === 'bastarda'

    await sock.sendMessage(from, { react: { text: '😈', key: msg.key } })

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
        
        if (esFemenino) {
          const frasesParejaFem = [
            `😈 @${selfTag} miró fijamente a @${victimTag} y le soltó un frío: ¡bastarda! El orgullo dolió tanto como los celos silenciosos del pasado. 💅`,
            `🔥 Con la tensión al límite, @${selfTag} llamó bastarda a @${victimTag}... Una provocación que esconde reclamos guardados en el pecho.`,
            `💥 @${selfTag} no pudo contenerse más y tildó de bastarda a @${victimTag}. Rompiendo la tregua y dejando expuestas las verdades que callaban.`,
            `🎭 @${selfTag} le arrojó el término bastarda a @${victimTag}. Una forma despiadada de esconder su propia vulnerabilidad en el chat.`,
            `📜 El veneno está suelto: @${selfTag} llamó bastarda a @${victimTag}... Un quiebre absoluto que despertó murmullos en todo el grupo.`
          ]
          txt = frasesParejaFem[Math.floor(Math.random() * frasesParejaFem.length)]
        } else {
          const frasesParejaMas = [
            `😈 @${selfTag} se plantó frente a @${victimTag} y le gritó: ¡bastardo! Un golpe directo al ego que reaviva viejos resentimientos.`,
            `🔥 La paciencia se agotó: @${selfTag} llamó bastardo a @${victimTag}... Desafiando el orgullo que tantas veces los ha distanciado.`,
            `💥 @${selfTag} le soltó un crudo bastardo a @${victimTag}. Hay palabras que se dicen para herir, pero solo demuestran cuánta atención sigues prestando.`,
            `🎭 @${selfTag} catalogó de bastardo a @${victimTag}. Una máscara de frialdad para tapar el drama y las dudas que carcomen la complicidad.`,
            `📜 Con rabia acumulada, @${selfTag} tildó de bastardo a @${victimTag}. Dejando en claro que la desconfianza ganó la partida esta vez.`
          ]
          txt = frasesParejaMas[Math.floor(Math.random() * frasesParejaMas.length)]
        }
      } 
      else {
        if (victima === selfJid) {
          mentions.push(selfJid)
        }
        
        if (esFemenino) {
          const frasesSoloFem = [
            `💅 @${selfTag} se vistió de villana absoluta. El orgullo la protege, pero el vacío a su alrededor se nota a kilómetros.`,
            `🔥 @${selfTag} anda en su era más fría y calculadora hoy. Nadie tiene el valor de hacerle frente.`,
            `👑 @${selfTag} se declaró la reina indiscutible del drama, dejando en claro que no necesita la validación de nadie.`,
            `😈 @${selfTag} prefiere que la llamen bastarda antes de admitir que extraña el afecto que le fue negado.`,
            `🩹 @${selfTag} levantó sus defensas. Escondiendo un corazón lastimado detrás de una actitud desafiante y soberbia.`
          ]
          txt = frasesSoloFem[Math.floor(Math.random() * frasesSoloFem.length)]
        } else {
          const frasesSoloMas = [
            `😈 @${selfTag} adoptó el papel de villano. Una coraza perfecta para ocultar que se quedó esperando un mensaje que nunca llegó.`,
            `🔥 @${selfTag} anda de bastardo y rebelde hoy... Buscando llamar la atención de un corazón que prefiere el silencio.`,
            `👑 @${selfTag} se coronó como el más desalmado del grupo. Su orgullo brilla, pero la soledad en el chat le pasa factura.`,
            `🎭 @${selfTag} presume su faceta más dura. Un refugio desesperado para no aceptar que las dudas lo están consumiendo por dentro.`,
            `🩹 @${selfTag} camina solo y con paso firme. Demostrando que un alma indomable no se dobla ante el orgullo de los demás.`
          ]
          txt = frasesSoloMas[Math.floor(Math.random() * frasesSoloMas.length)]
        }
      }

      const gifPath = join(process.cwd(), 'media', 'bastardo.mp4')
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